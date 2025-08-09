// Optimierte Cache-Strategie mit DaisyUI-Assets
const CACHE_NAME = 'health-tracker-v4';
const API_CACHE_NAME = 'health-tracker-api-v4'; 
const STATIC_CACHE_NAME = 'health-tracker-static-v4';

// Erweiterte Asset-Liste für bessere Performance
const urlsToCache = [
  '/',
  '/index.html',
  '/js/app.js',
  '/js/pwa.js',
  '/manifest.json',
  // DaisyUI & Tailwind CSS (falls lokal gehostet)
  'https://cdn.jsdelivr.net/npm/daisyui@4.12.10/dist/full.min.css',
  'https://cdn.tailwindcss.com',
  // Chart.js für Analytics
  'https://cdn.jsdelivr.net/npm/chart.js@4.5.0/dist/chart.min.js'
];

// Verbesserte Fetch-Handler mit Stale-While-Revalidate
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-HTTP requests
  if (!request.url.startsWith('http')) return;
  
  // API requests - Network First mit 3s Timeout
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleAPIRequestOptimized(request));
    return;
  }
  
  // Static assets - Cache First mit Fallback
  if (request.destination === 'style' || request.destination === 'script') {
    event.respondWith(handleStaticAssets(request));
    return;
  }
  
  // Navigation - App Shell Pattern
  if (request.mode === 'navigate') {
    event.respondWith(handleNavigationOptimized(request));
    return;
  }
  
  // Default: Stale-While-Revalidate
  event.respondWith(handleDefaultRequest(request));
});

// Optimized API Handler mit Timeout
async function handleAPIRequestOptimized(request) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 3000);
  
  try {
    const networkResponse = await fetch(request, { 
      signal: controller.signal 
    });
    clearTimeout(timeoutId);
    
    if (networkResponse.ok) {
      // Smart caching basierend auf Content-Type
      const cache = await caches.open(API_CACHE_NAME);
      const clonedResponse = networkResponse.clone();
      cache.put(request, clonedResponse);
      return networkResponse;
    }
    throw new Error(`API Error: ${networkResponse.status}`);
    
  } catch (error) {
    clearTimeout(timeoutId);
    console.log('🔄 Network failed, serving from cache:', request.url);
    
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      // Füge Offline-Header hinzu
      const headers = new Headers(cachedResponse.headers);
      headers.set('X-Served-From', 'sw-cache');
      
      return new Response(cachedResponse.body, {
        status: cachedResponse.status,
        statusText: cachedResponse.statusText,
        headers
      });
    }
    
    // Structured offline response
    return new Response(JSON.stringify({
      error: 'Offline - Bitte später versuchen',
      offline: true,
      timestamp: new Date().toISOString(),
      retryAfter: 30
    }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Fehlende Handler-Funktionen für optimierte Cache-Strategie
async function handleStaticAssets(request) {
  const cache = await caches.open(STATIC_CACHE_NAME);
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse) {
    // Cache First - aber auch Network-Update im Hintergrund
    fetch(request).then(networkResponse => {
      if (networkResponse.ok) {
        cache.put(request, networkResponse.clone());
      }
    }).catch(() => {
      // Network failed, aber Cache-Version ist verfügbar
    });
    
    return cachedResponse;
  }
  
  // Fallback zu Network
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    // Letzter Fallback für kritische Assets
    return new Response('/* Asset offline nicht verfügbar */', {
      status: 503,
      headers: { 'Content-Type': 'text/css' }
    });
  }
}

async function handleNavigationOptimized(request) {
  try {
    // Network First für Navigation
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      return networkResponse;
    }
    throw new Error(`Navigation response not ok: ${networkResponse.status}`);
  } catch (error) {
    console.log('🌐 Navigation network failed, serving cached app shell');
    
    // App Shell Pattern - immer index.html zurückgeben
    const cache = await caches.open(CACHE_NAME);
    const cachedResponse = await cache.match('/index.html') || await cache.match('/');
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Ultimate fallback
    return new Response(`
      <!DOCTYPE html>
      <html>
        <head><title>Health Tracker - Offline</title></head>
        <body style="font-family: system-ui; text-align: center; padding: 2rem;">
          <h1>🏥 Health Tracker Pro</h1>
          <p>Die App ist momentan offline. Bitte überprüfe deine Internetverbindung.</p>
          <button onclick="window.location.reload()" style="padding: 1rem 2rem; background: #667eea; color: white; border: none; border-radius: 8px; cursor: pointer;">
            🔄 Erneut versuchen
          </button>
        </body>
      </html>
    `, {
      status: 503,
      headers: { 'Content-Type': 'text/html' }
    });
  }
}

async function handleDefaultRequest(request) {
  // Stale-While-Revalidate Pattern
  const cache = await caches.open(CACHE_NAME);
  const cachedResponse = await cache.match(request);
  
  // Background update
  const fetchPromise = fetch(request).then(networkResponse => {
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  }).catch(() => cachedResponse);
  
  // Return cache immediately if available
  return cachedResponse || fetchPromise;
}

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
