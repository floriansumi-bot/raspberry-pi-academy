/* views/glossary.js — searchable A–Z glossary tool */
import { el, toolHeader } from '../ui.js';
import { loadGlossary } from '../content.js';

export async function renderGlossary(params, view) {
  const terms = await loadGlossary();
  const target = new URLSearchParams(location.hash.split('?')[1] || '').get('t');

  const wrap = el('div', { class: 'toolpage' });
  wrap.append(...toolHeader('Reference', 'Glossary',
    `Every significant term in the course — ${terms.length} of them — explained in plain English. Search, or browse A to Z.`));

  const search = el('input', { class: 'field tool-search', type: 'search', placeholder: 'Search terms… (e.g. GPIO, sudo, DNS)', 'aria-label': 'Search glossary' });
  const list = el('div');
  wrap.append(search, list);
  view.append(wrap);

  function draw(q) {
    list.innerHTML = '';
    const ql = (q || '').trim().toLowerCase();
    const filtered = terms.filter((t) => !ql || t.term.toLowerCase().includes(ql) || t.def.toLowerCase().includes(ql));
    if (!filtered.length) { list.append(el('p', { class: 'muted tool-empty', text: 'No terms match that.' })); return; }
    let letter = '';
    filtered.forEach((t) => {
      const L = t.term[0].toUpperCase();
      if (L !== letter && !ql) { letter = L; list.append(el('h2', { class: 'gloss-letter', id: 'gl-' + L, text: L })); }
      list.append(el('div', { class: 'gloss-entry', id: 'term-' + t.term.toLowerCase().replace(/\s+/g, '-') },
        el('strong', { text: t.term }),
        el('div', { class: 'gloss-def', html: t.def })
      ));
    });
  }
  draw('');
  search.addEventListener('input', () => draw(search.value));

  if (target) {
    search.value = target; draw(target);
    setTimeout(() => {
      const node = list.querySelector('.gloss-entry');
      node?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      node?.classList.add('target');
    }, 60);
  }
}
