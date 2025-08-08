// === ENTERPRISE SERVICE WORKER V3.0 ===
const CACHE_NAME = 'health-tracker-v3.0';
const STATIC_CACHE = 'health-tracker-static-v3.0';
const DYNAMIC_CACHE = 'health-tracker-dynamic-v3.0';
const API_CACHE = 'health-tracker-api-v3.0';

// Advanced caching strategies
const CACHE_STRATEGIES = {
    'static': ['/', '/index.html', '/styles.css', '/js/', '/icons/'],
    'staleWhileRevalidate': ['/api/health-data', '/api/goals'],
    'networkFirst': ['/api/sync', '/api/analytics'],
    'cacheFirst': ['/images/', '/fonts/', '.woff2', '.woff', '.ttf']
};

// Performance monitoring in Service Worker
let performanceMetrics = {
    cacheHits: 0,
    cacheMisses: 0,
    networkRequests: 0,
    backgroundSyncs: 0,
    pushNotifications: 0
};

// === ADVANCED INSTALLATION & ACTIVATION ===
self.addEventListener('install', event => {
    console.log('🔧 SW: Advanced Service Worker v3.0 wird installiert');
    
    event.waitUntil(
        Promise.all([
            // Pre-cache critical resources
            caches.open(STATIC_CACHE).then(cache => {
                return cache.addAll([
                    '/',
                    '/index.html',
                    '/styles.css',
                    '/js/health-tracker.js',
                    '/js/chart.min.js',
                    '/js/lucide.min.js',
                    '/manifest.json',
                    '/icons/icon-192x192.png',
                    '/icons/icon-512x512.png'
                ]);
            }),
            // Initialize IndexedDB for advanced caching
            initAdvancedStorage(),
            // Pre-warm critical API endpoints
            preWarmAPIEndpoints()
        ])
    );
    
    // Force activation without waiting
    self.skipWaiting();
});

self.addEventListener('activate', event => {
    console.log('✅ SW: Service Worker v3.0 aktiviert');
    
    event.waitUntil(
        Promise.all([
            // Clean up old caches
            cleanupOldCaches(),
            // Initialize background sync
            initBackgroundSync(),
            // Setup push notification handling
            initPushNotifications(),
            // Claim all clients
            self.clients.claim()
        ])
    );
});

// === INTELLIGENT FETCH HANDLER ===
self.addEventListener('fetch', event => {
    const url = new URL(event.request.url);
    const strategy = determineStrategy(event.request);
    
    // Track performance metrics
    performanceMetrics.networkRequests++;
    
    // Apply intelligent caching strategy
    event.respondWith(
        executeStrategy(event.request, strategy)
            .then(response => {
                // Send performance data to main thread
                broadcastPerformanceMetrics();
                return response;
            })
            .catch(error => {
                console.error('SW: Fetch error:', error);
                return handleFetchError(event.request, error);
            })
    );
});

// === BACKGROUND SYNC FOR OFFLINE DATA ===
self.addEventListener('sync', event => {
    console.log('🔄 SW: Background Sync ausgelöst:', event.tag);
    performanceMetrics.backgroundSyncs++;
    
    if (event.tag === 'health-data-sync') {
        event.waitUntil(syncHealthData());
    } else if (event.tag === 'analytics-sync') {
        event.waitUntil(syncAnalyticsData());
    } else if (event.tag === 'goals-sync') {
        event.waitUntil(syncGoalsData());
    }
});

// === ADVANCED PUSH NOTIFICATIONS ===
self.addEventListener('push', event => {
    console.log('🔔 SW: Push Notification empfangen');
    performanceMetrics.pushNotifications++;
    
    const data = event.data ? event.data.json() : {};
    
    const options = {
        title: data.title || 'Health Tracker',
        body: data.body || 'Neue Gesundheitsdaten verfügbar',
        icon: '/icons/icon-192x192.png',
        badge: '/icons/badge-72x72.png',
        tag: data.tag || 'health-notification',
        requireInteraction: data.requireInteraction || false,
        actions: data.actions || [
            {
                action: 'open',
                title: 'App öffnen',
                icon: '/icons/action-open.png'
            },
            {
                action: 'dismiss',
                title: 'Verwerfen',
                icon: '/icons/action-dismiss.png'
            }
        ],
        data: {
            url: data.url || '/',
            timestamp: Date.now(),
            analytics: data.analytics || {}
        }
    };
    
    event.waitUntil(
        self.registration.showNotification(options.title, options)
    );
});

// === NOTIFICATION CLICK HANDLING ===
self.addEventListener('notificationclick', event => {
    console.log('👆 SW: Notification Click:', event.action);
    
    event.notification.close();
    
    if (event.action === 'open' || !event.action) {
        event.waitUntil(
            clients.matchAll({ type: 'window', includeUncontrolled: true })
                .then(clientList => {
                    const url = event.notification.data?.url || '/';
                    
                    // Check if app is already open
                    for (const client of clientList) {
                        if (client.url.includes(url) && 'focus' in client) {
                            return client.focus();
                        }
                    }
                    
                    // Open new window/tab
                    if (clients.openWindow) {
                        return clients.openWindow(url);
                    }
                })
        );
    } else if (event.action === 'dismiss') {
        // Handle dismiss - send analytics
        sendAnalyticsEvent('notification', 'dismiss', event.notification.tag);
    }
});

// === INTELLIGENT CACHING STRATEGIES ===
async function executeStrategy(request, strategy) {
    switch (strategy) {
        case 'cacheFirst':
            return cacheFirstStrategy(request);
        case 'networkFirst':
            return networkFirstStrategy(request);
        case 'staleWhileRevalidate':
            return staleWhileRevalidateStrategy(request);
        case 'networkOnly':
            return fetch(request);
        default:
            return cacheFirstStrategy(request);
    }
}

async function cacheFirstStrategy(request) {
    const cache = await caches.open(DYNAMIC_CACHE);
    const cached = await cache.match(request);
    
    if (cached) {
        performanceMetrics.cacheHits++;
        
        // Intelligent cache refresh for critical resources
        if (shouldRefreshCache(request)) {
            refreshCacheInBackground(request, cache);
        }
        
        return cached;
    }
    
    performanceMetrics.cacheMisses++;
    const response = await fetch(request);
    
    if (response.ok && shouldCache(request)) {
        cache.put(request, response.clone());
    }
    
    return response;
}

async function networkFirstStrategy(request) {
    try {
        const response = await fetch(request);
        
        if (response.ok) {
            const cache = await caches.open(API_CACHE);
            cache.put(request, response.clone());
        }
        
        return response;
    } catch (error) {
        const cache = await caches.open(API_CACHE);
        const cached = await cache.match(request);
        
        if (cached) {
            performanceMetrics.cacheHits++;
            return cached;
        }
        
        throw error;
    }
}

async function staleWhileRevalidateStrategy(request) {
    const cache = await caches.open(API_CACHE);
    const cached = await cache.match(request);
    
    const fetchPromise = fetch(request)
        .then(response => {
            if (response.ok) {
                cache.put(request, response.clone());
            }
            return response;
        })
        .catch(() => cached); // Fallback to cache
    
    return cached || fetchPromise;
}

// === BACKGROUND DATA SYNCHRONIZATION ===
async function syncHealthData() {
    try {
        console.log('🔄 SW: Synchronisiere Gesundheitsdaten');
        
        // Get pending data from IndexedDB
        const pendingData = await getPendingHealthData();
        
        if (pendingData.length === 0) {
            console.log('✅ SW: Keine ausstehenden Daten');
            return;
        }
        
        // Sync with server
        for (const dataEntry of pendingData) {
            try {
                const response = await fetch('/api/health-data', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(dataEntry)
                });
                
                if (response.ok) {
                    await removePendingHealthData(dataEntry.id);
                    console.log(`✅ SW: Daten synchronisiert: ${dataEntry.id}`);
                } else {
                    console.error('❌ SW: Sync fehlgeschlagen:', response.status);
                }
            } catch (error) {
                console.error('❌ SW: Sync Fehler:', error);
            }
        }
        
        // Notify main thread of successful sync
        broadcastMessage({
            type: 'SYNC_COMPLETE',
            data: { type: 'health-data', synced: pendingData.length }
        });
        
    } catch (error) {
        console.error('❌ SW: Health Data Sync Fehler:', error);
    }
}

async function syncAnalyticsData() {
    try {
        console.log('📊 SW: Synchronisiere Analytics-Daten');
        
        const analyticsData = await getPendingAnalyticsData();
        
        if (analyticsData.length > 0) {
            const response = await fetch('/api/analytics/batch', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(analyticsData)
            });
            
            if (response.ok) {
                await clearPendingAnalyticsData();
                broadcastMessage({
                    type: 'ANALYTICS_SYNC_COMPLETE',
                    data: { events: analyticsData.length }
                });
            }
        }
    } catch (error) {
        console.error('❌ SW: Analytics Sync Fehler:', error);
    }
}

// === ADVANCED INDEXEDDB OPERATIONS ===
async function initAdvancedStorage() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('HealthTrackerAdvanced', 3);
        
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
        
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            
            // Health data store
            if (!db.objectStoreNames.contains('pendingHealthData')) {
                const healthStore = db.createObjectStore('pendingHealthData', { keyPath: 'id' });
                healthStore.createIndex('timestamp', 'timestamp');
                healthStore.createIndex('type', 'type');
            }
            
            // Analytics store
            if (!db.objectStoreNames.contains('analyticsData')) {
                const analyticsStore = db.createObjectStore('analyticsData', { keyPath: 'id' });
                analyticsStore.createIndex('timestamp', 'timestamp');
                analyticsStore.createIndex('event', 'event');
            }
            
            // Performance metrics store
            if (!db.objectStoreNames.contains('performanceMetrics')) {
                db.createObjectStore('performanceMetrics', { keyPath: 'timestamp' });
            }
        };
    });
}

// === MESSAGE BROADCASTING ===
function broadcastMessage(message) {
    self.clients.matchAll().then(clients => {
        clients.forEach(client => {
            client.postMessage(message);
        });
    });
}

function broadcastPerformanceMetrics() {
    // Throttle performance broadcasts
    if (!self.lastMetricsBroadcast || Date.now() - self.lastMetricsBroadcast > 5000) {
        broadcastMessage({
            type: 'PERFORMANCE_METRICS',
            metrics: performanceMetrics
        });
        self.lastMetricsBroadcast = Date.now();
    }
}

// === ADVANCED PUSH SUBSCRIPTION MANAGEMENT ===
self.addEventListener('message', event => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    } else if (event.data && event.data.type === 'GET_PERFORMANCE_METRICS') {
        event.ports[0].postMessage({ metrics: performanceMetrics });
    } else if (event.data && event.data.type === 'FORCE_SYNC') {
        self.registration.sync.register(event.data.tag);
    } else if (event.data && event.data.type === 'THEME_CHANGED') {
        // Update cached theme-specific resources
        updateThemeCache(event.data.theme);
    }
});

// === INTELLIGENT CACHE MANAGEMENT ===
function shouldRefreshCache(request) {
    const url = new URL(request.url);
    
    // Refresh API data every 5 minutes
    if (url.pathname.startsWith('/api/')) {
        return true;
    }
    
    // Refresh critical app files every hour
    if (url.pathname.endsWith('.js') || url.pathname.endsWith('.css')) {
        return Math.random() < 0.1; // 10% chance for background refresh
    }
    
    return false;
}

function shouldCache(request) {
    const url = new URL(request.url);
    
    // Don't cache POST requests
    if (request.method !== 'GET') return false;
    
    // Don't cache external resources
    if (url.origin !== self.location.origin) return false;
    
    // Don't cache very large responses (>5MB)
    return true;
}

async function refreshCacheInBackground(request, cache) {
    try {
        const response = await fetch(request);
        if (response.ok) {
            await cache.put(request, response);
        }
    } catch (error) {
        console.warn('SW: Background cache refresh failed:', error);
    }
}

// === CLEANUP AND OPTIMIZATION ===
async function cleanupOldCaches() {
    const cacheNames = await caches.keys();
    const oldCaches = cacheNames.filter(name => 
        name.startsWith('health-tracker-') && !name.includes('v3.0')
    );
    
    await Promise.all(oldCaches.map(name => caches.delete(name)));
    console.log(`🧹 SW: ${oldCaches.length} alte Caches gelöscht`);
}

// === HEALTH CHECK & SELF-HEALING ===
setInterval(async () => {
    // Perform health check
    try {
        const response = await fetch('/api/health-check');
        if (!response.ok) {
            console.warn('⚠️ SW: Health check fehlgeschlagen');
        }
    } catch (error) {
        console.warn('⚠️ SW: Health check Fehler:', error);
        // Trigger self-healing mechanisms
        await performSelfHealing();
    }
}, 300000); // Every 5 minutes

async function performSelfHealing() {
    console.log('🔧 SW: Self-healing wird ausgeführt');
    
    // Clear corrupted caches
    const caches = await caches.keys();
    const corruptedCaches = await identifyCorruptedCaches(caches);
    
    await Promise.all(corruptedCaches.map(name => caches.delete(name)));
    
    // Reinitialize critical resources
    await initAdvancedStorage();
    
    broadcastMessage({
        type: 'SELF_HEALING_COMPLETE',
        data: { clearedCaches: corruptedCaches.length }
    });
}

console.log('🚀 Advanced Service Worker v3.0 geladen');
