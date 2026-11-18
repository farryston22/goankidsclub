// Offline support: keeps the games working without internet once opened.
// Bump VERSION whenever you change any file so phones pick up the update.
const VERSION = 'gkc-v9';
const FILES = [
  './', 'index.html', 'manifest.webmanifest', 'css/app.css', 'icons/icon.svg', 'icons/icon-180.png', 'icons/icon-192.png', 'icons/icon-512.png',
  'js/app.js', 'js/sync.js', 'js/stats.js', 'js/cloud-config.js', 'js/util.js', 'js/audio.js', 'js/engine.js', 'js/data.js', 'js/art.js',
  'js/games/numbers.js', 'js/games/letters.js', 'js/games/shapes.js', 'js/games/thinking.js', 'js/games/world.js', 'js/games/heritage.js',
  'audio/manifest.json',
];
self.addEventListener('install', e => { e.waitUntil(caches.open(VERSION).then(c => c.addAll(FILES)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // Network first for the audio list (so new recordings show up), cache first for everything else.
  if (url.pathname.endsWith('audio/manifest.json')) {
    e.respondWith(fetch(req).then(r => { const c = r.clone(); caches.open(VERSION).then(x => x.put(req, c)); return r; }).catch(() => caches.match(req)));
    return;
  }
  e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(r => {
    if (r.ok || r.type === 'opaque') { const c = r.clone(); caches.open(VERSION).then(x => x.put(req, c)); }
    return r;
  })));
});
