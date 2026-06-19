/* content.js — load the manifest + glossary + per-chapter HTML fragments */

let _manifest = null;
let _glossary = null;
const _chapterCache = new Map();

export async function loadManifest() {
  if (_manifest) return _manifest;
  const res = await fetch('./content/manifest.json');
  _manifest = await res.json();
  return _manifest;
}
export function manifest() { return _manifest; }

export function getChapter(id) { return _manifest?.chapters?.[id] || null; }
export function order() { return _manifest?.order || []; }
export function parts() { return _manifest?.parts || []; }

export function neighbours(id) {
  const o = order(); const i = o.indexOf(id);
  return { prev: i > 0 ? o[i - 1] : null, next: i >= 0 && i < o.length - 1 ? o[i + 1] : null };
}

/* the canonical hash route for a chapter id (the two reference sections get their
   own tool routes; everything else opens in the reader). */
export function routeFor(id) {
  if (id === 'glos') return '#/glossary';
  if (id === 'apxA') return '#/reference';
  return '#/chapter/' + id;
}

export async function loadChapterHTML(id) {
  if (_chapterCache.has(id)) return _chapterCache.get(id);
  const res = await fetch(`./content/chapters/${id}.html`);
  if (!res.ok) throw new Error('chapter not found: ' + id);
  const html = await res.text();
  _chapterCache.set(id, html);
  return html;
}

export async function loadGlossary() {
  if (_glossary) return _glossary;
  const res = await fetch('./content/glossary.json');
  _glossary = await res.json();
  return _glossary;
}
export function glossary() { return _glossary; }

export async function loadQuiz(id) {
  try {
    const res = await fetch(`./content/quizzes/${id}.json`);
    if (!res.ok) return null;
    return await res.json();
  } catch { return null; }
}

/* progress stats across the course */
export function stats(state) {
  const o = order();
  const done = o.filter((id) => state.completed[id]).length;
  return { done, total: o.length, pct: o.length ? done / o.length : 0 };
}
