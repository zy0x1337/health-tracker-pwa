// Enhanced PWA Features with Install Button Support

let deferredPrompt = null;
let installButton = null;

// ==================================================================== 
// PWA INSTALLATION HANDLING
// ====================================================================

// KRITISCH: Event Listener SOFORT registrieren (nicht auf window load warten)
window.addEventListener('beforeinstallprompt', (e) => {
    console.log('🎯 beforeinstallprompt Event gefeuert');
    e.preventDefault();
    deferredPrompt = e;
    
    // Install Button sichtbar machen
    installButton = document.getElementById('install-btn');
    if (installButton) {
        installButton.classList.remove('hidden');
        console.log('✅ Install Button sichtbar gemacht');
        
        // Install Event Listener
        installButton.addEventListener('click', async (event) => {
            event.preventDefault();
            
            if (!deferredPrompt) {
                console.log('❌ Kein deferredPrompt verfügbar');
                showManualInstallInstructions();
                return;
            }
            
            installButton.classList.add('hidden');
            deferredPrompt.prompt();
            
            const { outcome } = await deferredPrompt.userChoice;
            
            if (outcome === 'accepted') {
                console.log('✅ PWA Installation akzeptiert');
                showInstallSuccess();
            } else {
                console.log('❌ PWA Installation abgelehnt');
                installButton.classList.remove('hidden');
            }
            
            deferredPrompt = null;
        });
    } else {
        console.log('❌ Install Button Element nicht gefunden');
    }
});

// App installed Event
window.addEventListener('appinstalled', (e) => {
    console.log('✅ PWA erfolgreich installiert');
    showInstallSuccess();
    deferredPrompt = null;
    
    if (installButton) {
        installButton.classList.add('hidden');
    }
});

// Backup: Manual Install Instructions falls Event nicht feuert
window.addEventListener('load', () => {
    setTimeout(() => {
        if (!deferredPrompt) {
            console.log('⚠️ beforeinstallprompt nicht gefeuert - prüfe Browser-Support');
            checkInstallSupport();
        }
    }, 2000);
});

// ==================================================================== 
// SERVICE WORKER REGISTRATION
// ====================================================================

if ('serviceWorker' in navigator) {
    window.addEventListener('load', async () => {
        try {
            const registration = await navigator.serviceWorker.register('/sw.js');
            console.log('✅ Service Worker registriert:', registration.scope);
            
            // Update available notification
            registration.addEventListener('updatefound', () => {
                const newWorker = registration.installing;
                newWorker.addEventListener('statechange', () => {
                    if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                        showUpdateAvailable();
                    }
                });
            });
            
            // Check for existing update
            if (registration.waiting) {
                showUpdateAvailable();
            }
            
        } catch (error) {
            console.error('❌ Service Worker Registrierung fehlgeschlagen:', error);
        }
    });
}

// ==================================================================== 
// NETWORK STATUS HANDLING
// ====================================================================

window.addEventListener('online', () => {
    console.log('🌐 Verbindung wiederhergestellt');
    showConnectivityStatus('online');
    syncOfflineData();
});

window.addEventListener('offline', () => {
    console.log('📵 Offline-Modus aktiviert');
    showConnectivityStatus('offline');
});

// ==================================================================== 
// OFFLINE DATA SYNC
// ====================================================================

async function syncOfflineData() {
    try {
        const localData = JSON.parse(localStorage.getItem('healthData') || '[]');
        const unsyncedData = localData.filter(data => !data._synced);
        
        if (unsyncedData.length === 0) {
            console.log('📤 Keine Daten zum Synchronisieren');
            return;
        }
        
        console.log(`📤 Synchronisiere ${unsyncedData.length} offline Einträge...`);
        let successCount = 0;
        
        for (const data of unsyncedData) {
            try {
                const response = await fetch('/api/health-data', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        ...data,
                        _localId: undefined // Remove local ID for server
                    })
                });
                
                if (response.ok) {
                    // Mark as synced in localStorage
                    const allData = JSON.parse(localStorage.getItem('healthData') || '[]');
                    const updatedData = allData.map(item => 
                        item._localId === data._localId ? { ...item, _synced: true } : item
                    );
                    localStorage.setItem('healthData', JSON.stringify(updatedData));
                    successCount++;
                }
            } catch (error) {
                console.error('❌ Sync error für Eintrag:', error);
            }
        }
        
        if (successCount > 0) {
            showToast(`📤 ${successCount} Einträge synchronisiert`, 'success');
            // Trigger refresh event
            document.dispatchEvent(new CustomEvent('data-synced', { 
                detail: { count: successCount } 
            }));
        }
        
    } catch (error) {
        console.error('❌ Sync process error:', error);
    }
}

// ==================================================================== 
// INSTALL SUPPORT DETECTION
// ====================================================================

function checkInstallSupport() {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isAndroid = /Android/.test(navigator.userAgent);
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    
    console.log('📱 Device detection:', { isIOS, isAndroid, isStandalone });
    
    if (isStandalone) {
        console.log('✅ App bereits installiert (Standalone-Modus)');
        return;
    }
    
    // Show manual install instructions for iOS
    if (isIOS) {
        setTimeout(() => {
            showManualInstallInstructions('ios');
        }, 3000);
    }
    // Show manual instructions for other browsers
    else if (!deferredPrompt) {
        setTimeout(() => {
            showManualInstallInstructions('other');
        }, 5000);
    }
}

// ==================================================================== 
// UI NOTIFICATION FUNCTIONS
// ====================================================================

function showInstallSuccess() {
    showToast('✅ Health Tracker Pro erfolgreich installiert!', 'success', 6000);
    
    // Hide install button permanently
    const installBtn = document.getElementById('install-btn');
    if (installBtn) {
        installBtn.style.display = 'none';
    }
}

function showUpdateAvailable() {
    const toast = createAdvancedToast(
        '🔄 App-Update verfügbar', 
        'Eine neue Version ist verfügbar. Jetzt aktualisieren?',
        'info', 
        [
            {
                text: 'Aktualisieren',
                action: () => {
                    window.location.reload();
                }
            },
            {
                text: 'Später',
                action: null
            }
        ]
    );
    document.body.appendChild(toast);
}

function showConnectivityStatus(status) {
    const message = status === 'online'
        ? '🌐 Verbindung wiederhergestellt - Daten werden synchronisiert'
        : '📵 Offline-Modus aktiv - Daten werden lokal gespeichert';
    
    showToast(message, status === 'online' ? 'success' : 'warning', 4000);
}

function showManualInstallInstructions(platform = 'other') {
    let instructions = '';
    
    if (platform === 'ios') {
        instructions = `
            <div class="text-sm">
                <p class="font-semibold mb-2">📱 Installation auf iOS:</p>
                <ol class="list-decimal list-inside space-y-1">
                    <li>Tippe auf das Teilen-Symbol <span class="font-mono">⬆️</span></li>
                    <li>Wähle "Zum Home-Bildschirm"</li>
                    <li>Tippe "Hinzufügen"</li>
                </ol>
            </div>
        `;
    } else {
        instructions = `
            <div class="text-sm">
                <p class="font-semibold mb-2">📱 Installation:</p>
                <p>Öffne das Browser-Menü <span class="font-mono">⋮</span> und wähle "App installieren" oder "Zur Startseite hinzufügen"</p>
            </div>
        `;
    }
    
    const toast = createAdvancedToast(
        '📲 App installieren',
        instructions,
        'info',
        [
            {
                text: 'Verstanden',
                action: null
            }
        ],
        8000
    );
    
    document.body.appendChild(toast);
}

// ==================================================================== 
// TOAST NOTIFICATION SYSTEM
// ====================================================================

function showToast(message, type = 'info', duration = 4000) {
    const toast = createToast(message, type);
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.transform = 'translateY(-100%)';
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

function createToast(message, type) {
    const toast = document.createElement('div');
    toast.className = `fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg text-white transition-all duration-300 transform translate-y-0 max-w-sm`;
    
    const bgColor = {
        'success': 'bg-green-500',
        'warning': 'bg-yellow-500',
        'info': 'bg-blue-500',
        'error': 'bg-red-500'
    }[type] || 'bg-gray-500';
    
    toast.className += ` ${bgColor}`;
    toast.innerHTML = `
        <div class="flex items-center">
            <span class="flex-1">${message}</span>
            <button onclick="this.parentElement.parentElement.remove()" class="ml-2 text-white/80 hover:text-white">✕</button>
        </div>
    `;
    
    return toast;
}

function createAdvancedToast(title, content, type, buttons = [], duration = 6000) {
    const toast = document.createElement('div');
    toast.className = `fixed top-4 right-4 z-50 bg-white dark:bg-gray-800 rounded-lg shadow-xl border max-w-sm transition-all duration-300 transform translate-y-0`;
    
    const borderColor = {
        'success': 'border-green-500',
        'warning': 'border-yellow-500',
        'info': 'border-blue-500',
        'error': 'border-red-500'
    }[type] || 'border-gray-300';
    
    toast.className += ` ${borderColor}`;
    
    const buttonsHtml = buttons.map(btn => 
        `<button class="btn btn-sm ${btn.action ? 'btn-primary' : 'btn-ghost'}" 
                onclick="${btn.action ? 'this.clickAction()' : 'this.parentElement.parentElement.parentElement.remove()'}">${btn.text}</button>`
    ).join('');
    
    toast.innerHTML = `
        <div class="p-4">
            <div class="flex items-start justify-between mb-2">
                <h4 class="font-semibold text-gray-900 dark:text-white">${title}</h4>
                <button onclick="this.parentElement.parentElement.parentElement.remove()" 
                        class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">✕</button>
            </div>
            <div class="text-gray-600 dark:text-gray-300 mb-3">${content}</div>
            <div class="flex gap-2 justify-end">
                ${buttonsHtml}
            </div>
        </div>
    `;
    
    // Add click actions to buttons
    buttons.forEach((btn, index) => {
        if (btn.action) {
            const button = toast.querySelectorAll('button')[index + 1]; // +1 for close button
            if (button) {
                button.clickAction = () => {
                    btn.action();
                    toast.remove();
                };
            }
        }
    });
    
    // Auto remove
    if (duration > 0) {
        setTimeout(() => {
            if (toast.parentElement) {
                toast.style.transform = 'translateY(-100%)';
                setTimeout(() => toast.remove(), 300);
            }
        }, duration);
    }
    
    return toast;
}

// ==================================================================== 
// PWA FEATURES DETECTION
// ====================================================================

// Display mode detection
if (window.matchMedia('(display-mode: standalone)').matches) {
    console.log('✅ App läuft im Standalone-Modus');
    document.body.classList.add('pwa-standalone');
}

// Background sync support
if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
    navigator.serviceWorker.ready.then(registration => {
        console.log('✅ Background Sync unterstützt');
        
        // Register sync event when data is saved offline
        document.addEventListener('health-data-saved-offline', () => {
            registration.sync.register('background-sync');
        });
    });
}

// Push notifications support check
if ('Notification' in window && 'serviceWorker' in navigator) {
    console.log('✅ Push Notifications unterstützt');
}

console.log('🚀 PWA Features initialisiert');
