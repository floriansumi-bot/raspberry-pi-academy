/* views/home.js — landing hero + the winding learning Path (the spine) */
import { el, ring, icon } from '../ui.js';
import { store } from '../store.js';
import { parts, getChapter, order, stats, routeFor } from '../content.js';
import { onCleanup } from '../router.js';

let _io = null;        // path connector observer, disconnected on re-render
let _justDone = null;  // chapter just completed, for the one-shot reward

const PART_NUM = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', '—'];

function firstIncomplete() {
  const o = order();
  return o.find((id) => !store.isComplete(id)) || o[o.length - 1];
}

export async function renderHome(params, view) {
  const st = store.get();
  const s = stats(st);
  const cont = st.last || firstIncomplete();

  // ---------- HERO ----------
  const hero = el('section', { class: 'hero' });
  const heroGrid = el('div', { class: 'hero-grid wrap' });

  const copy = el('div', { class: 'hero-copy' },
    el('span', { class: 'eyebrow', text: 'The Raspberry Pi 5 course' }),
    el('h1', { html: 'Learn your <span class="berry">Raspberry&nbsp;Pi&nbsp;5</span>.<br>From first boot to building real things.' }),
    el('p', { class: 'sub', text: 'The complete 447-page handbook, reborn as a friendly course you can actually finish — with a real Pi terminal and a wireable circuit board you can try right here in your browser.' }),
    el('div', { class: 'cta-row' },
      el('a', { class: 'btn btn-primary', href: '#/chapter/' + (s.done ? cont : 'ch01') }, (s.done ? 'Continue learning' : 'Start the path'), el('span', { html: icon('arrow', 18) })),
      el('a', { class: 'btn btn-ghost', href: '#explore-board' }, 'Explore the board')
    ),
    el('div', { class: 'reassure' },
      el('span', { text: 'No experience needed' }),
      el('span', { text: 'Works offline' }),
      el('span', { text: 'Free' }),
      el('span', { text: 'Nothing here can break your Pi' })
    )
  );

  const boardWrap = el('div', { class: 'hero-board', id: 'explore-board' },
    el('div', { class: 'board-frame' },
      el('div', { class: 'bf-head' }, el('span', { class: 'eyebrow', text: 'Your board' }), el('span', { class: 'muted', style: { fontSize: '.74rem' }, text: 'tap a part →' })),
      el('div', { class: 'board-mount', id: 'hero-board-mount', style: { minHeight: '230px', display: 'grid', placeItems: 'center' } },
        el('div', { class: 'board-skeleton', 'aria-hidden': 'true' })),
      el('div', { class: 'board-hint', text: 'Click any component to learn what it does.' })
    )
  );

  heroGrid.append(copy, boardWrap);
  hero.append(heroGrid);
  hero.append(el('div', { class: 'scroll-cue' },
    el('button', { onClick: () => document.getElementById('path-top')?.scrollIntoView({ behavior: 'smooth' }) },
      el('span', { text: 'The journey' }), el('span', { class: 'chev', html: '↓' }))
  ));
  view.append(hero);

  // mount interactive board (graceful if module not yet present)
  import('../widgets/board.js').then((m) => {
    const dispose = m.mount(document.getElementById('hero-board-mount'), { navigate: (h) => (location.hash = h), compact: true });
    if (typeof dispose === 'function') onCleanup(dispose);
  }).catch(() => {
    const mnt = document.getElementById('hero-board-mount');
    if (mnt) mnt.innerHTML = '<div style="text-align:center;color:var(--ink-soft)"><div style="font-size:3rem">🍓</div>The interactive board loads here.</div>';
  });

  // ---------- PATH ----------
  const section = el('section', { class: 'path-section wrap', id: 'path-top' });
  section.append(el('div', { class: 'path-intro' },
    el('h2', { text: 'Your learning path' }),
    el('p', { text: `${s.total} lessons, grouped into ${parts().length} parts. ${s.done}/${s.total} complete — go in order, or jump to whatever you want to build.` })
  ));

  // "continue where you left off" nudge — gentle, dismissible per session
  let dismissed = false;
  try { dismissed = sessionStorage.getItem('pilot.nudge.dismissed') === '1'; } catch {}
  if (s.done > 0 && cont && !dismissed) {
    const ch = getChapter(cont);
    const r = ring(40, 5); r.set(s.pct);
    const nudge = el('div', { class: 'continue-nudge' },
      r.node,
      el('div', { class: 'cn-main' },
        el('div', { class: 'cn-kicker', text: 'Pick up where you left off' }),
        el('a', { class: 'cn-title', href: linkFor(ch) }, ch.title, el('span', { html: ' ' + icon('arrow', 16) }))
      ),
      el('button', { class: 'cn-dismiss', 'aria-label': 'Dismiss', html: icon('close', 16), onClick: (e) => { e.currentTarget.closest('.continue-nudge').remove(); try { sessionStorage.setItem('pilot.nudge.dismissed', '1'); } catch {} } })
    );
    section.append(nudge);
  }

  for (const part of parts()) {
    const pIdx = parts().indexOf(part);
    const block = el('div', { class: 'part-block' });
    block.append(el('div', { class: 'part-banner' },
      el('span', { class: 'pnum', text: 'Part ' + PART_NUM[pIdx] }),
      el('span', { class: 'pname', text: part.label }),
      el('span', { class: 'pline' }),
      el('span', { class: 'pcount', text: part.chapters.length + ' lessons' })
    ));
    const trail = el('div', { class: 'trail' });
    const svg = el('div'); // placeholder; connectors drawn after layout
    trail.innerHTML = '<svg class="trail-svg" preserveAspectRatio="none"></svg>';

    part.chapters.forEach((cid, idx) => {
      const ch = getChapter(cid);
      const done = store.isComplete(cid);
      const visited = !!st.visited[cid];
      const isCurrent = cid === cont && !done;
      const cls = ['node', idx % 2 === 1 ? 'rt' : 'lt', ch.kind === 'project' ? 'project' : '', done ? 'done' : (visited ? 'inprogress' : ''), isCurrent ? 'current' : ''].filter(Boolean).join(' ');
      const r = ring(34, 4);
      r.set(done ? 1 : (st.quizScores[cid] ? st.quizScores[cid].score / st.quizScores[cid].total * 0.9 : (visited ? 0.12 : 0)));
      const badgeLabel = ch.kind === 'appendix' ? 'A' : ch.kind === 'glossary' ? '§' : String(ch.n);
      const node = el('div', { class: cls, id: cid },
        el('span', { class: 'here', text: s.done === 0 ? 'Begin here' : 'you are here' }),
        el('a', { class: 'node-link', href: linkFor(ch) },
          el('span', { class: 'node-badge' }, el('span', { class: 'nb-num', text: badgeLabel })),
          el('span', { class: 'node-main' },
            el('span', { class: 'nt', text: ch.title }),
            el('span', { class: 'nm' },
              el('span', { text: ch.kind === 'project' ? 'Project' : (ch.kind === 'appendix' ? 'Reference' : (ch.kind === 'glossary' ? 'Reference' : 'Lesson')) }),
              el('span', { text: ch.read_min + ' min' })
            )
          ),
          el('span', { class: 'node-ring' }, r.node)
        )
      );
      trail.append(node);
    });
    block.append(trail);
    section.append(block);
  }
  view.append(section);

  // lesson-complete reward (works on mobile + desktop): power-on the next node
  _justDone = store.consumeJustCompleted();
  if (_justDone) {
    const o = order(); const ni = o.indexOf(_justDone);
    const nextId = ni >= 0 ? o[ni + 1] : null;
    const target = document.getElementById(nextId) || document.getElementById(_justDone);
    if (target) {
      requestAnimationFrame(() => target.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'center' }));
      const nextNode = document.getElementById(nextId);
      if (nextNode) { nextNode.classList.add('powering'); setTimeout(() => nextNode.classList.remove('powering'), 1700); }
    }
  }

  requestAnimationFrame(() => drawConnectors(section, true));
  // settle-retry only if the first measure happened before layout was ready
  const t = setTimeout(() => { if (!section.querySelector('.trail-seg')) drawConnectors(section, true); }, 180);
  let rt;
  const onResize = () => { clearTimeout(rt); rt = setTimeout(() => drawConnectors(section, false), 180); };
  addEventListener('resize', onResize);
  onCleanup(() => { removeEventListener('resize', onResize); clearTimeout(t); clearTimeout(rt); if (_io) { _io.disconnect(); _io = null; } });
}

const linkFor = (ch) => routeFor(ch.id);

/* draw circuit-trace connectors between node badges; etch in on scroll, and
   replay a copper trace-fill toward the just-completed lesson's next node. */
function drawConnectors(scope, animate) {
  if (matchMedia('(max-width:880px)').matches) return;
  if (_io) { _io.disconnect(); _io = null; }
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const justDone = _justDone;

  if (animate && !reduce) _io = new IntersectionObserver((entries, obs) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      const p = e.target, len = +p.dataset.len;
      p.style.transition = 'stroke-dashoffset .7s var(--ease-out), opacity .5s ease';
      p.style.strokeDashoffset = p.classList.contains('lit') ? '0' : (len + ' ');  // lit: draw solid; dotted: just reveal
      p.style.opacity = '1';
      obs.unobserve(p);
    });
  }, { threshold: .15 });

  scope.querySelectorAll('.trail').forEach((trail) => {
    const svg = trail.querySelector('.trail-svg');
    if (!svg) return;
    const nodes = [...trail.querySelectorAll('.node')];
    const tb = trail.getBoundingClientRect();
    svg.setAttribute('viewBox', `0 0 ${tb.width} ${tb.height}`);
    svg.setAttribute('width', tb.width); svg.setAttribute('height', tb.height);
    let html = '';
    for (let i = 0; i < nodes.length - 1; i++) {
      const a = nodes[i].querySelector('.node-badge').getBoundingClientRect();
      const b = nodes[i + 1].querySelector('.node-badge').getBoundingClientRect();
      const ax = a.left + a.width / 2 - tb.left, ay = a.top + a.height / 2 - tb.top;
      const bx = b.left + b.width / 2 - tb.left, by = b.top + b.height / 2 - tb.top;
      const my = (ay + by) / 2;
      const lit = nodes[i].classList.contains('done');
      const from = nodes[i].id || '';
      html += `<path class="trail-seg ${lit ? 'lit' : ''}" data-from="${from}" d="M${ax} ${ay} C ${ax} ${my}, ${bx} ${my}, ${bx} ${by}"/>`;
    }
    svg.innerHTML = html;

    svg.querySelectorAll('.trail-seg').forEach((p) => {
      const len = p.getTotalLength();
      p.dataset.len = len;
      if (justDone && p.getAttribute('data-from') === justDone) return; // reward block owns this one
      const lit = p.classList.contains('lit');
      p.style.strokeDasharray = lit ? `${len}` : '2 9';
      if (animate && !reduce && _io) {
        p.style.strokeDashoffset = len;
        p.style.opacity = lit ? '1' : '0';
        _io.observe(p);
      } else {
        p.style.strokeDashoffset = '0'; p.style.opacity = '1';
      }
    });

    // lesson-complete reward: copper pulse along the connector to the next node (desktop)
    if (justDone) {
      const seg = svg.querySelector(`.trail-seg[data-from="${justDone}"]`);
      if (seg) {
        const len = +seg.dataset.len;
        seg.classList.add('lit', 'copper');
        seg.style.strokeDasharray = `${len}`;
        seg.style.opacity = '1';
        seg.style.strokeDashoffset = '0';
        if (animate && !reduce && seg.animate) {
          seg.animate([{ strokeDashoffset: len }, { strokeDashoffset: 0 }], { duration: 1000, easing: 'cubic-bezier(.22,.61,.36,1)', fill: 'forwards' });
        }
      }
    }
  });
}
