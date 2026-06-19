/* store.js — localStorage state: progress, theme, bookmarks, recent terms.
   Simple pub/sub so the top bar + dashboard react to changes. */

const KEY = 'pilot.state.v1';
const THEME_KEY = 'pilot.theme';

const DEFAULT = {
  completed: {},      // chapterId -> true
  visited: {},        // chapterId -> timestamp
  scroll: {},         // chapterId -> last % read (0..1)
  quizScores: {},     // chapterId -> {score, total}
  badges: {},         // badgeId -> true
  recentTerms: [],    // glossary terms viewed
  last: null,         // last chapterId visited
  installedHint: false,
};

function read() {
  try { return Object.assign({}, DEFAULT, JSON.parse(localStorage.getItem(KEY) || '{}')); }
  catch { return Object.assign({}, DEFAULT); }
}
let state = read();
const subs = new Set();

function persist() {
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch {}
  subs.forEach((fn) => { try { fn(state); } catch {} });
}

export const store = {
  get() { return state; },
  on(fn) { subs.add(fn); return () => subs.delete(fn); },

  isComplete(id) { return !!state.completed[id]; },
  setComplete(id, v = true) {
    if (v) state.completed[id] = true; else delete state.completed[id];
    persist();
  },
  visit(id) { state.visited[id] = Date.now(); state.last = id; persist(); },
  setScroll(id, p) { state.scroll[id] = p; /* no persist spam: */ if ((store._t = (store._t || 0) + 1) % 6 === 0) persist(); },
  flush() { persist(); },
  setQuiz(id, score, total) { state.quizScores[id] = { score, total }; persist(); },
  award(badgeId) { if (!state.badges[badgeId]) { state.badges[badgeId] = true; persist(); return true; } return false; },
  hasBadge(b) { return !!state.badges[b]; },
  addTerm(t) {
    state.recentTerms = [t, ...state.recentTerms.filter((x) => x !== t)].slice(0, 30);
    persist();
  },

  /* theme is separate so the anti-FOUC inline script can read it */
  get theme() { try { return localStorage.getItem(THEME_KEY) || (matchMedia('(prefers-color-scheme: dark)').matches ? 'night' : 'day'); } catch { return 'day'; } },
  set theme(t) { try { localStorage.setItem(THEME_KEY, t); } catch {} },

  exportJSON() { return JSON.stringify(state, null, 2); },
  importJSON(text) {
    try {
      const obj = JSON.parse(text);
      if (typeof obj !== 'object') throw 0;
      state = Object.assign({}, DEFAULT, obj);
      persist();
      return true;
    } catch { return false; }
  },
  reset() { state = Object.assign({}, DEFAULT); persist(); },
};
