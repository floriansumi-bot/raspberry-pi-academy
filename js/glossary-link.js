/* glossary-link.js — auto-link glossary terms in prose with hover definition cards.
   Longest-match, first-occurrence-per-chapter, never inside code/links/headings. */
import { loadGlossary } from './content.js';
import { store } from './store.js';

let TERMS = null;     // [{term, def, re}]
let MAP = null;       // lower(term) -> def
let pop = null;

const SKIP = new Set(['THIS', 'WITH', 'YOUR', 'THAT', 'HAVE']);

async function prep() {
  if (TERMS) return;
  const g = await loadGlossary();
  MAP = {};
  TERMS = g
    .map((e) => ({ term: e.term, def: e.def }))
    .filter((e) => e.term.length >= 3 && !SKIP.has(e.term.toUpperCase()))
    .sort((a, b) => b.term.length - a.term.length);
  for (const e of TERMS) MAP[e.term.toLowerCase()] = e.def;
}

function esc(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

export async function linkGlossary(root) {
  await prep();
  const used = new Set();
  let count = 0;
  const MAXLINKS = 60;

  // build a single regex of all remaining terms (word-ish boundaries)
  const pattern = new RegExp('\\b(' + TERMS.map((t) => esc(t.term)).join('|') + ')\\b');

  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      if (!node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
      let p = node.parentElement;
      while (p && p !== root) {
        const tag = p.tagName;
        if (tag === 'CODE' || tag === 'PRE' || tag === 'A' || /^H[1-4]$/.test(tag) ||
            p.classList.contains('gloss-term') || p.classList.contains('keyterms') ||
            p.classList.contains('copy-btn')) return NodeFilter.FILTER_REJECT;
        p = p.parentElement;
      }
      return NodeFilter.FILTER_ACCEPT;
    }
  });

  const targets = [];
  let n;
  while ((n = walker.nextNode())) targets.push(n);

  for (const node of targets) {
    if (count >= MAXLINKS) break;
    let text = node.nodeValue;
    const m = pattern.exec(text);
    if (!m) continue;
    const term = m[1];
    const lo = term.toLowerCase();
    if (used.has(lo)) continue;
    if (!MAP[lo]) continue;
    used.add(lo); count++;
    const before = text.slice(0, m.index);
    const after = text.slice(m.index + term.length);
    const span = document.createElement('span');
    span.className = 'gloss-term';
    span.dataset.term = term;
    span.tabIndex = 0;
    span.textContent = term;
    const frag = document.createDocumentFragment();
    if (before) frag.append(document.createTextNode(before));
    frag.append(span);
    if (after) frag.append(document.createTextNode(after));
    node.replaceWith(frag);
  }
}

/* one delegated popover for the whole app */
function ensurePop() {
  if (pop) return pop;
  pop = document.createElement('div');
  pop.className = 'gloss-pop hidden';
  document.getElementById('overlay-host')?.append(pop) || document.body.append(pop);
  return pop;
}
function show(span) {
  const term = span.dataset.term;
  const def = MAP?.[term.toLowerCase()];
  if (!def) return;
  const p = ensurePop();
  p.innerHTML = `<span class="gt">${term}</span>${def}`;
  p.classList.remove('hidden');
  const r = span.getBoundingClientRect();
  const pw = Math.min(320, innerWidth * 0.8);
  p.style.width = pw + 'px';
  let left = r.left + scrollX; if (left + pw > scrollX + innerWidth - 12) left = scrollX + innerWidth - pw - 12;
  p.style.left = Math.max(8, left) + 'px';
  const ph = p.offsetHeight;
  let top = r.bottom + scrollY + 8;
  if (r.bottom + ph + 16 > innerHeight) top = r.top + scrollY - ph - 8;
  p.style.top = top + 'px';
  store.addTerm(term);
}
function hide() { pop?.classList.add('hidden'); }

let bound = false;
export function initGlossaryHover() {
  if (bound) return; bound = true;
  document.addEventListener('mouseover', (e) => { const t = e.target.closest?.('.gloss-term'); if (t) show(t); });
  document.addEventListener('mouseout', (e) => { if (e.target.closest?.('.gloss-term')) hide(); });
  document.addEventListener('focusin', (e) => { const t = e.target.closest?.('.gloss-term'); if (t) show(t); });
  document.addEventListener('focusout', hide);
  document.addEventListener('click', (e) => {
    const t = e.target.closest?.('.gloss-term');
    if (t && matchMedia('(hover: none)').matches) { e.preventDefault(); pop && !pop.classList.contains('hidden') ? hide() : show(t); }
    else if (!e.target.closest?.('.gloss-pop')) hide();
  });
  addEventListener('scroll', hide, { passive: true });
}
