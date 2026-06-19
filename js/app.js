/* app.js — boot: theme, router, top bar, ⌘K, service worker */
import { el, ring, icon } from './ui.js';
import { store } from './store.js';
import { loadManifest, stats } from './content.js';
import * as router from './router.js';
import { openPalette } from './overlays.js';
import { initGlossaryHover } from './glossary-link.js';
import { renderHome } from './views/home.js';
import { renderReader } from './views/reader.js';

const META_THEME = { day: '#FBF8F4', night: '#100E18' };

/* ---------- THEME ---------- */
function applyTheme(t, animate) {
  const root = document.documentElement;
  if (animate && !matchMedia('(prefers-reduced-motion: reduce)').matches) themeSweep(t);
  root.setAttribute('data-theme', t);
  store.theme = t;
  document.querySelectorAll('meta[name="theme-color"]').forEach((m) => { /* keep both for scheme */ });
  const icn = document.getElementById('theme-icon');
  if (icn) icn.innerHTML = t === 'night'
    ? '<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>'   // moon
    : '<circle cx="12" cy="12" r="5"/><path d="M12 1v3M12 20v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M1 12h3M20 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1"/>';
}
function themeSweep(to) {
  const veil = el('div', { style: {
    position: 'fixed', inset: '0', zIndex: '800', pointerEvents: 'none',
    background: to === 'night' ? 'radial-gradient(circle at 90% 6%, #100E18, #241a4d)' : 'radial-gradient(circle at 90% 6%, #FBF8F4, #F4EEE7)',
    clipPath: 'circle(0% at 92% 30px)', transition: 'clip-path .5s ease'
  } });
  document.body.append(veil);
  requestAnimationFrame(() => { veil.style.clipPath = 'circle(150% at 92% 30px)'; });
  setTimeout(() => veil.remove(), 560);
}

/* ---------- PROGRESS CORE ---------- */
const coreRing = ring(30, 4);
function updateCore() {
  const s = stats(store.get());
  const host = document.getElementById('core-ring');
  if (host && !host.firstChild) host.replaceWith(coreRing.node), coreRing.node.id = 'core-ring';
  coreRing.set(s.pct);
  const lab = document.getElementById('core-label');
  if (lab) lab.textContent = `${Math.round(s.pct * 100)}% · ${s.done}/${s.total}`;
}

/* ---------- BOOT POST (Workbench, once per session) ---------- */
function maybeBoot() {
  if (store.theme !== 'night') return;
  try { if (sessionStorage.getItem('pilot.booted')) return; sessionStorage.setItem('pilot.booted', '1'); } catch { return; }
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const lines = [
    'Pilot OS 1.0  (Raspberry Pi 5, 16GB)', 'BCM2712 Cortex-A76 @ 2.4GHz ... OK',
    'Mounting course content ............ OK', 'Loading 24 lessons ................. OK',
    'GPIO sandbox ....................... READY', 'Terminal engine .................... READY',
    'Welcome aboard.'
  ];
  const overlay = el('div', { class: 'boot' });
  const skip = el('button', { class: 'skip', text: 'skip ↵' });
  const log = el('div'); overlay.append(skip, log); document.body.append(overlay);
  const done = () => overlay.remove();
  skip.addEventListener('click', done);
  let i = 0;
  (function tick() {
    if (i >= lines.length) { setTimeout(done, 400); return; }
    log.append(el('div', { text: (i < lines.length - 1 ? '[ ' + String(i).padStart(2, '0') + ' ] ' : '> ') + lines[i] }));
    i++; setTimeout(tick, 150);
  })();
  setTimeout(done, 1500);
}

/* ---------- secondary view loader (graceful) ---------- */
function lazyView(modPath, fnName) {
  return async (params, view) => {
    try { const m = await import(modPath); await m[fnName](params, view); }
    catch (e) { console.error(e); view.innerHTML = `<div class="wrap" style="padding:4rem 0;text-align:center"><h2>Loading…</h2><p class="muted">${e.message}</p></div>`; }
  };
}

/* ---------- TOP BAR wiring ---------- */
function wireTopbar() {
  document.getElementById('theme-toggle')?.addEventListener('click', () => {
    applyTheme(document.documentElement.getAttribute('data-theme') === 'night' ? 'day' : 'night', true);
  });
  document.getElementById('search-trigger')?.addEventListener('click', openPalette);
  addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); openPalette(); }
    else if (e.key === '/' && !/INPUT|TEXTAREA/.test(document.activeElement?.tagName || '')) { e.preventDefault(); openPalette(); }
  });
  document.getElementById('mobile-menu')?.addEventListener('click', openMobileNav);
  store.on(updateCore);
}
function openMobileNav() {
  const host = document.getElementById('overlay-host');
  const back = el('div', { class: 'sheet-backdrop', onClick: (e) => { if (e.target === back) back.remove(); } });
  const sheet = el('div', { class: 'sheet' });
  [['#/', 'Path'], ['#/tools', 'Tools'], ['#/glossary', 'Glossary'], ['#/reference', 'Commands'], ['#/me', 'My Pi'], ['./assets/Raspberry-Pi-5-Handbook.pdf', 'Download PDF']]
    .forEach(([h, t]) => sheet.append(el('a', { href: h, style: { display: 'block', padding: '.8rem 0', borderBottom: '1px solid var(--line)', fontWeight: '600' }, text: t, onClick: () => back.remove() })));
  back.append(sheet); host.append(back);
}
function highlightNav(name) {
  document.querySelectorAll('.navlink').forEach((a) => {
    const r = a.dataset.route;
    a.classList.toggle('active', (name === 'home' && r === 'home') || name === r);
  });
}

/* ---------- INIT ---------- */
(async function init() {
  applyTheme(store.theme, false);
  wireTopbar();
  initGlossaryHover();

  if ('serviceWorker' in navigator) {
    addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}));
  }

  try { await loadManifest(); } catch (e) { console.error('manifest failed', e); }
  updateCore();

  router.register('home', renderHome);
  router.register('chapter', renderReader);
  router.register('glossary', lazyView('./views/glossary.js', 'renderGlossary'));
  router.register('reference', lazyView('./views/reference.js', 'renderReference'));
  router.register('tools', lazyView('./views/tools.js', 'renderTools'));
  router.register('me', lazyView('./views/me.js', 'renderMe'));
  router.onChange((name) => { highlightNav(name); document.getElementById('view').classList.toggle('reader', false); });

  router.start();
  maybeBoot();
})();
