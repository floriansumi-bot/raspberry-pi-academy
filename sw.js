/* Pi Academy service worker — offline-first runtime caching (no build step) */
const VERSION = 'pi-academy-v3';
const FONTS = VERSION + '-fonts';
const CH_IDS = ['ch01','ch02','ch03','ch04','ch05','ch06','ch07','ch08','ch09','ch10','ch11','ch12','ch13','ch14','ch15','ch16','ch17','ch18','ch19','ch20','ch21','ch22','apxA','glos'];
const QUIZ_IDS = ['ch01','ch02','ch03','ch04','ch05','ch06','ch07','ch08','ch09','ch10','ch11','ch12','ch13','ch14','ch15','ch16','ch17','ch18','ch19','ch20','ch21','ch22'];
const CORE = [
  './', './index.html',
  './css/base.css', './css/layout.css', './css/components.css', './css/home.css',
  './js/app.js', './js/router.js', './js/store.js', './js/content.js', './js/search.js',
  './js/enhance.js', './js/glossary-link.js', './js/quiz.js', './js/overlays.js', './js/ui.js',
  './js/views/home.js', './js/views/reader.js', './js/views/glossary.js', './js/views/reference.js', './js/views/tools.js', './js/views/me.js',
  './js/widgets/board.js', './js/widgets/terminal.js', './js/widgets/gpio.js', './js/widgets/resistor.js', './js/widgets/picker.js', './js/widgets/poweron.js',
  './content/manifest.json', './content/glossary.json',
  ...CH_IDS.map((id) => `./content/chapters/${id}.html`),
  ...QUIZ_IDS.map((id) => `./content/quizzes/${id}.json`),
];

self.addEventListener('install', (e) => {
  self.skipWaiting();
  // cache each URL independently so a single 404 doesn't abort the whole precache
  e.waitUntil(caches.open(VERSION).then((c) => Promise.allSettled(CORE.map((u) => c.add(u)))));
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
