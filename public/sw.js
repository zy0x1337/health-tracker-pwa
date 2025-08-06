const CACHE_VERSION = 'v3';
const STATIC_CACHE = `health-tracker-static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `health-tracker-dynamic-${CACHE_VERSION}`;
const API_CACHE = `health-tracker-api-${CACHE_VERSION}`;

// Strategic caching with priorities
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/js/app.js',
    '/js/pwa.js',
    '/manifest.json',
    '/dist/output.css',
    'https://cdn.jsdelivr.net/npm/chart.js'
];

const API_ENDPOINTS = [
    '/api/health-data/',
    '/api/goals/'
];

const CACHE_STRATEGIES = {
    static: 'cache-first',
    api: 'network-first',
    dynamic: 'stale-while-revalidate'
};

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
    const url = new URL(event.request.url);
    
    // API requests - Network First with background sync
    if (url.pathname.startsWith('/api/')) {
        event.respondWith(handleApiRequest(event.request));
        return;
    }
    
    // Static assets - Cache First
    if (STATIC_ASSETS.some(asset => url.pathname.endsWith(asset.split('/').pop()))) {
        event.respondWith(handleStaticRequest(event.request));
        return;
    }
    
    // Dynamic content - Stale While Revalidate
    event.respondWith(handleDynamicRequest(event.request));
});

async function handleApiRequest(request) {
    const cache = await caches.open(API_CACHE);
    const url = new URL(request.url);
    
    try {
        // Network first strategy
        const networkResponse = await fetch(request);
        
        if (networkResponse.ok) {
            // Cache successful API responses (GET only)
            if (request.method === 'GET') {
                const responseClone = networkResponse.clone();
                // Set cache expiration (5 minutes for API data)
                const headers = new Headers(responseClone.headers);
                headers.set('sw-cache-timestamp', Date.now().toString());
                const cachedResponse = new Response(responseClone.body, {
                    status: responseClone.status,
                    statusText: responseClone.statusText,
                    headers: headers
                });
                await cache.put(request, cachedResponse);
            }
            return networkResponse;
        }
        throw new Error('Network response not ok');
    } catch (error) {
        // Fallback to cache
        const cachedResponse = await cache.match(request);
        if (cachedResponse) {
            // Check cache age (5 minutes max)
            const cacheTimestamp = cachedResponse.headers.get('sw-cache-timestamp');
            const isStale = cacheTimestamp && (Date.now() - parseInt(cacheTimestamp)) > 300000;
            
            if (isStale) {
                console.log('Serving stale API cache for:', request.url);
            }
            return cachedResponse;
        }
        
        // Return offline indicator for API failures
        return new Response(
            JSON.stringify({ error: 'Offline', offline: true }), 
            { status: 503, headers: { 'Content-Type': 'application/json' } }
        );
    }
}

async function handleStaticRequest(request) {
    const cache = await caches.open(STATIC_CACHE);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
        return cachedResponse;
    }
    
    // Network fallback for static assets
    try {
        const networkResponse = await fetch(request);
        if (networkResponse.ok) {
            await cache.put(request, networkResponse.clone());
        }
        return networkResponse;
    } catch (error) {
        // Return offline page for document requests
        if (request.destination === 'document') {
            return cache.match('/') || new Response('Offline', { status: 503 });
        }
        throw error;
    }
}

async function handleDynamicRequest(request) {
    const cache = await caches.open(DYNAMIC_CACHE);
    const cachedResponse = await cache.match(request);
    
    // Serve from cache immediately if available
    if (cachedResponse) {
        // Background update
        fetch(request).then(response => {
            if (response.ok) {
                cache.put(request, response.clone());
            }
        }).catch(() => {
            // Silent fail for background updates
        });
        
        return cachedResponse;
    }
    
    // Network first for new requests
    try {
        const networkResponse = await fetch(request);
        if (networkResponse.ok) {
            await cache.put(request, networkResponse.clone());
        }
        return networkResponse;
    } catch (error) {
        return new Response('Offline', { status: 503 });
    }
}

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

// Background sync for offline API requests
self.addEventListener('sync', (event) => {
    if (event.tag === 'background-sync') {
        event.waitUntil(syncOfflineData());
    }
});

async function syncOfflineData() {
    try {
        // Get offline data from IndexedDB or localStorage
        const offlineData = await getOfflineData();
        
        for (const data of offlineData) {
            try {
                const response = await fetch('/api/health-data', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });
                
                if (response.ok) {
                    await removeOfflineData(data.id);
                }
            } catch (error) {
                console.log('Sync failed for:', data.id);
            }
        }
    } catch (error) {
        console.error('Background sync failed:', error);
    }
}

async function getOfflineData() {
    // Implementation depends on your offline storage strategy
    return JSON.parse(localStorage.getItem('offlineHealthData') || '[]');
}

async function removeOfflineData(id) {
    const data = JSON.parse(localStorage.getItem('offlineHealthData') || '[]');
    const filtered = data.filter(item => item.id !== id);
    localStorage.setItem('offlineHealthData', JSON.stringify(filtered));
}