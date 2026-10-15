/* Libreta de Equipos y Pautas: guarda la app para usarla sin conexión.
   Sirve desde el caché y, si hay internet, actualiza en segundo plano
   (la versión nueva aparece la próxima vez que se abra). */
var CACHE = 'libreta-v1';
var ARCHIVOS = ['./', './index.html', './manifest.webmanifest', './icono.svg', './icono-maskable.svg'];
var FUENTES = [
  'https://cdn.jsdelivr.net/npm/@fontsource/atkinson-hyperlegible@5.3.0/files/atkinson-hyperlegible-latin-400-normal.woff2',
  'https://cdn.jsdelivr.net/npm/@fontsource/atkinson-hyperlegible@5.3.0/files/atkinson-hyperlegible-latin-700-normal.woff2',
  'https://cdn.jsdelivr.net/npm/@fontsource/zilla-slab@5.3.0/files/zilla-slab-latin-500-normal.woff2',
  'https://cdn.jsdelivr.net/npm/@fontsource/zilla-slab@5.3.0/files/zilla-slab-latin-700-normal.woff2'
];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) {
    return c.addAll(ARCHIVOS).then(function () {
      return Promise.all(FUENTES.map(function (u) {
        return fetch(u, { mode: 'cors' }).then(function (r) { if (r.ok) return c.put(u, r); }).catch(function () {});
      }));
    });
  }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (ks) {
    return Promise.all(ks.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;
  var url = new URL(req.url);
  if (url.origin === 'https://cdn.jsdelivr.net') {
    e.respondWith(caches.open(CACHE).then(function (c) {
      return c.match(req.url).then(function (g) {
        return g || fetch(req).then(function (r) { if (r.ok) c.put(req.url, r.clone()); return r; });
      });
    }));
    return;
  }
  if (url.origin !== self.location.origin) return;
  var clave = req.mode === 'navigate' ? './index.html' : req;
  e.respondWith(caches.open(CACHE).then(function (c) {
    return c.match(clave, { ignoreSearch: true }).then(function (guardado) {
      var red = fetch(req).then(function (res) {
        if (res && res.ok) c.put(clave, res.clone());
        return res;
      }).catch(function () { return guardado; });
      return guardado || red;
    });
  }));
});
