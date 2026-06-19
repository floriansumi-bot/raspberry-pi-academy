/* search.js — lazy-loaded full-text search over chapters + headings.
   The ~775KB index is only fetched on first use (⌘K or terminal `find`). */

let _index = null;
let _loading = null;

export function loadIndex() {
  if (_index) return Promise.resolve(_index);
  if (_loading) return _loading;
  _loading = fetch('./content/search-index.json')
    .then((r) => r.json())
    .then((d) => { _index = d; return d; });
  return _loading;
}
export function ready() { return !!_index; }

function snippet(text, q) {
  const i = text.toLowerCase().indexOf(q.toLowerCase());
  if (i < 0) return text.slice(0, 120) + '…';
  const start = Math.max(0, i - 45);
  return (start > 0 ? '…' : '') + text.slice(start, i + q.length + 75).trim() + '…';
}

/* returns [{id,n,title,part,kind,score,snippet,where}] */
export async function query(q, limit = 24) {
  q = q.trim();
  if (!q) return [];
  await loadIndex();
  const ql = q.toLowerCase();
  const terms = ql.split(/\s+/).filter(Boolean);
  const out = [];
  for (const ch of _index) {
    let score = 0; let where = '';
    const title = ch.title.toLowerCase();
    if (title.includes(ql)) score += 60;
    for (const t of terms) if (title.includes(t)) score += 18;
    for (const h of ch.headings || []) {
      const hl = h.toLowerCase();
      if (hl.includes(ql)) { score += 28; where = h; }
      else for (const t of terms) if (hl.includes(t)) { score += 8; if (!where) where = h; }
    }
    const tl = ch.text.toLowerCase();
    if (tl.includes(ql)) score += 14;
    let allTerms = true;
    for (const t of terms) { if (!tl.includes(t) && !title.includes(t)) allTerms = false; }
    if (allTerms && terms.length > 1) score += 10;
    if (score > 0) {
      out.push({
        id: ch.id, n: ch.n, title: ch.title, part: ch.part, kind: ch.kind,
        score, where, snippet: snippet(ch.text, q)
      });
    }
  }
  out.sort((a, b) => b.score - a.score);
  return out.slice(0, limit);
}
