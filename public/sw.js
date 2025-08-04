const CACHE_NAME = 'health-tracker-v2'; // Version bumped for goals feature

const urlsToCache = [
    '/',
    '/index.html',
    '/js/app.js',
    '/js/pwa.js',
    '/manifest.json'
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

// Fetch Event - Robustere Fehlerbehandlung + Goals API Support
self.addEventListener('fetch', (event) => {
    // Handle goals API requests
    if (event.request.url.includes('/api/goals')) {
        event.respondWith(
            fetch(event.request)
                .then(response => {
                    // Clone response for caching goals
                    if (response.ok && event.request.method === 'GET') {
                        const responseClone = response.clone();
                        caches.open(CACHE_NAME + '-goals').then(cache => {
                            cache.put(event.request, responseClone);
                        });
                    }
                    return response;
                })
                .catch(() => {
                    // Fallback to cached goals if available
                    return caches.match(event.request);
                })
        );
        return;
    }

    // Handle other requests as before
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

// Clean up old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME && cacheName !== CACHE_NAME + '-goals') {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});
