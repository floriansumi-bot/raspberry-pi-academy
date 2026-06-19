/* overlays.js — ⌘K command palette + terminal overlay launcher */
import { el, icon, trapFocus } from './ui.js';
import { query as searchQuery } from './search.js';
import { loadGlossary, getChapter, routeFor } from './content.js';

let paletteOpen = false;

const ACTIONS = [
  { title: 'Go to the Learning Path', sub: 'Home', icon: '↗', go: '#/' },
  { title: 'Open the Pi Terminal', sub: 'Try real commands', icon: '▶', run: () => openTerminalOverlay('') },
  { title: 'Glossary', sub: 'Every term, plain English', icon: '§', go: '#/glossary' },
  { title: 'Command Quick-Reference', sub: 'Cheat-sheet', icon: '⌘', go: '#/reference' },
  { title: 'My Pi — progress & badges', sub: 'Dashboard', icon: '◉', go: '#/me' },
  { title: 'Tools', sub: 'Terminal & GPIO sandbox', icon: '⚙', go: '#/tools' },
  { title: 'Toggle Daylight / Workbench theme', sub: 'Appearance', icon: '☼', run: () => document.getElementById('theme-toggle')?.click() },
  { title: 'Download the full 447-page PDF', sub: 'Handbook', icon: '⤓', href: './assets/Raspberry-Pi-5-Handbook.pdf' },
];

export function openPalette() {
  if (paletteOpen) return;
  paletteOpen = true;
  const host = document.getElementById('overlay-host');
  const back = el('div', { class: 'palette-backdrop' });
  const box = el('div', { class: 'palette', role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Search lessons, terms and commands' });
  const input = el('input', { type: 'text', placeholder: 'Search lessons, terms, commands…', 'aria-label': 'Search', role: 'combobox', 'aria-expanded': 'true', 'aria-controls': 'palette-results', autocomplete: 'off', spellcheck: 'false' });
  const results = el('div', { class: 'palette-results', id: 'palette-results', role: 'listbox', 'aria-label': 'Results' });
  box.append(
    el('div', { class: 'palette-input' }, el('span', { html: icon('search', 20) }), input),
    results,
    el('div', { class: 'palette-foot' }, el('span', { html: '<kbd>↑</kbd><kbd>↓</kbd> navigate' }), el('span', { html: '<kbd>↵</kbd> open' }), el('span', { html: '<kbd>esc</kbd> close' }))
  );
  back.append(box); host.append(back);
  input.focus();
  const release = trapFocus(box, () => close());

  let items = [];   // flat selectable list
  let sel = 0;
  let glossary = null;
  loadGlossary().then((g) => (glossary = g));

  function close() { paletteOpen = false; release(); back.remove(); }
  back.addEventListener('mousedown', (e) => { if (e.target === back) close(); });

  async function run(q) {
    q = q.trim();
    results.innerHTML = '';
    items = [];
    const groups = [];

    // actions (filter)
    const acts = ACTIONS.filter((a) => !q || (a.title + ' ' + a.sub).toLowerCase().includes(q.toLowerCase()));
    if (acts.length) groups.push(['Actions', acts.map((a) => ({ ...a, _type: 'action' }))]);

    if (q) {
      const hits = await searchQuery(q, 12);
      if (hits.length) groups.push(['Lessons', hits.map((h) => ({
        title: h.title, sub: (h.where ? h.where + ' · ' : '') + h.snippet, icon: h.kind === 'project' ? '⚒' : String(h.n),
        go: routeFor(h.id), _type: 'lesson'
      }))]);
      if (glossary) {
        const gl = glossary.filter((e) => e.term.toLowerCase().includes(q.toLowerCase())).slice(0, 8);
        if (gl.length) groups.push(['Glossary', gl.map((e) => ({
          title: e.term, sub: stripTags(e.def).slice(0, 70) + '…', icon: '§', go: '#/glossary?t=' + encodeURIComponent(e.term), _type: 'term'
        }))]);
      }
    }

    if (!groups.length) { results.append(el('div', { class: 'palette-empty', text: 'No matches. Try “gpio”, “update”, or “ssh”.' })); return; }

    groups.forEach(([label, list]) => {
      results.append(el('div', { class: 'palette-group-label', text: label }));
      list.forEach((it) => {
        const idx = items.length;
        const row = el('div', { class: 'palette-item', role: 'option', 'data-idx': idx },
          el('span', { class: 'pi-ic', text: it.icon }),
          el('span', { class: 'pi-main' }, el('div', { class: 'pi-title', text: it.title }), el('div', { class: 'pi-sub', text: it.sub || '' }))
        );
        row.addEventListener('mouseenter', () => { sel = idx; paint(); });
        row.addEventListener('click', () => activate(it));
        items.push({ it, row });
        results.append(row);
      });
    });
    sel = 0; paint();
  }

  function paint() { items.forEach((x, i) => x.row.classList.toggle('sel', i === sel)); items[sel]?.row.scrollIntoView({ block: 'nearest' }); }
  function activate(it) {
    if (it.href) { window.open(it.href, '_blank'); close(); return; }
    if (it.run) { close(); it.run(); return; }
    if (it.go) { close(); location.hash = it.go; }
  }

  input.addEventListener('input', () => run(input.value));
  input.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); sel = Math.min(items.length - 1, sel + 1); paint(); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); sel = Math.max(0, sel - 1); paint(); }
    else if (e.key === 'Enter') { e.preventDefault(); if (items[sel]) activate(items[sel].it); }
  });
  run('');
}

function stripTags(s) { return s.replace(/<[^>]+>/g, ''); }

/* ---- terminal overlay ---- */
export function openTerminalOverlay(cmd = '') {
  const host = document.getElementById('overlay-host');
  const back = el('div', { class: 'palette-backdrop term-overlay' });
  const shell = el('div', { class: 'widget-shell term-shell', role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Pi terminal sandbox' });
  const headClose = el('button', { class: 'iconbtn', html: icon('close', 18), 'aria-label': 'Close terminal' });
  shell.append(el('div', { class: 'widget-head' },
    el('span', { class: 'wtag', text: 'Sandbox' }), el('h4', { text: 'Pi Terminal' }),
    el('span', { style: { flex: '1' } }), headClose));
  const mount = el('div', { class: 'widget-body', style: { flex: '1', overflow: 'hidden', display: 'flex' } });
  shell.append(mount); back.append(shell); host.append(back);

  let termCleanup = null;
  const release = trapFocus(shell, () => close());
  function close() {
    release();
    if (typeof termCleanup === 'function') { try { termCleanup(); } catch {} }
    back.remove();
  }
  headClose.addEventListener('click', close);
  back.addEventListener('mousedown', (e) => { if (e.target === back) close(); });

  import('./widgets/terminal.js')
    .then((m) => {
      const d = m.mount(mount, { overlay: true, initialCommand: cmd, navigate: (h) => { close(); location.hash = h; } });
      if (typeof d === 'function') termCleanup = d; else if (d && d.destroy) termCleanup = () => d.destroy();
    })
    .catch(() => { mount.innerHTML = '<div class="muted" style="padding:2rem;text-align:center">The terminal sandbox is loading…</div>'; });
}
