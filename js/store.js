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
  justCompleted: null,
  lastActiveDay: null,
  streakCount: 0,
  learnerName: '',
};

function dayStr(d) { return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); }
function markActiveDay() {
  const today = dayStr(new Date());
  if (state.lastActiveDay === today) return;
  const y = new Date(); y.setDate(y.getDate() - 1);
  state.streakCount = (state.lastActiveDay === dayStr(y)) ? (state.streakCount || 0) + 1 : 1;
  state.lastActiveDay = today;
}

function read() {
  try { return Object.assign({}, DEFAULT, JSON.parse(localStorage.getItem(KEY) || '{}')); }
  catch { return Object.assign({}, DEFAULT); }
}
let state = read();
const subs = new Set();
let scrollTimer = null;
// persist the last position when the tab is hidden/closed (debounce may be pending)
if (typeof addEventListener === 'function') {
  addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') { if (scrollTimer) { clearTimeout(scrollTimer); scrollTimer = null; } persist(); } });
  addEventListener('pagehide', () => { if (scrollTimer) { clearTimeout(scrollTimer); scrollTimer = null; } persist(); });
}

function persist() {
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch {}
  subs.forEach((fn) => { try { fn(state); } catch {} });
}

export const store = {
  get() { return state; },
  on(fn) { subs.add(fn); return () => subs.delete(fn); },

  isComplete(id) { return !!state.completed[id]; },
  setComplete(id, v = true) {
    if (v) { state.completed[id] = true; state.justCompleted = id; } else delete state.completed[id];
    markActiveDay();
    persist();
  },
  /* transient: the path reads + clears this to play the trace-fill reward once */
  consumeJustCompleted() { const j = state.justCompleted; if (j) { delete state.justCompleted; persist(); } return j || null; },
  visit(id) { state.visited[id] = Date.now(); state.last = id; markActiveDay(); persist(); },
  streak() { return state.streakCount || 0; },
  get name() { return state.learnerName || ''; },
  set name(v) { state.learnerName = v || ''; persist(); },
  setScroll(id, p) { state.scroll[id] = p; if (!scrollTimer) scrollTimer = setTimeout(() => { scrollTimer = null; persist(); }, 750); },
  flush() { if (scrollTimer) { clearTimeout(scrollTimer); scrollTimer = null; } persist(); },
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
      if (obj === null || Array.isArray(obj) || typeof obj !== 'object' || typeof obj.completed !== 'object') throw 0;
      state = Object.assign({}, DEFAULT, obj);
      persist();
      return true;
    } catch { return false; }
  },
  reset() { state = Object.assign({}, DEFAULT); persist(); },
};
