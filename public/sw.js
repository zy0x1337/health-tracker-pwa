// Enhanced Service Worker for Health Tracker PWA v3.1
// Optimiert für Performance, Sicherheit und Offline-Funktionalität

const CACHE_NAME = 'health-tracker-v3.1';
const API_CACHE_NAME = 'health-tracker-api-v3.1';
const GOALS_CACHE_NAME = 'health-tracker-goals-v3.1';
const STATIC_CACHE_NAME = 'health-tracker-static-v3.1';

// Cache-Strategien Konfiguration
const CACHE_STRATEGIES = {
    CACHE_FIRST: 'cache-first',
    NETWORK_FIRST: 'network-first', 
    STALE_WHILE_REVALIDATE: 'stale-while-revalidate'
};

// Assets für sofortiges Caching beim Install
const CRITICAL_ASSETS = [
    '/',
    '/index.html',
    '/manifest.json'
];

// Statische Assets für Background-Caching
const STATIC_ASSETS = [
    '/js/app.js',
    '/js/pwa.js',
    '/css/style.css',
    '/icons/icon-192x192.png',
    '/icons/icon-512x512.png'
];

// Cache-TTL Konfiguration (in Millisunden)
const CACHE_TTL = {
    API_DATA: 15 * 60 * 1000,      // 15 Minuten
    STATIC_ASSETS: 24 * 60 * 60 * 1000, // 24 Stunden
    HTML_PAGES: 60 * 60 * 1000      // 1 Stunde
};

// Request-Queue für Offline-Requests
let requestQueue = [];
let isOnline = true;

// ==================================================================== 
// SERVICE WORKER INSTALLATION - Optimiert
// ====================================================================

self.addEventListener('install', (event) => {
    console.log('🔧 Service Worker v3.1 Installation gestartet');
    
    event.waitUntil(
        Promise.all([
            // Kritische Assets sofort cachen
            caches.open(CACHE_NAME).then(cache => {
                console.log('📦 Kritische Assets werden gecacht');
                return cache.addAll(CRITICAL_ASSETS);
            }),
            
            // Statische Assets im Hintergrund cachen
            caches.open(STATIC_CACHE_NAME).then(cache => {
                console.log('📦 Statische Assets werden im Hintergrund gecacht');
                return cache.addAll(STATIC_ASSETS).catch(error => {
                    console.warn('⚠️ Einige statische Assets konnten nicht gecacht werden:', error);
                });
            }),
            
            // Performance-Metriken initialisieren
            initializePerformanceMonitoring()
            
        ]).then(() => {
            console.log('✅ Installation erfolgreich - Service Worker aktivieren');
            return self.skipWaiting();
        }).catch(error => {
            console.error('❌ Installation fehlgeschlagen:', error);
            // Graceful degradation - Installation trotzdem fortsetzen
            return self.skipWaiting();
        })
    );
});

// ==================================================================== 
// SERVICE WORKER ACTIVATION - Erweitert
// ====================================================================

self.addEventListener('activate', (event) => {
    console.log('⚡ Service Worker v3.1 Aktivierung gestartet');
    
    event.waitUntil(
        Promise.all([
            // Cache-Cleanup mit verbesserter Logik
            performCacheCleanup(),
            
            // Client-Kontrolle übernehmen
            self.clients.claim(),
            
            // Background-Tasks initialisieren
            initializeBackgroundTasks(),
            
            // Performance-Monitoring starten
            startPerformanceMonitoring()
            
        ]).then(() => {
            console.log('✅ Service Worker v3.1 aktiviert und bereit');
            
            // Clients über Aktivierung informieren
            notifyClientsOfActivation();
        })
    );
});

// ==================================================================== 
// FETCH EVENT HANDLING - Intelligente Routing-Strategie
// ====================================================================

self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);
    
    // Skip non-HTTP requests und Extension-Requests
    if (!request.url.startsWith('http') || 
        url.hostname.includes('extension') ||
        url.protocol === 'chrome-extension:') {
        return;
    }
    
    // Request-Typ ermitteln und entsprechende Handler verwenden
    const handler = getRequestHandler(request, url);
    
    if (handler) {
        event.respondWith(handler(request, url));
    }
});

// ==================================================================== 
// INTELLIGENTE REQUEST-HANDLER AUSWAHL
// ====================================================================

function getRequestHandler(request, url) {
    // Netlify Functions API
    if (url.pathname.startsWith('/.netlify/functions/')) {
        return handleNetlifyFunctionRequest;
    }
    
    // Standard API-Requests
    if (url.pathname.startsWith('/api/')) {
        return handleAPIRequest;
    }
    
    // Navigation-Requests (HTML-Seiten)
    if (request.mode === 'navigate' || 
        (request.method === 'GET' && request.headers.get('accept')?.includes('text/html'))) {
        return handleNavigationRequest;
    }
    
    // Statische Assets
    if (isStaticAsset(url.pathname)) {
        return handleStaticAssetRequest;
    }
    
    // Images und Media
    if (request.destination === 'image' || 
        request.destination === 'audio' || 
        request.destination === 'video') {
        return handleMediaRequest;
    }
    
    // Default Asset Handler
    return handleAssetRequest;
}

// ==================================================================== 
// NETLIFY FUNCTIONS REQUEST HANDLING - Neu
// ====================================================================

async function handleNetlifyFunctionRequest(request, url) {
    console.log('🔧 Handling Netlify Function:', url.pathname);
    
    try {
        // Network-First für Netlify Functions
        const networkResponse = await fetchWithTimeout(request, 10000);
        
        if (networkResponse.ok) {
            // Erfolgreiche GET-Requests cachen
            if (request.method === 'GET') {
                const cache = await caches.open(
                    url.pathname.includes('goals') ? GOALS_CACHE_NAME : API_CACHE_NAME
                );
                
                // Response mit TTL-Header cachen
                const responseToCache = addTTLHeaders(networkResponse.clone(), CACHE_TTL.API_DATA);
                cache.put(request, responseToCache);
            }
            return networkResponse;
        }
        
        throw new Error(`Netlify Function response: ${networkResponse.status}`);
        
    } catch (error) {
        console.log('🌐 Netlify Function failed, trying fallback:', error.message);
        
        // Fallback-Strategien
        if (request.method === 'GET') {
            const cache = await caches.open(
                url.pathname.includes('goals') ? GOALS_CACHE_NAME : API_CACHE_NAME
            );
            const cachedResponse = await cache.match(request);
            
            if (cachedResponse && !isCacheExpired(cachedResponse)) {
                console.log('📦 Serving from Function cache:', url.pathname);
                return cachedResponse;
            }
        }
        
        // POST-Requests für Offline-Queue
        if (request.method === 'POST') {
            await queueOfflineRequest(request);
        }
        
        return createOfflineResponse(request, {
            error: 'Function temporarily unavailable',
            offline: true,
            queued: request.method === 'POST'
        });
    }
}

// ==================================================================== 
// API REQUEST HANDLING - Verbessert
// ====================================================================

async function handleAPIRequest(request, url) {
    console.log('📡 Handling API Request:', request.method, url.pathname);
    
    try {
        // Timeout-basierter Network-Request
        const networkResponse = await fetchWithTimeout(request, 8000);
        
        if (networkResponse.ok) {
            // GET-Requests intelligent cachen
            if (request.method === 'GET') {
                const cache = await caches.open(
                    url.pathname.includes('/goals') ? GOALS_CACHE_NAME : API_CACHE_NAME
                );
                
                const responseToCache = addTTLHeaders(
                    networkResponse.clone(), 
                    CACHE_TTL.API_DATA
                );
                
                // Cache-Update im Hintergrund
                cache.put(request, responseToCache);
            }
            
            return networkResponse;
        }
        
        throw new Error(`API response: ${networkResponse.status}`);
        
    } catch (error) {
        console.log('🌐 API Network failed:', error.message);
        
        // GET-Requests: Cache-Fallback
        if (request.method === 'GET') {
            const cache = await caches.open(
                url.pathname.includes('/goals') ? GOALS_CACHE_NAME : API_CACHE_NAME
            );
            const cachedResponse = await cache.match(request);
            
            if (cachedResponse) {
                if (!isCacheExpired(cachedResponse)) {
                    console.log('📦 Serving fresh cached API data');
                    return cachedResponse;
                } else {
                    console.log('📦 Serving stale cached API data');
                    // Stale Cache mit Warnung zurückgeben
                    const staleResponse = cachedResponse.clone();
                    staleResponse.headers.set('X-Cache-Status', 'stale');
                    return staleResponse;
                }
            }
        }
        
        // POST/PUT-Requests: Offline-Queue
        if (request.method !== 'GET') {
            await queueOfflineRequest(request);
            return createOfflineResponse(request, {
                error: 'Request queued for later sync',
                queued: true,
                method: request.method
            });
        }
        
        // Default Offline-Response
        return createOfflineResponse(request, {
            error: 'API temporarily unavailable',
            offline: true
        });
    }
}

// ==================================================================== 
// NAVIGATION REQUEST HANDLING - Optimiert
// ====================================================================

async function handleNavigationRequest(request, url) {
    console.log('🧭 Handling Navigation:', url.pathname);
    
    try {
        // Network-First mit schnellem Timeout
        const networkResponse = await fetchWithTimeout(request, 5000);
        
        if (networkResponse.ok) {
            // HTML-Response cachen
            const cache = await caches.open(CACHE_NAME);
            const responseToCache = addTTLHeaders(
                networkResponse.clone(), 
                CACHE_TTL.HTML_PAGES
            );
            cache.put(request, responseToCache);
            
            return networkResponse;
        }
        
        throw new Error(`Navigation response: ${networkResponse.status}`);
        
    } catch (error) {
        console.log('🌐 Navigation network failed, serving offline fallback');
        
        // Cache-Fallback
        const cache = await caches.open(CACHE_NAME);
        let cachedResponse = await cache.match(request);
        
        // Fallback-Hierarchy
        if (!cachedResponse) {
            cachedResponse = await cache.match('/index.html') || 
                            await cache.match('/');
        }
        
        if (cachedResponse) {
            return cachedResponse;
        }
        
        // Ultimate Fallback - Verbesserte Offline-Seite
        return createOfflinePageResponse();
    }
}

// ==================================================================== 
// STATISCHE ASSETS - Cache-First mit Background-Update
// ====================================================================

async function handleStaticAssetRequest(request, url) {
    const cache = await caches.open(STATIC_CACHE_NAME);
    
    try {
        // Cache-First Strategie
        const cachedResponse = await cache.match(request);
        
        if (cachedResponse && !isCacheExpired(cachedResponse)) {
            // Background-Update für häufig genutzte Assets
            if (isFrequentlyUsedAsset(url.pathname)) {
                updateAssetInBackground(request, cache);
            }
            
            return cachedResponse;
        }
        
        // Network-Fetch mit Cache-Update
        const networkResponse = await fetchWithTimeout(request, 10000);
        
        if (networkResponse.ok) {
            const responseToCache = addTTLHeaders(
                networkResponse.clone(), 
                CACHE_TTL.STATIC_ASSETS
            );
            cache.put(request, responseToCache);
        }
        
        return networkResponse;
        
    } catch (error) {
        console.log('❌ Static asset failed:', url.pathname);
        
        // Stale Cache als Fallback
        const staleResponse = await cache.match(request);
        if (staleResponse) {
            console.log('📦 Serving stale static asset');
            return staleResponse;
        }
        
        throw error;
    }
}

// ==================================================================== 
// MEDIA REQUEST HANDLING - Optimiert
// ====================================================================

async function handleMediaRequest(request, url) {
    try {
        const cache = await caches.open(STATIC_CACHE_NAME);
        const cachedResponse = await cache.match(request);
        
        if (cachedResponse) {
            return cachedResponse;
        }
        
        // Network-Request für Media
        const networkResponse = await fetchWithTimeout(request, 15000);
        
        if (networkResponse.ok && networkResponse.size < 5 * 1024 * 1024) { // < 5MB
            cache.put(request, networkResponse.clone());
        }
        
        return networkResponse;
        
    } catch (error) {
        console.log('❌ Media request failed:', url.pathname);
        
        // Offline-Placeholder für Images
        if (request.destination === 'image') {
            return createOfflineImagePlaceholder();
        }
        
        throw error;
    }
}

// ==================================================================== 
// GENERIC ASSET REQUEST HANDLING - Fallback
// ====================================================================

async function handleAssetRequest(request, url) {
    try {
        const cache = await caches.open(CACHE_NAME);
        const cachedResponse = await cache.match(request);
        
        if (cachedResponse && !isCacheExpired(cachedResponse)) {
            // Background-Update
            updateAssetInBackground(request, cache);
            return cachedResponse;
        }
        
        const networkResponse = await fetchWithTimeout(request, 8000);
        
        if (networkResponse.ok) {
            const responseToCache = addTTLHeaders(
                networkResponse.clone(), 
                CACHE_TTL.STATIC_ASSETS
            );
            cache.put(request, responseToCache);
        }
        
        return networkResponse;
        
    } catch (error) {
        console.log('❌ Generic asset request failed:', url.pathname);
        
        // Stale Cache-Fallback
        const cache = await caches.open(CACHE_NAME);
        const staleResponse = await cache.match(request);
        
        if (staleResponse) {
            return staleResponse;
        }
        
        throw error;
    }
}

// ==================================================================== 
// UTILITY FUNCTIONS - Erweitert und Optimiert
// ====================================================================

// Timeout-basierter Fetch
async function fetchWithTimeout(request, timeout = 8000) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    try {
        const response = await fetch(request, {
            signal: controller.signal
        });
        clearTimeout(timeoutId);
        return response;
    } catch (error) {
        clearTimeout(timeoutId);
        if (error.name === 'AbortError') {
            throw new Error('Request timeout');
        }
        throw error;
    }
}

// TTL-Headers hinzufügen
function addTTLHeaders(response, ttl) {
    const headers = new Headers(response.headers);
    headers.set('sw-cache-timestamp', Date.now().toString());
    headers.set('sw-cache-ttl', ttl.toString());
    
    return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: headers
    });
}

// Cache-Expiry prüfen
function isCacheExpired(response) {
    const timestamp = response.headers.get('sw-cache-timestamp');
    const ttl = response.headers.get('sw-cache-ttl');
    
    if (!timestamp || !ttl) {
        return false; // Keine TTL-Info, als frisch betrachten
    }
    
    const age = Date.now() - parseInt(timestamp);
    return age > parseInt(ttl);
}

// Statisches Asset erkennen
function isStaticAsset(pathname) {
    const staticExtensions = ['.js', '.css', '.html', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.woff', '.woff2', '.ttf'];
    const staticPaths = ['/static/', '/assets/', '/images/', '/css/', '/js/'];
    
    return staticExtensions.some(ext => pathname.endsWith(ext)) ||
           staticPaths.some(path => pathname.startsWith(path)) ||
           pathname === '/';
}

// Häufig genutzte Assets
function isFrequentlyUsedAsset(pathname) {
    const frequentAssets = ['/js/app.js', '/css/style.css', '/manifest.json'];
    return frequentAssets.includes(pathname);
}

// Background Asset-Update
async function updateAssetInBackground(request, cache) {
    try {
        const networkResponse = await fetchWithTimeout(request.clone(), 5000);
        if (networkResponse.ok) {
            const responseToCache = addTTLHeaders(
                networkResponse.clone(), 
                CACHE_TTL.STATIC_ASSETS
            );
            await cache.put(request, responseToCache);
            console.log('🔄 Background update successful:', request.url);
        }
    } catch (error) {
        console.log('⚠️ Background update failed:', request.url);
    }
}

// Offline-Request in Queue einreihen
async function queueOfflineRequest(request) {
    try {
        const requestData = {
            url: request.url,
            method: request.method,
            headers: Object.fromEntries(request.headers.entries()),
            body: request.method !== 'GET' ? await request.text() : null,
            timestamp: Date.now(),
            id: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        };
        
        requestQueue.push(requestData);
        
        // Persistent storage
        const queuedRequests = JSON.parse(
            (await self.caches.open('request-queue').then(cache => 
                cache.match('queue-data')
            ).then(response => response?.text())) || '[]'
        );
        
        queuedRequests.push(requestData);
        
        const queueCache = await caches.open('request-queue');
        await queueCache.put('queue-data', new Response(JSON.stringify(queuedRequests)));
        
        console.log('📝 Request queued:', requestData.id);
        
        // Background Sync registrieren
        if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
            const registration = await self.registration;
            await registration.sync.register('background-sync');
        }
        
    } catch (error) {
        console.error('❌ Failed to queue request:', error);
    }
}

// Offline-Response erstellen
function createOfflineResponse(request, data = {}) {
    const responseData = {
        offline: true,
        timestamp: new Date().toISOString(),
        url: request.url,
        method: request.method,
        ...data
    };
    
    return new Response(JSON.stringify(responseData), {
        status: 503,
        statusText: 'Service Unavailable - Offline',
        headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache'
        }
    });
}

// Offline-Seite Response
function createOfflinePageResponse() {
    const offlineHTML = `
    <!DOCTYPE html>
    <html lang="de">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>Health Tracker - Offline</title>
        <style>
            body { 
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                text-align: center; 
                padding: 50px 20px; 
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                min-height: 100vh;
                margin: 0;
                display: flex;
                align-items: center;
                justify-content: center;
                flex-direction: column;
            }
            .container {
                background: rgba(255,255,255,0.1);
                padding: 40px;
                border-radius: 20px;
                backdrop-filter: blur(10px);
                box-shadow: 0 8px 32px rgba(31, 38, 135, 0.37);
            }
            .emoji { font-size: 4rem; margin-bottom: 20px; }
            h1 { margin: 20px 0; font-size: 2rem; }
            p { margin: 15px 0; opacity: 0.9; line-height: 1.6; }
            button {
                background: #4CAF50;
                color: white;
                border: none;
                padding: 15px 30px;
                font-size: 16px;
                border-radius: 25px;
                cursor: pointer;
                margin: 10px;
                transition: background 0.3s;
            }
            button:hover { background: #45a049; }
            .features {
                margin-top: 30px;
                text-align: left;
                opacity: 0.8;
            }
            .features ul {
                list-style: none;
                padding: 0;
            }
            .features li {
                margin: 10px 0;
                padding-left: 25px;
                position: relative;
            }
            .features li:before {
                content: "✓";
                position: absolute;
                left: 0;
                color: #4CAF50;
                font-weight: bold;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="emoji">📱💚</div>
            <h1>Health Tracker - Offline Modus</h1>
            <p>Die App funktioniert auch offline! Deine Daten werden automatisch synchronisiert, sobald die Verbindung wiederhergestellt ist.</p>
            
            <button onclick="window.location.reload()">🔄 Verbindung prüfen</button>
            <button onclick="window.location.href='/'">🏠 Zur App</button>
            
            <div class="features">
                <h3>Verfügbare Offline-Features:</h3>
                <ul>
                    <li>Gesundheitsdaten eingeben</li>
                    <li>Trends und Statistiken anzeigen</li>
                    <li>Ziele verwalten</li>
                    <li>Lokale Datenspeicherung</li>
                </ul>
            </div>
        </div>
    </body>
    </html>`;
    
    return new Response(offlineHTML, {
        headers: { 'Content-Type': 'text/html; charset=utf-8' }
    });
}

// Offline-Image Placeholder
function createOfflineImagePlaceholder() {
    const svg = `
        <svg xmlns="http://www.w3.org/2000/svg" width="300" height="200" viewBox="0 0 300 200">
            <defs>
                <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style="stop-color:#f0f0f0;stop-opacity:1" />
                    <stop offset="100%" style="stop-color:#e0e0e0;stop-opacity:1" />
                </linearGradient>
            </defs>
            <rect width="300" height="200" fill="url(#grad)"/>
            <circle cx="150" cy="80" r="25" fill="#ccc"/>
            <polygon points="120,120 180,120 150,90" fill="#ccc"/>
            <text x="150" y="160" text-anchor="middle" fill="#999" font-family="Arial" font-size="14">
                📱 Offline
            </text>
        </svg>`;
    
    return new Response(svg, {
        headers: { 'Content-Type': 'image/svg+xml' }
    });
}

// ==================================================================== 
// CACHE-MANAGEMENT - Erweitert
// ====================================================================

async function performCacheCleanup() {
    try {
        const cacheNames = await caches.keys();
        const currentCaches = [CACHE_NAME, API_CACHE_NAME, GOALS_CACHE_NAME, STATIC_CACHE_NAME];
        
        const deletePromises = cacheNames
            .filter(name => !currentCaches.includes(name))
            .map(name => {
                console.log('🗑️ Entferne veralteten Cache:', name);
                return caches.delete(name);
            });
        
        await Promise.all(deletePromises);
        console.log('✅ Cache-Cleanup abgeschlossen');
        
        // Cache-Größe prüfen und bei Bedarf bereinigen
        await performCacheSizeOptimization();
        
    } catch (error) {
        console.error('❌ Cache-Cleanup Fehler:', error);
    }
}

async function performCacheSizeOptimization() {
    try {
        // Estimate Storage API nutzen falls verfügbar
        if ('storage' in navigator && 'estimate' in navigator.storage) {
            const estimate = await navigator.storage.estimate();
            const usagePercentage = (estimate.usage / estimate.quota) * 100;
            
            console.log(`💾 Storage usage: ${usagePercentage.toFixed(1)}%`);
            
            // Bei über 80% Nutzung Cache bereinigen
            if (usagePercentage > 80) {
                console.log('🧹 Starting aggressive cache cleanup');
                await performAggressiveCacheCleanup();
            }
        }
    } catch (error) {
        console.error('❌ Storage optimization error:', error);
    }
}

async function performAggressiveCacheCleanup() {
    const caches_to_clean = [API_CACHE_NAME, GOALS_CACHE_NAME];
    
    for (const cacheName of caches_to_clean) {
        try {
            const cache = await caches.open(cacheName);
            const requests = await cache.keys();
            
            // Sortiere nach Alter und entferne die ältesten 50%
            const sortedRequests = requests.sort((a, b) => {
                const aTime = new Date(a.headers.get('date') || 0).getTime();
                const bTime = new Date(b.headers.get('date') || 0).getTime();
                return aTime - bTime;
            });
            
            const toDelete = sortedRequests.slice(0, Math.floor(sortedRequests.length / 2));
            
            await Promise.all(toDelete.map(request => cache.delete(request)));
            console.log(`🧹 Cleaned ${toDelete.length} entries from ${cacheName}`);
            
        } catch (error) {
            console.error(`❌ Error cleaning cache ${cacheName}:`, error);
        }
    }
}

// ==================================================================== 
// BACKGROUND SYNC - Verbessert
// ====================================================================

self.addEventListener('sync', (event) => {
    console.log('📤 Background Sync Event:', event.tag);
    
    switch (event.tag) {
        case 'background-sync':
            event.waitUntil(performBackgroundSync());
            break;
        case 'periodic-cleanup':
            event.waitUntil(performPeriodicCleanup());
            break;
        default:
            console.log('❓ Unknown sync tag:', event.tag);
    }
});

async function performBackgroundSync() {
    console.log('🔄 Starting background sync...');
    
    try {
        // Verarbeite Offline-Queue
        await processOfflineQueue();
        
        // Benachrichtige Clients über Sync
        const clients = await self.clients.matchAll();
        for (const client of clients) {
            client.postMessage({
                type: 'BACKGROUND_SYNC',
                action: 'REQUEST_SYNC',
                timestamp: Date.now()
            });
        }
        
        console.log('✅ Background sync completed');
        
    } catch (error) {
        console.error('❌ Background sync failed:', error);
        throw error; // Retry later
    }
}

async function processOfflineQueue() {
    try {
        const queueCache = await caches.open('request-queue');
        const queueResponse = await queueCache.match('queue-data');
        
        if (!queueResponse) {
            console.log('📭 No offline requests in queue');
            return;
        }
        
        const queuedRequests = JSON.parse(await queueResponse.text());
        const processedRequests = [];
        
        for (const requestData of queuedRequests) {
            try {
                const response = await fetch(requestData.url, {
                    method: requestData.method,
                    headers: requestData.headers,
                    body: requestData.body
                });
                
                if (response.ok) {
                    console.log('✅ Queued request processed:', requestData.id);
                    processedRequests.push(requestData);
                }
                
            } catch (error) {
                console.log('❌ Queued request still failing:', requestData.id);
                
                // Requests älter als 24h löschen
                if (Date.now() - requestData.timestamp > 24 * 60 * 60 * 1000) {
                    console.log('🗑️ Removing expired request:', requestData.id);
                    processedRequests.push(requestData);
                }
            }
        }
        
        // Queue aktualisieren
        if (processedRequests.length > 0) {
            const remainingRequests = queuedRequests.filter(req => 
                !processedRequests.some(processed => processed.id === req.id)
            );
            
            await queueCache.put('queue-data', new Response(JSON.stringify(remainingRequests)));
            console.log(`📝 Processed ${processedRequests.length} requests, ${remainingRequests.length} remaining`);
        }
        
    } catch (error) {
        console.error('❌ Offline queue processing failed:', error);
    }
}

// ==================================================================== 
// PERFORMANCE MONITORING
// ====================================================================

async function initializePerformanceMonitoring() {
    console.log('📊 Initializing performance monitoring');
    
    // Performance-Metriken sammeln
    self.performanceMetrics = {
        cacheHits: 0,
        cacheMisses: 0,
        networkRequests: 0,
        offlineRequests: 0,
        startTime: Date.now()
    };
}

async function startPerformanceMonitoring() {
    // Periodische Performance-Reports
    setInterval(() => {
        const metrics = self.performanceMetrics;
        const uptime = Date.now() - metrics.startTime;
        
        console.log('📊 Performance Report:', {
            uptime: `${Math.round(uptime / 1000)}s`,
            cacheHitRate: `${((metrics.cacheHits / (metrics.cacheHits + metrics.cacheMisses)) * 100 || 0).toFixed(1)}%`,
            totalRequests: metrics.cacheHits + metrics.cacheMisses,
            offlineRequests: metrics.offlineRequests
        });
        
    }, 5 * 60 * 1000); // Alle 5 Minuten
}

// ==================================================================== 
// MESSAGE HANDLING - Erweitert
// ====================================================================

self.addEventListener('message', (event) => {
    const { data } = event;
    
    console.log('📨 Message received:', data.type);
    
    switch (data.type) {
        case 'SKIP_WAITING':
            self.skipWaiting();
            break;
            
        case 'CACHE_UPDATE':
            event.waitUntil(updateCache(data.urls));
            break;
            
        case 'CLEAR_CACHE':
            event.waitUntil(performCacheCleanup());
            break;
            
        case 'GET_CACHE_STATUS':
            event.waitUntil(sendCacheStatus(event.source));
            break;
            
        case 'FORCE_SYNC':
            event.waitUntil(performBackgroundSync());
            break;
            
        case 'GET_PERFORMANCE':
            event.source.postMessage({
                type: 'PERFORMANCE_DATA',
                data: self.performanceMetrics
            });
            break;
            
        default:
            console.log('❓ Unknown message type:', data.type);
    }
});

async function sendCacheStatus(client) {
    try {
        const cacheNames = await caches.keys();
        const cacheStatus = {};
        
        for (const cacheName of cacheNames) {
            const cache = await caches.open(cacheName);
            const keys = await cache.keys();
            cacheStatus[cacheName] = keys.length;
        }
        
        client.postMessage({
            type: 'CACHE_STATUS',
            data: cacheStatus
        });
        
    } catch (error) {
        console.error('❌ Error getting cache status:', error);
    }
}

// ==================================================================== 
// BACKGROUND TASKS
// ====================================================================

async function initializeBackgroundTasks() {
    // Periodische Cache-Bereinigung registrieren
    try {
        const registration = await self.registration;
        await registration.sync.register('periodic-cleanup');
        console.log('⏰ Periodic cleanup scheduled');
    } catch (error) {
        console.log('⚠️ Periodic sync not available');
    }
}

async function performPeriodicCleanup() {
    console.log('🧹 Performing periodic cleanup');
    
    await Promise.all([
        performCacheSizeOptimization(),
        cleanupExpiredCacheEntries(),
        processOfflineQueue()
    ]);
}

async function cleanupExpiredCacheEntries() {
    const cacheNames = [API_CACHE_NAME, GOALS_CACHE_NAME, STATIC_CACHE_NAME];
    
    for (const cacheName of cacheNames) {
        try {
            const cache = await caches.open(cacheName);
            const requests = await cache.keys();
            
            for (const request of requests) {
                const response = await cache.match(request);
                if (response && isCacheExpired(response)) {
                    await cache.delete(request);
                    console.log('🗑️ Removed expired cache entry:', request.url);
                }
            }
        } catch (error) {
            console.error(`❌ Error cleaning ${cacheName}:`, error);
        }
    }
}

// ==================================================================== 
// CLIENT NOTIFICATION
// ====================================================================

async function notifyClientsOfActivation() {
    const clients = await self.clients.matchAll();
    
    for (const client of clients) {
        client.postMessage({
            type: 'SW_ACTIVATED',
            version: '3.1',
            timestamp: Date.now(),
            features: [
                'Intelligent Caching',
                'Offline Queue',
                'Background Sync',
                'Performance Monitoring',
                'Automatic Cleanup'
            ]
        });
    }
}

// ==================================================================== 
// PUSH NOTIFICATIONS - Erweitert
// ====================================================================

self.addEventListener('push', (event) => {
    if (!event.data) {
        console.log('📢 Push event without data');
        return;
    }
    
    try {
        const data = event.data.json();
        
        const options = {
            body: data.body || 'Health Tracker Benachrichtigung',
            icon: '/icons/icon-192x192.png',
            badge: '/icons/icon-72x72.png',
            tag: data.tag || 'health-tracker',
            data: data.data || {},
            actions: [
                {
                    action: 'view',
                    title: '📱 App öffnen',
                    icon: '/icons/icon-72x72.png'
                },
                {
                    action: 'dismiss',
                    title: '❌ Schließen'
                }
            ],
            vibrate: [200, 100, 200],
            requireInteraction: data.requireInteraction || false
        };
        
        event.waitUntil(
            self.registration.showNotification(
                data.title || 'Health Tracker', 
                options
            )
        );
        
        console.log('📢 Push notification displayed');
        
    } catch (error) {
        console.error('❌ Push notification error:', error);
    }
});

self.addEventListener('notificationclick', (event) => {
    console.log('📱 Notification clicked:', event.action);
    
    event.notification.close();
    
    if (event.action === 'view' || !event.action) {
        event.waitUntil(
            clients.matchAll().then(clientList => {
                // Versuche existierenden Tab zu fokussieren
                for (const client of clientList) {
                    if (client.url.includes(self.location.origin) && 'focus' in client) {
                        return client.focus();
                    }
                }
                
                // Öffne neuen Tab falls keiner existiert
                if (clients.openWindow) {
                    return clients.openWindow('/');
                }
            })
        );
    }
});

// ==================================================================== 
// INITIALIZATION
// ====================================================================

console.log('🚀 Health Tracker Service Worker v3.1 loaded and ready');
console.log('💾 Cache Strategy: Intelligent with TTL and Background Updates');
console.log('🔄 Offline Support: Full with Request Queue');
console.log('📊 Performance Monitoring: Enabled');
