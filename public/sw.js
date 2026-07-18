const CACHE_NAME = 'fenxiang-voice-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/uploads/logo-192.png',
  '/uploads/logo-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );
});
