// Enhanced Service Worker for Health Tracker PWA

const CACHE_NAME = 'health-tracker-v3'; // Version erhöht für verbesserte Install-Features
const API_CACHE_NAME = 'health-tracker-api-v3';
const GOALS_CACHE_NAME = 'health-tracker-goals-v3';

// Assets to cache on install
const urlsToCache = [
    '/',
    '/index.html',
    '/js/app.js',
    '/js/pwa.js',
    '/manifest.json',
    '/icons/icon-192x192.png',
    '/icons/icon-512x512.png'
];

// ==================================================================== 
// SERVICE WORKER INSTALLATION
// ====================================================================

self.addEventListener('install', (event) => {
    console.log('🔧 Service Worker Installation gestartet');
    
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('📦 Cache geöffnet:', CACHE_NAME);
                return cache.addAll(urlsToCache);
            })
            .then(() => {
                console.log('✅ Alle Assets erfolgreich gecacht');
                return self.skipWaiting(); // Sofort aktivieren
            })
            .catch(error => {
                console.error('❌ Cache add failed:', error);
            })
    );
});

// ==================================================================== 
// SERVICE WORKER ACTIVATION
// ====================================================================

self.addEventListener('activate', (event) => {
    console.log('⚡ Service Worker Aktivierung gestartet');
    
    event.waitUntil(
        Promise.all([
            // Clean up old caches
            caches.keys().then(cacheNames => {
                return Promise.all(
                    cacheNames.map(cacheName => {
                        if (cacheName !== CACHE_NAME && 
                            cacheName !== API_CACHE_NAME && 
                            cacheName !== GOALS_CACHE_NAME) {
                            console.log('🗑️ Entferne alten Cache:', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            }),
            // Take control of all pages
            self.clients.claim()
        ]).then(() => {
            console.log('✅ Service Worker aktiviert und bereit');
        })
    );
});

// ==================================================================== 
// FETCH EVENT HANDLING - Robuste Offline-First Strategie
// ====================================================================

self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);
    
    // Skip non-HTTP requests
    if (!request.url.startsWith('http')) {
        return;
    }
    
    // Handle API requests
    if (url.pathname.startsWith('/api/')) {
        event.respondWith(handleAPIRequest(request));
        return;
    }
    
    // Handle navigation requests
    if (request.mode === 'navigate') {
        event.respondWith(handleNavigationRequest(request));
        return;
    }
    
    // Handle other requests (assets, images, etc.)
    event.respondWith(handleAssetRequest(request));
});

// ==================================================================== 
// API REQUEST HANDLING
// ====================================================================

async function handleAPIRequest(request) {
    const url = new URL(request.url);
    
    try {
        // Try network first for API requests
        const networkResponse = await fetch(request);
        
        if (networkResponse.ok) {
            // Cache successful GET requests
            if (request.method === 'GET') {
                const cache = await caches.open(
                    url.pathname.includes('/goals') ? GOALS_CACHE_NAME : API_CACHE_NAME
                );
                cache.put(request, networkResponse.clone());
            }
            return networkResponse;
        }
        
        throw new Error(`Network response not ok: ${networkResponse.status}`);
        
    } catch (error) {
        console.log('🌐 API Network failed, trying cache:', url.pathname);
        
        // Fallback to cache for GET requests
        if (request.method === 'GET') {
            const cache = await caches.open(
                url.pathname.includes('/goals') ? GOALS_CACHE_NAME : API_CACHE_NAME
            );
            const cachedResponse = await cache.match(request);
            
            if (cachedResponse) {
                console.log('📦 Serving from API cache:', url.pathname);
                return cachedResponse;
            }
        }
        
        // Return offline response for failed API calls
        return new Response(
            JSON.stringify({
                error: 'Offline - Data not available',
                offline: true,
                timestamp: new Date().toISOString()
            }),
            {
                status: 503,
                statusText: 'Service Unavailable',
                headers: {
                    'Content-Type': 'application/json',
                    'Cache-Control': 'no-cache'
                }
            }
        );
    }
}

// ==================================================================== 
// NAVIGATION REQUEST HANDLING
// ====================================================================

async function handleNavigationRequest(request) {
    try {
        // Try network first
        const networkResponse = await fetch(request);
        if (networkResponse.ok) {
            return networkResponse;
        }
        throw new Error(`Navigation response not ok: ${networkResponse.status}`);
        
    } catch (error) {
        console.log('🌐 Navigation network failed, serving cached index.html');
        
        // Fallback to cached index.html
        const cache = await caches.open(CACHE_NAME);
        const cachedResponse = await cache.match('/index.html') || await cache.match('/');
        
        if (cachedResponse) {
            return cachedResponse;
        }
        
        // Ultimate fallback
        return new Response(
            `<!DOCTYPE html>
            <html>
            <head>
                <title>Health Tracker - Offline</title>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1">
            </head>
            <body>
                <div style="text-align: center; padding: 50px; font-family: Arial, sans-serif;">
                    <h1>📵 Offline</h1>
                    <p>Die App ist momentan offline. Bitte überprüfe deine Internetverbindung.</p>
                    <button onclick="window.location.reload()">🔄 Erneut versuchen</button>
                </div>
            </body>
            </html>`,
            {
                headers: { 'Content-Type': 'text/html' }
            }
        );
    }
}

// ==================================================================== 
// ASSET REQUEST HANDLING
// ====================================================================

async function handleAssetRequest(request) {
    try {
        // Cache first, then network strategy for assets
        const cache = await caches.open(CACHE_NAME);
        const cachedResponse = await cache.match(request);
        
        if (cachedResponse) {
            // Serve from cache immediately
            fetchAndCache(request, cache); // Update cache in background
            return cachedResponse;
        }
        
        // Not in cache, fetch from network
        const networkResponse = await fetch(request);
        
        if (networkResponse.ok) {
            // Cache successful responses
            cache.put(request, networkResponse.clone());
        }
        
        return networkResponse;
        
    } catch (error) {
        console.log('❌ Asset request failed:', request.url);
        
        // Return offline placeholder for images
        if (request.destination === 'image') {
            return new Response(
                '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><rect width="200" height="200" fill="#f0f0f0"/><text x="100" y="100" text-anchor="middle" fill="#666">Offline</text></svg>',
                { headers: { 'Content-Type': 'image/svg+xml' } }
            );
        }
        
        throw error;
    }
}

// ==================================================================== 
// BACKGROUND FETCH AND CACHE
// ====================================================================

async function fetchAndCache(request, cache) {
    try {
        const networkResponse = await fetch(request);
        if (networkResponse.ok) {
            cache.put(request, networkResponse.clone());
        }
    } catch (error) {
        // Silent fail for background updates
        console.log('Background cache update failed:', request.url);
    }
}

// ==================================================================== 
// BACKGROUND SYNC
// ====================================================================

self.addEventListener('sync', (event) => {
    console.log('📤 Background Sync Event:', event.tag);
    
    if (event.tag === 'background-sync') {
        event.waitUntil(performBackgroundSync());
    }
});

async function performBackgroundSync() {
    console.log('🔄 Starte Background Sync...');
    
    try {
        // Get unsynced data from all clients
        const clients = await self.clients.matchAll();
        
        for (const client of clients) {
            client.postMessage({
                type: 'BACKGROUND_SYNC',
                action: 'REQUEST_SYNC'
            });
        }
        
        console.log('✅ Background Sync erfolgreich');
        
    } catch (error) {
        console.error('❌ Background Sync Fehler:', error);
        throw error; // Retry sync later
    }
}

// ==================================================================== 
// MESSAGE HANDLING
// ====================================================================

self.addEventListener('message', (event) => {
    const { data } = event;
    
    switch (data.type) {
        case 'SKIP_WAITING':
            self.skipWaiting();
            break;
            
        case 'CACHE_UPDATE':
            event.waitUntil(updateCache(data.urls));
            break;
            
        case 'CLEAR_CACHE':
            event.waitUntil(clearOldCaches());
            break;
            
        default:
            console.log('📨 Unbekannte Message:', data);
    }
});

// ==================================================================== 
// CACHE MANAGEMENT UTILITIES
// ====================================================================

async function updateCache(urls = []) {
    try {
        const cache = await caches.open(CACHE_NAME);
        await cache.addAll(urls);
        console.log('✅ Cache erfolgreich aktualisiert');
    } catch (error) {
        console.error('❌ Cache Update Fehler:', error);
    }
}

async function clearOldCaches() {
    try {
        const cacheNames = await caches.keys();
        const deletePromises = cacheNames
            .filter(name => name !== CACHE_NAME && name !== API_CACHE_NAME && name !== GOALS_CACHE_NAME)
            .map(name => caches.delete(name));
        
        await Promise.all(deletePromises);
        console.log('🗑️ Alte Caches erfolgreich gelöscht');
    } catch (error) {
        console.error('❌ Cache Lösch-Fehler:', error);
    }
}

// ==================================================================== 
// PUSH NOTIFICATIONS (für zukünftige Erweiterungen)
// ====================================================================

self.addEventListener('push', (event) => {
    if (!event.data) return;
    
    const data = event.data.json();
    const options = {
        body: data.body,
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-72x72.png',
        data: data.data,
        actions: [
            {
                action: 'view',
                title: 'Anzeigen'
            },
            {
                action: 'dismiss',
                title: 'Schließen'
            }
        ]
    };
    
    event.waitUntil(
        self.registration.showNotification(data.title, options)
    );
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    
    if (event.action === 'view') {
        event.waitUntil(
            clients.openWindow('/')
        );
    }
});

console.log('🚀 Service Worker geladen und bereit');
