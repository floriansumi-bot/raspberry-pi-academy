/* Pi Academy service worker — offline-first runtime caching (no build step) */
const VERSION = 'pi-academy-v3';
const FONTS = VERSION + '-fonts';
const CORE = [
  './', './index.html',
  './css/base.css', './css/layout.css', './css/components.css', './css/home.css',
  './js/app.js', './js/router.js', './js/store.js', './js/content.js', './js/search.js', './js/badges.js',
  './js/enhance.js', './js/glossary-link.js', './js/quiz.js', './js/overlays.js', './js/ui.js',
  './js/views/home.js', './js/views/reader.js', './js/views/glossary.js', './js/views/reference.js', './js/views/tools.js', './js/views/me.js',
  './js/widgets/board.js', './js/widgets/terminal.js', './js/widgets/gpio.js', './js/widgets/resistor.js', './js/widgets/picker.js', './js/widgets/poweron.js',
  './content/manifest.json', './content/glossary.json',
];

self.addEventListener('install', (e) => {
  self.skipWaiting();
  // cache each URL independently so a single 404 doesn't abort the whole precache,
  // and derive the chapter/quiz lists from the manifest (single source of truth).
  e.waitUntil(caches.open(VERSION).then(async (c) => {
    await Promise.allSettled(CORE.map((u) => c.add(u)));
    try {
      const m = await fetch('./content/manifest.json').then((r) => r.json());
      const extra = [];
      (m.order || []).forEach((id) => {
        extra.push(`./content/chapters/${id}.html`);
        if (/^ch\d+$/.test(id)) extra.push(`./content/quizzes/${id}.json`);
      });
      await Promise.allSettled(extra.map((u) => c.add(u)));
    } catch (e) { /* offline first install still works from CORE */ }
  }));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== VERSION && k !== FONTS).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // Google Fonts (cross-origin): cache-first so typography works fully offline
  if (url.host === 'fonts.googleapis.com' || url.host === 'fonts.gstatic.com') {
    e.respondWith(caches.open(FONTS).then(async (c) => {
      const hit = await c.match(req);
      if (hit) return hit;
      try { const res = await fetch(req); if (res.ok) c.put(req, res.clone()); return res; }
      catch { return hit || Response.error(); }
    }));
    return;
  }
  if (url.origin !== location.origin) return;

  // HTML navigations: network-first so updates show, fall back to cache offline
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req).then((res) => {
        const copy = res.clone();
        caches.open(VERSION).then((c) => c.put(req, copy));
        return res;
      }).catch(() => caches.match(req).then((m) => m || caches.match('./index.html')))
    );
    return;
  }

  // everything else (content, css, js, json): stale-while-revalidate
  e.respondWith(
    caches.match(req).then((cached) => {
      const network = fetch(req).then((res) => {
        if (res && res.status === 200) {
          const copy = res.clone();
          caches.open(VERSION).then((c) => c.put(req, copy));
        }
        return res;
      }).catch(() => cached);
      return cached || network;
    })
  );
});
