/* router.js — minimal hash router for GitHub Pages + offline + deep links */

const routes = {};   // name -> async (params, view) => void
let _current = null;
let _onChange = null;

/* per-view teardown registry: views/widgets register cleanups; the router runs
   and clears them before rendering the next view (or re-rendering the same one),
   eliminating leaked scroll/resize/observer listeners. */
let _disposers = [];
export function onCleanup(fn) { if (typeof fn === 'function') _disposers.push(fn); }
function runDisposers() { const d = _disposers; _disposers = []; d.forEach((fn) => { try { fn(); } catch (e) { /* ignore */ } }); }

export function register(name, handler) { routes[name] = handler; }
export function onChange(fn) { _onChange = fn; }

export function isRoute(name) { return name === 'home' || name in routes; }

export function parse(hash) {
  let h = (hash || location.hash || '#/').replace(/^#\/?/, '');
  const qi = h.indexOf('?');
  const queryStr = qi >= 0 ? h.slice(qi + 1) : '';
  if (qi >= 0) h = h.slice(0, qi);
  const segs = h.split('/').filter(Boolean);
  const name = segs[0] || 'home';
  return { name, params: segs.slice(1), query: new URLSearchParams(queryStr), raw: '#/' + segs.join('/') };
}

export function navigate(to) {
  if (location.hash === to || '#/' + (location.hash.replace(/^#\/?/, '')) === to) {
    // same route: still re-render if forced
  }
  location.hash = to;
}

async function render() {
  const { name, params } = parse();
  const view = document.getElementById('view');
  runDisposers();                       // tear down the previous view first
  view.className = '';                  // drop reader/other view classes
  const handler = routes[name] || routes['notfound'] || routes['home'];
  _current = name;
  view.classList.remove('view-enter');
  // force reflow to restart animation
  void view.offsetWidth;
  view.classList.add('view-enter');
  view.innerHTML = '';
  try {
    await handler(params, view);
  } catch (e) {
    console.error(e);
    view.innerHTML = `<div class="wrap" style="padding:4rem 0;text-align:center"><h2>Something went wrong</h2><p class="muted">${e.message}</p><p><a class="btn btn-ghost" href="#/">Back to the path</a></p></div>`;
  }
  if (name !== 'chapter') window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' });
  if (_onChange) _onChange(name, params);
}

export function start() {
  addEventListener('hashchange', render);
  render();
}
export function current() { return _current; }
