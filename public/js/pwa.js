// Enhanced PWA Installation with Debug Support
let deferredPrompt = null;
let installButton = null;
let debugMode = true; // Für besseres Debugging

console.log('🚀 PWA Install Script wird geladen...');

// ==================================================================== 
// SOFORTIGE BUTTON ANZEIGE FÜR DEBUGGING
// ====================================================================
function initializeInstallButton() {
  console.log('🔧 Initialisiere Install Button...');
  
  installButton = document.getElementById('install-btn');
  const installStatus = document.getElementById('install-status');
  
  if (!installButton) {
    console.error('❌ Install Button Element nicht gefunden!');
    return;
  }

  // Debug-Info anzeigen
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
  const isInstalled = navigator.standalone || isStandalone;
  const supportsInstall = 'serviceWorker' in navigator && 'BeforeInstallPromptEvent' in window;
  
  console.log('📊 Install Status Check:', {
    isStandalone,
    isInstalled,
    supportsInstall,
    userAgent: navigator.userAgent,
    hasPrompt: !!deferredPrompt
  });

  if (installStatus) {
    installStatus.classList.remove('hidden');
    installStatus.textContent = isInstalled ? 'Bereits installiert' : 'Installierbar';
  }

  // Immer Button anzeigen falls nicht bereits installiert
  if (!isInstalled) {
    console.log('✅ Zeige Install Button (nicht installiert)');
    installButton.style.display = 'flex';
    installButton.classList.remove('hidden');
    
    // Fallback Click Handler für manuelle Installation
    installButton.addEventListener('click', handleInstallClick);
  } else {
    console.log('ℹ️ App bereits installiert - Button verstecken');
    installButton.style.display = 'none';
  }
}

// ==================================================================== 
// INSTALL CLICK HANDLER
// ====================================================================
async function handleInstallClick(event) {
  event.preventDefault();
  console.log('🎯 Install Button geklickt');
  
  if (deferredPrompt) {
    console.log('✅ Verwende beforeinstallprompt');
    try {
      installButton.style.display = 'none';
      await deferredPrompt.prompt();
      
      const { outcome } = await deferredPrompt.userChoice;
      console.log('📊 Install Outcome:', outcome);
      
      if (outcome === 'accepted') {
        showInstallSuccess();
      } else {
        installButton.style.display = 'flex'; // Button wieder anzeigen
        showToast('❌ Installation abgebrochen', 'warning');
      }
      
      deferredPrompt = null;
    } catch (error) {
      console.error('❌ Install prompt error:', error);
      showManualInstallInstructions();
    }
  } else {
    console.log('⚠️ Kein deferredPrompt - zeige manuelle Anweisungen');
    showManualInstallInstructions();
  }
}

// ==================================================================== 
// BEFORE INSTALL PROMPT EVENT
// ====================================================================
window.addEventListener('beforeinstallprompt', (e) => {
  console.log('🎯 beforeinstallprompt Event empfangen!');
  e.preventDefault();
  deferredPrompt = e;
  
  // Button sichtbar machen/lassen
  if (installButton) {
    installButton.style.display = 'flex';
    installButton.classList.remove('hidden');
    console.log('✅ Install Button aktiviert mit Prompt');
  }
  
  // Status Update
  const installStatus = document.getElementById('install-status');
  if (installStatus) {
    installStatus.textContent = 'Bereit zur Installation';
    installStatus.style.color = '#10b981'; // green
  }
});

// ==================================================================== 
// APP INSTALLED EVENT
// ====================================================================
window.addEventListener('appinstalled', (e) => {
  console.log('✅ PWA erfolgreich installiert!');
  showInstallSuccess();
  deferredPrompt = null;
  
  if (installButton) {
    installButton.style.display = 'none';
  }
  
  const installStatus = document.getElementById('install-status');
  if (installStatus) {
    installStatus.textContent = 'Installiert';
    installStatus.style.color = '#10b981';
  }
});

// ==================================================================== 
// MANUELLE INSTALL ANWEISUNGEN
// ====================================================================
function showManualInstallInstructions() {
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isAndroid = /Android/.test(navigator.userAgent);
  const isChrome = /Chrome/.test(navigator.userAgent);
  const isFirefox = /Firefox/.test(navigator.userAgent);
  const isEdge = /Edg/.test(navigator.userAgent);
  
  let instructions = '';
  
  if (isIOS) {
    instructions = `
      <div class="space-y-4">
        <h3 class="font-bold text-lg">📱 Installation auf iOS Safari:</h3>
        <ol class="list-decimal list-inside space-y-2 text-sm">
          <li>Tippe auf das <strong>Teilen-Symbol</strong> (Quadrat mit Pfeil) unten in Safari</li>
          <li>Scrolle nach unten und wähle <strong>"Zum Home-Bildschirm"</strong></li>
          <li>Tippe auf <strong>"Hinzufügen"</strong></li>
        </ol>
      </div>
    `;
  } else if (isAndroid && isChrome) {
    instructions = `
      <div class="space-y-4">
        <h3 class="font-bold text-lg">📱 Installation auf Android Chrome:</h3>
        <ol class="list-decimal list-inside space-y-2 text-sm">
          <li>Öffne das <strong>Drei-Punkte-Menü</strong> (⋮) oben rechts</li>
          <li>Wähle <strong>"App installieren"</strong> oder <strong>"Zur Startseite hinzufügen"</strong></li>
          <li>Bestätige mit <strong>"Installieren"</strong></li>
        </ol>
      </div>
    `;
  } else if (isChrome) {
    instructions = `
      <div class="space-y-4">
        <h3 class="font-bold text-lg">💻 Installation auf Desktop Chrome:</h3>
        <ol class="list-decimal list-inside space-y-2 text-sm">
          <li>Klicke auf das <strong>Install-Symbol</strong> (⬇️) in der Adressleiste</li>
          <li>Oder: Drei-Punkte-Menü → <strong>"App installieren"</strong></li>
          <li>Bestätige mit <strong>"Installieren"</strong></li>
        </ol>
      </div>
    `;
  } else if (isEdge) {
    instructions = `
      <div class="space-y-4">
        <h3 class="font-bold text-lg">💻 Installation auf Microsoft Edge:</h3>
        <ol class="list-decimal list-inside space-y-2 text-sm">
          <li>Klicke auf das <strong>Drei-Punkte-Menü</strong> (⋯) oben rechts</li>
          <li>Wähle <strong>"Apps" → "Diese Website als App installieren"</strong></li>
          <li>Bestätige mit <strong>"Installieren"</strong></li>
        </ol>
      </div>
    `;
  } else {
    instructions = `
      <div class="space-y-4">
        <h3 class="font-bold text-lg">🌐 Manuelle Installation:</h3>
        <p class="text-sm">Diese App kann als PWA installiert werden. Prüfe in deinem Browser-Menü nach Optionen wie:</p>
        <ul class="list-disc list-inside space-y-1 text-sm">
          <li>"App installieren"</li>
          <li>"Zur Startseite hinzufügen"</li>
          <li>"Als App installieren"</li>
        </ul>
      </div>
    `;
  }

  const modal = document.createElement('div');
  modal.className = 'modal modal-open';
  modal.innerHTML = `
    <div class="modal-box">
      <h3 class="font-bold text-lg mb-4">📲 Health Tracker Pro installieren</h3>
      ${instructions}
      <div class="modal-action">
        <button class="btn btn-primary" onclick="this.closest('.modal').remove()">
          Verstanden
        </button>
      </div>
    </div>
    <div class="modal-backdrop" onclick="this.closest('.modal').remove()"></div>
  `;
  document.body.appendChild(modal);
}

// ==================================================================== 
// SUCCESS FUNCTIONS
// ====================================================================
function showInstallSuccess() {
  showToast('✅ Health Tracker Pro erfolgreich installiert!', 'success', 6000);
  
  // Konfetti-Effekt (optional)
  if (typeof confetti !== 'undefined') {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });
  }
}

function showToast(message, type = 'info', duration = 4000) {
  const toast = document.createElement('div');
  const bgClass = {
    success: 'bg-green-500',
    error: 'bg-red-500', 
    warning: 'bg-yellow-500',
    info: 'bg-blue-500'
  }[type] || 'bg-gray-500';
  
  toast.className = `fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg text-white transition-all duration-300 transform ${bgClass}`;
  toast.textContent = message;
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.style.transform = 'translateY(-100%)';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

// ==================================================================== 
// DOM READY INITIALIZATION
// ====================================================================
document.addEventListener('DOMContentLoaded', () => {
  console.log('📄 DOM Ready - Initialisiere Install Button');
  initializeInstallButton();
  
  // Debugging Info nach 3 Sekunden
  setTimeout(() => {
    console.log('🔍 Install Debug nach 3 Sekunden:', {
      buttonVisible: installButton?.style.display !== 'none',
      buttonExists: !!installButton,
      hasPrompt: !!deferredPrompt,
      isStandalone: window.matchMedia('(display-mode: standalone)').matches
    });
  }, 3000);
});

// Fallback für sehr langsame Seiten
window.addEventListener('load', () => {
  if (!installButton) {
    console.log('🔄 Window Load Fallback - versuche erneut');
    setTimeout(initializeInstallButton, 1000);
  }
});
