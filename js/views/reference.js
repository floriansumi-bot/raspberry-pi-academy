/* views/reference.js — Appendix A as a filterable, copyable command cheat-sheet */
import { el, toast, toolHeader } from '../ui.js';
import { loadChapterHTML } from '../content.js';
import { enhanceCode } from '../enhance.js';

export async function renderReference(params, view) {
  const html = await loadChapterHTML('apxA');
  const wrap = el('div', { class: 'toolpage' });
  wrap.append(...toolHeader('Reference', 'Command quick-reference',
    'The most useful commands from the whole course. Filter, then click any command to copy it.'));
  const search = el('input', { class: 'field tool-search sticky', type: 'search', placeholder: 'Filter commands… (e.g. apt, network, ssh)', 'aria-label': 'Filter commands' });
  const prose = el('div', { class: 'prose' });
  prose.innerHTML = html;
  wrap.append(search, prose);
  view.append(wrap);
  enhanceCode(prose, {});

  // make command cells click-to-copy
  prose.querySelectorAll('.tbl td code, .tbl td:first-child').forEach((cell) => {
    const codeEl = cell.matches('code') ? cell : cell.querySelector('code');
    if (!codeEl) return;
    codeEl.style.cursor = 'pointer'; codeEl.title = 'Click to copy';
    codeEl.addEventListener('click', async () => {
      try { await navigator.clipboard.writeText(codeEl.textContent); toast('Copied: <code style="color:var(--bg)">' + codeEl.textContent + '</code>'); } catch {}
    });
  });
  // wrap tables for horizontal scroll
  prose.querySelectorAll('.tbl').forEach((t) => { if (!t.parentElement.classList.contains('tbl-wrap')) { const w = el('div', { class: 'tbl-wrap' }); t.replaceWith(w); w.append(t); } });

  const rows = [...prose.querySelectorAll('.tbl tbody tr')];
  search.addEventListener('input', () => {
    const q = search.value.trim().toLowerCase();
    rows.forEach((r) => { r.style.display = (!q || r.textContent.toLowerCase().includes(q)) ? '' : 'none'; });
    // hide empty tables/headings
    prose.querySelectorAll('.tbl-wrap').forEach((w) => {
      const vis = [...w.querySelectorAll('tbody tr')].some((r) => r.style.display !== 'none');
      w.style.display = vis ? '' : 'none';
    });
  });
}
