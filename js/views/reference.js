/* views/reference.js — Appendix A as a filterable, copyable command cheat-sheet */
import { el, toast } from '../ui.js';
import { loadChapterHTML } from '../content.js';
import { enhanceCode } from '../enhance.js';

export async function renderReference(params, view) {
  const html = await loadChapterHTML('apxA');
  const wrap = el('div', { class: 'wrap', style: { paddingBlock: '2.5rem 5rem', maxWidth: '920px' } });
  wrap.append(
    el('span', { class: 'eyebrow', text: 'Reference' }),
    el('h1', { style: { fontSize: 'var(--step-3)', margin: '.3rem 0 .4rem' }, text: 'Command quick-reference' }),
    el('p', { class: 'muted', text: 'The most useful commands from the whole course. Filter, then click any command to copy it.' })
  );
  const search = el('input', {
    type: 'search', placeholder: 'Filter commands… (e.g. apt, network, ssh)', 'aria-label': 'Filter commands',
    style: { width: '100%', padding: '.8rem 1rem', margin: '1.4rem 0', borderRadius: '12px', border: '1px solid var(--line)', background: 'var(--surface)', fontSize: '1rem', position: 'sticky', top: 'calc(var(--topbar-h) + 8px)', zIndex: '10' }
  });
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
