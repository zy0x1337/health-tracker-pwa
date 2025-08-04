// public/js/pwa.js - Enhanced PWA Features
let deferredPrompt;

// PWA Installation
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    
    const installBtn = document.getElementById('install-btn');
    installBtn.classList.remove('hidden');
    
    installBtn.addEventListener('click', async () => {
        installBtn.classList.add('hidden');
        deferredPrompt.prompt();
        
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
            console.log('PWA Installation akzeptiert');
            showInstallSuccess();
        }
        deferredPrompt = null;
    });
});

// Service Worker Registration
if ('serviceWorker' in navigator) {
    window.addEventListener('load', async () => {
        try {
            const registration = await navigator.serviceWorker.register('/sw.js');
            console.log('SW registriert:', registration);
            
            // Update available
            registration.addEventListener('updatefound', () => {
                const newWorker = registration.installing;
                newWorker.addEventListener('statechange', () => {
                    if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                        showUpdateAvailable();
                    }
                });
            });
            
        } catch (error) {
            console.log('SW Registrierung fehlgeschlagen:', error);
        }
    });
}

// Online/Offline Status
window.addEventListener('online', () => {
    console.log('🌐 Online');
    showConnectivityStatus('online');
    syncOfflineData();
});

window.addEventListener('offline', () => {
    console.log('📵 Offline');
    showConnectivityStatus('offline');
});

// Sync offline data when back online
async function syncOfflineData() {
    const localData = JSON.parse(localStorage.getItem('healthData') || '[]');
    
    for (const data of localData) {
        if (data._id && data._id.startsWith('local_')) {
            try {
                await fetch('/.netlify/functions/api/health-data', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        ...data,
                        _id: undefined // Remove local ID
                    })
                });
            } catch (error) {
                console.error('Sync error:', error);
            }
        }
    }
    
    // Clear synced data
    localStorage.removeItem('healthData');
    console.log('📤 Offline Daten synchronisiert');
}

// UI Notifications
function showInstallSuccess() {
    const toast = createToast('✅ App erfolgreich installiert!', 'success');
    document.body.appendChild(toast);
}

function showUpdateAvailable() {
    const toast = createToast('🔄 Update verfügbar - Seite neu laden?', 'info', true);
    document.body.appendChild(toast);
}

function showConnectivityStatus(status) {
    const message = status === 'online' 
        ? '🌐 Verbindung wiederhergestellt' 
        : '📵 Offline-Modus aktiv';
    
    const toast = createToast(message, status === 'online' ? 'success' : 'warning');
    document.body.appendChild(toast);
}

function createToast(message, type, hasAction = false) {
    const toast = document.createElement('div');
    toast.className = `fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg text-white transition-all duration-300 transform translate-y-0`;
    
    const bgColor = {
        'success': 'bg-green-500',
        'warning': 'bg-yellow-500', 
        'info': 'bg-blue-500',
        'error': 'bg-red-500'
    }[type] || 'bg-gray-500';
    
    toast.className += ` ${bgColor}`;
    
    let content = `<span>${message}</span>`;
    
    if (hasAction) {
        content += `
            <button onclick="window.location.reload()" 
                    class="ml-4 bg-white bg-opacity-20 px-3 py-1 rounded text-sm hover:bg-opacity-30">
                Neu laden
            </button>
        `;
    }
    
    toast.innerHTML = content;
    
    // Auto remove after 4 seconds
    setTimeout(() => {
        toast.style.transform = 'translateY(-100%)';
        setTimeout(() => toast.remove(), 300);
    }, 4000);
    
    return toast;
}

// Background Sync for offline capabilities
if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
    navigator.serviceWorker.ready.then(registration => {
        document.addEventListener('health-data-saved-offline', () => {
            registration.sync.register('background-sync');
        });
    });
}
