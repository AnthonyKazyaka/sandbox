// ==========================================================================
// Family To-Do Tracker - Service Worker
// ==========================================================================
// All URLs are relative to this file, so the app works from any sub-path
// (e.g. GitHub Pages serves it from /sandbox/to-do-tracker/).

const CACHE_NAME = 'family-tracker-v2';
const APP_SHELL = [
  './',
  'index.html',
  'styles.css',
  'app.js',
  'manifest.json',
  'icons/icon.svg',
  'icons/icon-192x192.png',
  'icons/icon-512x512.png'
];

// Install: pre-cache the app shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

// Activate: drop old caches and take control of open pages
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => Promise.all(
        cacheNames
          .filter((cacheName) => cacheName !== CACHE_NAME)
          .map((cacheName) => caches.delete(cacheName))
      ))
      .then(() => self.clients.claim())
  );
});

// Fetch:
// - page navigations: network first so updates show up, cached shell offline
// - everything else (app files, fonts, Chart.js): cached copy right away,
//   refreshed in the background (stale-while-revalidate)
self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put('./', copy));
          return response;
        })
        .catch(() => caches.match('./', { ignoreSearch: true }))
    );
    return;
  }

  event.respondWith(
    caches.open(CACHE_NAME).then((cache) =>
      cache.match(request).then((cached) => {
        const network = fetch(request)
          .then((response) => {
            if (response.ok || response.type === 'opaque') {
              cache.put(request, response.clone());
            }
            return response;
          })
          .catch(() => cached);
        return cached || network;
      })
    )
  );
});
