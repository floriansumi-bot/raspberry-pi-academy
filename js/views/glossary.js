/* views/glossary.js — searchable A–Z glossary tool */
import { el } from '../ui.js';
import { loadGlossary } from '../content.js';

export async function renderGlossary(params, view) {
  const terms = await loadGlossary();
  const target = new URLSearchParams(location.hash.split('?')[1] || '').get('t');

  const wrap = el('div', { class: 'wrap', style: { paddingBlock: '2.5rem 5rem', maxWidth: '900px' } });
  wrap.append(
    el('span', { class: 'eyebrow', text: 'Reference' }),
    el('h1', { style: { fontSize: 'var(--step-3)', margin: '.3rem 0 .4rem' }, text: 'Glossary' }),
    el('p', { class: 'muted', text: `Every significant term in the course — ${terms.length} of them — explained in plain English. Search, or browse A to Z.` })
  );

  const search = el('input', {
    type: 'search', placeholder: 'Search terms… (e.g. GPIO, sudo, DNS)', 'aria-label': 'Search glossary',
    style: { width: '100%', padding: '.8rem 1rem', margin: '1.4rem 0', borderRadius: '12px', border: '1px solid var(--line)', background: 'var(--surface)', fontSize: '1rem' }
  });
  wrap.append(search);

  const list = el('div');
  wrap.append(list);
  view.append(wrap);

  function draw(q) {
    list.innerHTML = '';
    const ql = (q || '').trim().toLowerCase();
    const filtered = terms.filter((t) => !ql || t.term.toLowerCase().includes(ql) || t.def.toLowerCase().includes(ql));
    if (!filtered.length) { list.append(el('p', { class: 'muted', style: { textAlign: 'center', padding: '2rem' }, text: 'No terms match that.' })); return; }
    let letter = '';
    filtered.forEach((t) => {
      const L = t.term[0].toUpperCase();
      if (L !== letter && !ql) {
        letter = L;
        list.append(el('h2', { id: 'gl-' + L, style: { fontFamily: 'var(--font-mono)', color: 'var(--accent2)', fontSize: '1rem', margin: '1.6rem 0 .6rem', borderBottom: '1px solid var(--line)', paddingBottom: '.3rem' }, text: L }));
      }
      const row = el('div', {
        id: 'term-' + t.term.toLowerCase().replace(/\s+/g, '-'),
        style: { padding: '.9rem 1rem', borderRadius: '12px', border: '1px solid var(--line)', background: 'var(--surface)', marginBottom: '.6rem', boxShadow: 'var(--shadow)' }
      },
        el('strong', { style: { color: 'var(--accent)', fontFamily: 'var(--font-display)', fontSize: '1.05rem' }, text: t.term }),
        el('div', { class: 'gloss-def', html: t.def, style: { marginTop: '.3rem', fontSize: '.92rem', lineHeight: '1.55' } })
      );
      list.append(row);
    });
  }
  draw('');
  search.addEventListener('input', () => draw(search.value));

  if (target) {
    search.value = target; draw(target);
    setTimeout(() => {
      const node = list.querySelector('div[id^="term-"]');
      node?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      if (node) { node.style.borderColor = 'var(--accent)'; node.style.boxShadow = '0 0 0 3px var(--accent-soft)'; }
    }, 60);
  }
}
