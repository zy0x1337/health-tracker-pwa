// Enhanced PWA Features with Improved Install Button Support
let deferredPrompt = null;
let installButton = null;
let installDebugMode = true; // Für Debugging aktivieren

// ==================================================================== 
// KRITISCHER FIX: Event Listener SOFORT registrieren
// ====================================================================

console.log('📱 PWA.js wird geladen...');

// WICHTIG: Event Listener SOFORT (nicht auf window load warten)
if ('BeforeInstallPromptEvent' in window || 'onbeforeinstallprompt' in window) {
    console.log('✅ beforeinstallprompt wird unterstützt');
    
    window.addEventListener('beforeinstallprompt', (e) => {
        console.log('🎯 beforeinstallprompt Event gefeuert!', e);
        
        // Verhindere Standard-Browser-Prompt
        e.preventDefault();
        
        // Event für später speichern
        deferredPrompt = e;
        
        // Install Button sichtbar machen
        showInstallButton();
        
        if (installDebugMode) {
            console.log('✅ Install Button sollte jetzt sichtbar sein');
            console.log('📊 Event Details:', {
                platforms: e.platforms,
                userChoice: e.userChoice
            });
        }
    });
} else {
    console.log('❌ beforeinstallprompt wird NICHT unterstützt');
    // Fallback für Browser ohne Support
    setTimeout(() => {
        showManualInstallInstructions();
    }, 3000);
}

// Install Button anzeigen
function showInstallButton() {
    installButton = document.getElementById('install-btn');
    
    if (installButton) {
        installButton.classList.remove('hidden');
        installButton.style.display = 'block';
        console.log('✅ Install Button sichtbar gemacht');
        
        // Click Event Listener hinzufügen
        installButton.removeEventListener('click', handleInstallClick); // Duplicate vermeiden
        installButton.addEventListener('click', handleInstallClick);
    } else {
        console.error('❌ Install Button Element #install-btn nicht gefunden!');
        
        // FALLBACK: Button erstellen falls nicht vorhanden
        createFallbackInstallButton();
    }
}

// Install Click Handler
async function handleInstallClick(event) {
    event.preventDefault();
    console.log('🎯 Install Button geklickt');
    
    if (!deferredPrompt) {
        console.log('❌ Kein deferredPrompt verfügbar');
        showManualInstallInstructions();
        return;
    }
    
    try {
        // Button temporär verstecken
        installButton.classList.add('hidden');
        
        // Install Prompt anzeigen
        console.log('📱 Zeige Install Prompt...');
        deferredPrompt.prompt();
        
        // Warte auf User Entscheidung
        const { outcome } = await deferredPrompt.userChoice;
        console.log('👤 User Entscheidung:', outcome);
        
        if (outcome === 'accepted') {
            console.log('✅ PWA Installation akzeptiert');
            showInstallSuccess();
        } else {
            console.log('❌ PWA Installation abgelehnt');
            // Button wieder anzeigen
            installButton.classList.remove('hidden');
        }
        
        // Prompt zurücksetzen
        deferredPrompt = null;
        
    } catch (error) {
        console.error('❌ Install Error:', error);
        installButton.classList.remove('hidden');
    }
}

// FALLBACK: Install Button erstellen
function createFallbackInstallButton() {
    console.log('🔧 Erstelle Fallback Install Button');
    
    const button = document.createElement('button');
    button.id = 'install-btn';
    button.className = 'btn btn-primary btn-sm fixed top-4 right-4 z-50';
    button.innerHTML = '📱 App installieren';
    button.addEventListener('click', handleInstallClick);
    
    document.body.appendChild(button);
    installButton = button;
    
    console.log('✅ Fallback Install Button erstellt');
}
