/* views/reader.js — the focused chapter reader */
import { el, ring, icon, toast, bloom } from '../ui.js';
import { store } from '../store.js';
import { getChapter, loadChapterHTML, neighbours, loadQuiz } from '../content.js';
import { enhanceCode } from '../enhance.js';
import { linkGlossary } from '../glossary-link.js';
import { renderQuiz } from '../quiz.js';
import { openTerminalOverlay } from '../overlays.js';

const BADGES = {
  ch04: ['first-boot', 'First Boot'], ch06: ['terminal-tamer', 'Terminal Tamer'],
  ch12: ['it-blinks', 'It Blinks!'], ch15: ['adblock-up', 'Ad-Blocker Up'],
  ch16: ['server-online', 'Home Server Online'], ch19: ['ai-on-pi', 'AI on the Pi'],
};

function linkTo(id) {
  if (id === 'glos') return '#/glossary';
  if (id === 'apxA') return '#/reference';
  return id ? '#/chapter/' + id : null;
}

export async function renderReader(params, view) {
  const id = params[0];
  const ch = getChapter(id);
  if (!ch) { view.innerHTML = '<div class="wrap" style="padding:4rem 0;text-align:center"><h2>Lesson not found</h2><a class="btn btn-ghost" href="#/">Back to the path</a></div>'; return; }

  store.visit(id);
  const html = await loadChapterHTML(id);

  // progress bar
  const prog = el('div', { class: 'reader-progress' }, el('div', { class: 'bar' }));
  const grid = el('div', { class: 'reader-grid' });

  // rail (outline)
  const rail = el('aside', { class: 'reader-rail desktop-only' });
  rail.append(el('div', { class: 'rail-title', text: 'On this page' }));
  const ol = el('ol');
  ch.sections.forEach((s) => ol.append(el('li', {}, el('a', { href: '#' + s.id, text: s.title, 'data-sec': s.id }))));
  rail.append(ol);

  // main
  const main = el('article', { class: 'reader-main' });
  const kicker = el('div', { class: 'kicker' });
  kicker.append(el('span', { class: 'eyebrow', text: ch.kind === 'project' ? 'Project' : (ch.kind === 'appendix' || ch.kind === 'glossary' ? 'Reference' : 'Lesson ' + ch.n) }));
  if (ch.kind === 'project') kicker.append(el('span', { class: 'tag project', text: 'Build' }));
  const head = el('header', { class: 'reader-head' },
    kicker,
    el('h1', { text: ch.title }),
    el('div', { class: 'meta' },
      el('span', { html: icon('book', 15) + ' ' + ch.read_min + ' min read' }),
      el('span', { html: icon('spark', 15) + ' ' + ch.words.toLocaleString() + ' words' }),
      store.isComplete(id) ? el('span', { style: { color: 'var(--success)' }, html: icon('check', 15) + ' Completed' }) : ''
    )
  );

  const prose = el('div', { class: 'prose' });
  // project power-on preview hook at very top
  if (ch.kind === 'project') prose.innerHTML = `<div class="widget-mount" data-widget="poweron" data-chapter="${id}"></div>`;
  prose.insertAdjacentHTML('beforeend', html);

  main.append(head, prose);
  grid.append(rail, main);
  view.append(prog, grid);

  // ---- enhance ----
  const ctx = { chapterId: id, hasTerminal: true, openTerminal: (cmd) => openTerminalOverlay(cmd), navigate: (h) => (location.hash = h) };
  enhanceCode(prose, ctx);
  linkGlossary(prose).catch(() => {});
  hydrateWidgets(prose, ctx);

  // ---- quiz ----
  const quiz = await loadQuiz(id);
  if (quiz && quiz.questions?.length) {
    main.append(renderQuiz(quiz, id, () => {}));
  }

  // ---- mark complete ----
  const completeBar = el('div', { class: 'complete-bar' });
  const btn = el('button', { class: 'btn btn-primary' });
  function paintBtn() {
    if (store.isComplete(id)) { btn.className = 'btn done'; btn.innerHTML = icon('check', 18) + ' Completed — nice work'; }
    else { btn.className = 'btn btn-primary'; btn.innerHTML = 'Mark this lesson complete ' + icon('check', 18); }
  }
  paintBtn();
  btn.addEventListener('click', () => {
    const now = !store.isComplete(id);
    store.setComplete(id, now);
    paintBtn();
    if (now) {
      const r = btn.getBoundingClientRect();
      bloom(r.left + r.width / 2, r.top + r.height / 2);
      if (BADGES[id] && store.award(BADGES[id][0])) toast('🏅 Badge earned: <strong>' + BADGES[id][1] + '</strong>');
      else toast('Lesson complete!');
    }
  });
  completeBar.append(btn);
  main.append(completeBar);

  // ---- prev / next ----
  const { prev, next } = neighbours(id);
  const nav = el('div', { class: 'reader-nav' });
  if (prev) { const c = getChapter(prev); nav.append(el('a', { class: 'prev', href: linkTo(prev) }, el('span', { class: 'dir', text: '← Previous' }), el('span', { class: 'ttl', text: c.title }))); }
  if (next) { const c = getChapter(next); nav.append(el('a', { class: 'next', href: linkTo(next) }, el('span', { class: 'dir', text: 'Next →' }), el('span', { class: 'ttl', text: c.title }))); }
  main.append(nav);

  // mobile jump-to
  const fab = el('button', { class: 'btn btn-soft jump-fab', html: icon('book', 16) + ' Sections' });
  fab.addEventListener('click', () => openJumpSheet(ch));
  view.append(fab);
  view.classList.add('reader');

  setupScroll(prose, prog.querySelector('.bar'), rail, id);
}

function hydrateWidgets(root, ctx) {
  root.querySelectorAll('.widget-mount[data-widget]').forEach((mountEl) => {
    const name = mountEl.dataset.widget;
    import(`../widgets/${name}.js`)
      .then((m) => m.mount(mountEl, { ...ctx, dataset: { ...mountEl.dataset } }))
      .catch((e) => {
        console.warn('widget missing:', name, e);
        mountEl.innerHTML = `<div class="widget-shell"><div class="widget-body muted" style="text-align:center;padding:1.4rem">Interactive ${name} loads here.</div></div>`;
      });
  });
}

function setupScroll(prose, bar, rail, id) {
  const headings = [...prose.querySelectorAll('h2[id]')];
  const links = new Map([...rail.querySelectorAll('a[data-sec]')].map((a) => [a.dataset.sec, a]));
  let ticking = false;
  function onScroll() {
    if (ticking) return; ticking = true;
    requestAnimationFrame(() => {
      const rect = prose.getBoundingClientRect();
      const total = prose.offsetHeight - innerHeight + 200;
      const passed = Math.min(1, Math.max(0, (-rect.top + 120) / Math.max(1, total)));
      bar.style.width = (passed * 100) + '%';
      store.setScroll(id, passed);
      // scroll spy
      let active = headings[0]?.id;
      for (const h of headings) { if (h.getBoundingClientRect().top < 140) active = h.id; }
      links.forEach((a) => a.classList.remove('active'));
      if (active && links.get(active)) links.get(active).classList.add('active');
      ticking = false;
    });
  }
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();
  // cleanup on route change
  const cleanup = () => { removeEventListener('scroll', onScroll); store.flush(); removeEventListener('hashchange', cleanup); };
  addEventListener('hashchange', cleanup);
}

function openJumpSheet(ch) {
  const host = document.getElementById('overlay-host');
  const back = el('div', { class: 'sheet-backdrop', onClick: (e) => { if (e.target === back) back.remove(); } });
  const sheet = el('div', { class: 'sheet' });
  sheet.append(el('div', { class: 'rail-title', text: 'Jump to section' }));
  ch.sections.forEach((s) => sheet.append(el('a', { href: '#' + s.id, style: { display: 'block', padding: '.6rem 0', borderBottom: '1px solid var(--line)' }, text: s.title, onClick: () => back.remove() })));
  back.append(sheet); host.append(back);
}
