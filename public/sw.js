const CACHE_NAME = 'health-tracker-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/js/app.js',
  '/js/pwa.js',
  '/manifest.json'
  // Entferne die Icons URLs bis sie existieren
  // '/icons/icon-192x192.png'
];

// Service Worker Installation
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(urlsToCache).catch(error => {
          console.error('Cache add failed:', error);
        });
      })
  );
});

// Fetch Event - Robustere Fehlerbehandlung
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response;
        }
        return fetch(event.request).catch(error => {
          console.error('Fetch failed:', error);
          // Fallback für offline
          if (event.request.destination === 'document') {
            return caches.match('/');
          }
        });
      })
  );
});
