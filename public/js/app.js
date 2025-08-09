/**
 * Health Tracker Pro - Advanced Progressive Web Application
 * Vollständige app.js Implementation mit Offline-First Architecture
 * @author Health Tracker Team
 * @version 2.0.0
 */

// ====================================================================
// CORE HEALTH TRACKER CLASS - Zentrale Anwendungssteuerung
// ====================================================================

class HealthTracker {
    constructor() {
        // Core Properties
        this.userId = this.generateUserId();
        this.isOnline = navigator.onLine;
        this.isLoading = false;
        this.syncInProgress = false;
        
        // Component Instances
        this.notificationManager = null;
        this.progressHub = null;
        this.activityFeed = null;
        this.analyticsEngine = null;
        
        // Goals with defaults
        this.goals = {
            stepsGoal: 10000,
            waterGoal: 2.0,
            sleepGoal: 8,
            weightGoal: null
        };
        
        // Performance optimization
        this.debounceTimers = new Map();
        this.cache = new Map();
        
        // Initialize application
        this.initialize();
    }
    
    /**
     * Initialize all components and event listeners
     */
    async initialize() {
    try {
        console.log('🚀 Health Tracker Pro wird initialisiert...');
        
        // Load user goals first
        await this.loadUserGoals();
        
        // Initialize components in dependency order
        this.initializeComponents();
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Initialize form defaults
        this.initializeFormDefaults();
        
        // Initial data load
        await this.loadInitialData();
        
        // Setup periodic sync
        this.setupPeriodicSync();

        // Einstellungen beim App-Start initialisieren
        this.initializeSettings();

        // Automatische Datenbereinigung starten
        this.implementDataRetention();

        // Initialize Analytics Dashboard after components are ready
        setTimeout(() => {
            this.initializeAnalyticsEventListeners();
        }, 200);
        
        console.log('✅ Health Tracker Pro erfolgreich initialisiert');
        this.showToast('🎯 Health Tracker Pro bereit!', 'success');
        
    } catch (error) {
        console.error('❌ Initialisierungsfehler:', error);
        this.showToast('⚠️ Initialisierung fehlgeschlagen - Offline-Modus aktiv', 'warning');
    }
}

/** * Navbar-spezifische Funktionen */

/**
 * Quick Add Modal
 */
showQuickAddModal() {
    const modal = document.createElement('div');
    modal.className = 'modal modal-open quick-add-modal';
    modal.innerHTML = `
        <div class="modal-box max-w-md">
            <h3 class="font-bold text-lg mb-4 flex items-center gap-2">
                <i data-lucide="plus-circle" class="w-5 h-5 text-primary"></i>
                Schnell hinzufügen
            </h3>
            
            <!-- Quick Add Grid -->
            <div class="grid grid-cols-2 gap-3 mb-4">
                <!-- Steps Quick Add -->
                <button class="btn btn-outline gap-2 h-20 flex-col hover:btn-primary transition-all duration-200" 
                        onclick="healthTracker?.showQuickStepsInput?.(); this.closest('.modal').remove();">
                    <i data-lucide="footprints" class="w-6 h-6 text-primary"></i>
                    <span class="text-sm font-medium">Schritte</span>
                    <span class="text-xs opacity-70">Tagesziel: ${this.goals.stepsGoal || 10000}</span>
                </button>
                
                <!-- Water Quick Add -->
                <button class="btn btn-outline gap-2 h-20 flex-col hover:btn-info transition-all duration-200" 
                        onclick="healthTracker?.showQuickWaterInput?.(); this.closest('.modal').remove();">
                    <i data-lucide="droplets" class="w-6 h-6 text-info"></i>
                    <span class="text-sm font-medium">Wasser</span>
                    <span class="text-xs opacity-70">Ziel: ${this.goals.waterGoal || 2.0}L</span>
                </button>
                
                <!-- Weight Quick Add -->
                <button class="btn btn-outline gap-2 h-20 flex-col hover:btn-secondary transition-all duration-200" 
                        onclick="healthTracker?.showQuickWeightInput?.(); this.closest('.modal').remove();">
                    <i data-lucide="scale" class="w-6 h-6 text-secondary"></i>
                    <span class="text-sm font-medium">Gewicht</span>
                    <span class="text-xs opacity-70">Aktuelle Eingabe</span>
                </button>
                
                <!-- Sleep Quick Add -->
                <button class="btn btn-outline gap-2 h-20 flex-col hover:btn-accent transition-all duration-200" 
                        onclick="healthTracker?.showQuickSleepInput?.(); this.closest('.modal').remove();">
                    <i data-lucide="moon" class="w-6 h-6 text-accent"></i>
                    <span class="text-sm font-medium">Schlaf</span>
                    <span class="text-xs opacity-70">Ziel: ${this.goals.sleepGoal || 8}h</span>
                </button>
                
                <!-- Mood Quick Add -->
                <button class="btn btn-outline gap-2 h-20 flex-col hover:btn-warning transition-all duration-200" 
                        onclick="healthTracker?.showQuickMoodInput?.(); this.closest('.modal').remove();">
                    <i data-lucide="smile" class="w-6 h-6 text-warning"></i>
                    <span class="text-sm font-medium">Stimmung</span>
                    <span class="text-xs opacity-70">Wie fühlst du dich?</span>
                </button>
                
                <!-- Notes Quick Add -->
                <button class="btn btn-outline gap-2 h-20 flex-col hover:btn-success transition-all duration-200" 
                        onclick="healthTracker?.showQuickNotesInput?.(); this.closest('.modal').remove();">
                    <i data-lucide="edit-3" class="w-6 h-6 text-success"></i>
                    <span class="text-sm font-medium">Notiz</span>
                    <span class="text-xs opacity-70">Schnelle Eingabe</span>
                </button>
            </div>
            
            <!-- Alternative: Vollständiges Formular -->
            <div class="divider text-xs">oder</div>
            <button class="btn btn-primary w-full gap-2" 
                    onclick="healthTracker?.scrollToHealthForm?.(); this.closest('.modal').remove();">
                <i data-lucide="clipboard-list" class="w-4 h-4"></i>
                Vollständiges Formular öffnen
            </button>
            
            <div class="modal-action mt-4">
                <button class="btn btn-ghost" onclick="this.closest('.modal').remove()">
                    Schließen
                </button>
            </div>
        </div>
        <div class="modal-backdrop" onclick="this.closest('.modal').remove()"></div>
    `;
    
    document.body.appendChild(modal);
    
    // Icons initialisieren
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
    
    // Haptic Feedback
    if (navigator.vibrate && localStorage.getItem('hapticFeedback') === 'true') {
        navigator.vibrate(10);
    }
}

/**
 * Quick Steps Input Modal
 */
showQuickStepsInput() {
    const modal = document.createElement('div');
    modal.className = 'modal modal-open';
    modal.innerHTML = `
        <div class="modal-box max-w-sm">
            <h3 class="font-bold text-lg mb-4 flex items-center gap-2">
                <i data-lucide="footprints" class="w-5 h-5 text-primary"></i>
                Schritte hinzufügen
            </h3>
            
            <div class="form-control">
                <label class="label">
                    <span class="label-text">Anzahl Schritte</span>
                    <span class="label-text-alt">Ziel: ${this.goals.stepsGoal || 10000}</span>
                </label>
                <input type="number" id="quick-steps" class="input input-bordered input-primary" 
                       placeholder="z.B. 5000" min="0" max="100000" step="100" autofocus>
                <div class="label">
                    <span class="label-text-alt text-info">Tipp: Bereits vorhandene Schritte werden addiert</span>
                </div>
            </div>
            
            <!-- Quick Presets -->
            <div class="flex flex-wrap gap-2 mt-3">
                <button class="btn btn-xs btn-outline" onclick="document.getElementById('quick-steps').value = 1000">1.000</button>
                <button class="btn btn-xs btn-outline" onclick="document.getElementById('quick-steps').value = 2500">2.500</button>
                <button class="btn btn-xs btn-outline" onclick="document.getElementById('quick-steps').value = 5000">5.000</button>
                <button class="btn btn-xs btn-outline" onclick="document.getElementById('quick-steps').value = 10000">10.000</button>
            </div>
            
            <div class="modal-action">
                <button class="btn btn-ghost" onclick="this.closest('.modal').remove()">Abbrechen</button>
                <button class="btn btn-primary" onclick="healthTracker?.saveQuickData?.('steps', document.getElementById('quick-steps').value); this.closest('.modal').remove();">
                    <i data-lucide="plus" class="w-4 h-4"></i>
                    Hinzufügen
                </button>
            </div>
        </div>
        <div class="modal-backdrop" onclick="this.closest('.modal').remove()"></div>
    `;
    
    document.body.appendChild(modal);
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

/**
 * Quick Water Input Modal
 */
showQuickWaterInput() {
    const modal = document.createElement('div');
    modal.className = 'modal modal-open';
    modal.innerHTML = `
        <div class="modal-box max-w-sm">
            <h3 class="font-bold text-lg mb-4 flex items-center gap-2">
                <i data-lucide="droplets" class="w-5 h-5 text-info"></i>
                Wasser hinzufügen
            </h3>
            
            <div class="form-control">
                <label class="label">
                    <span class="label-text">Wassermenge in Litern</span>
                    <span class="label-text-alt">Ziel: ${this.goals.waterGoal || 2.0}L</span>
                </label>
                <input type="number" id="quick-water" class="input input-bordered input-info" 
                       placeholder="z.B. 0.3" min="0" max="5" step="0.1" autofocus>
                <div class="label">
                    <span class="label-text-alt text-info">Wird zur heutigen Gesamtmenge addiert</span>
                </div>
            </div>
            
            <!-- Quick Presets -->
            <div class="flex flex-wrap gap-2 mt-3">
                <button class="btn btn-xs btn-outline" onclick="document.getElementById('quick-water').value = 0.2">Glas (0.2L)</button>
                <button class="btn btn-xs btn-outline" onclick="document.getElementById('quick-water').value = 0.33">Flasche (0.33L)</button>
                <button class="btn btn-xs btn-outline" onclick="document.getElementById('quick-water').value = 0.5">Groß (0.5L)</button>
                <button class="btn btn-xs btn-outline" onclick="document.getElementById('quick-water').value = 1.0">Liter (1.0L)</button>
            </div>
            
            <div class="modal-action">
                <button class="btn btn-ghost" onclick="this.closest('.modal').remove()">Abbrechen</button>
                <button class="btn btn-info" onclick="healthTracker?.saveQuickData?.('water', document.getElementById('quick-water').value); this.closest('.modal').remove();">
                    <i data-lucide="plus" class="w-4 h-4"></i>
                    Hinzufügen
                </button>
            </div>
        </div>
        <div class="modal-backdrop" onclick="this.closest('.modal').remove()"></div>
    `;
    
    document.body.appendChild(modal);
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

/**
 * Quick Weight Input Modal
 */
showQuickWeightInput() {
    const modal = document.createElement('div');
    modal.className = 'modal modal-open';
    modal.innerHTML = `
        <div class="modal-box max-w-sm">
            <h3 class="font-bold text-lg mb-4 flex items-center gap-2">
                <i data-lucide="scale" class="w-5 h-5 text-secondary"></i>
                Gewicht eingeben
            </h3>
            
            <div class="form-control">
                <label class="label">
                    <span class="label-text">Gewicht in kg</span>
                    <span class="label-text-alt">${this.goals.weightGoal ? `Ziel: ${this.goals.weightGoal}kg` : 'Aktuelles Gewicht'}</span>
                </label>
                <input type="number" id="quick-weight" class="input input-bordered input-secondary" 
                       placeholder="z.B. 70.5" min="30" max="300" step="0.1" autofocus>
                <div class="label">
                    <span class="label-text-alt text-info">Überschreibt das heutige Gewicht</span>
                </div>
            </div>
            
            <div class="modal-action">
                <button class="btn btn-ghost" onclick="this.closest('.modal').remove()">Abbrechen</button>
                <button class="btn btn-secondary" onclick="healthTracker?.saveQuickData?.('weight', document.getElementById('quick-weight').value); this.closest('.modal').remove();">
                    <i data-lucide="save" class="w-4 h-4"></i>
                    Speichern
                </button>
            </div>
        </div>
        <div class="modal-backdrop" onclick="this.closest('.modal').remove()"></div>
    `;
    
    document.body.appendChild(modal);
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

/**
 * Quick Sleep Input Modal
 */
showQuickSleepInput() {
    const modal = document.createElement('div');
    modal.className = 'modal modal-open';
    modal.innerHTML = `
        <div class="modal-box max-w-sm">
            <h3 class="font-bold text-lg mb-4 flex items-center gap-2">
                <i data-lucide="moon" class="w-5 h-5 text-accent"></i>
                Schlafzeit hinzufügen
            </h3>
            
            <div class="form-control">
                <label class="label">
                    <span class="label-text">Schlafstunden</span>
                    <span class="label-text-alt">Ziel: ${this.goals.sleepGoal || 8}h</span>
                </label>
                <input type="number" id="quick-sleep" class="input input-bordered input-accent" 
                       placeholder="z.B. 7.5" min="0" max="24" step="0.5" autofocus>
                <div class="label">
                    <span class="label-text-alt text-info">Wird zur heutigen Schlafzeit addiert</span>
                </div>
            </div>
            
            <!-- Quick Presets -->
            <div class="flex flex-wrap gap-2 mt-3">
                <button class="btn btn-xs btn-outline" onclick="document.getElementById('quick-sleep').value = 0.5">Powernap</button>
                <button class="btn btn-xs btn-outline" onclick="document.getElementById('quick-sleep').value = 1.5">Kurz (1.5h)</button>
                <button class="btn btn-xs btn-outline" onclick="document.getElementById('quick-sleep').value = 8">Vollschlaf (8h)</button>
                <button class="btn btn-xs btn-outline" onclick="document.getElementById('quick-sleep').value = 9">Lang (9h)</button>
            </div>
            
            <div class="modal-action">
                <button class="btn btn-ghost" onclick="this.closest('.modal').remove()">Abbrechen</button>
                <button class="btn btn-accent" onclick="healthTracker?.saveQuickData?.('sleep', document.getElementById('quick-sleep').value); this.closest('.modal').remove();">
                    <i data-lucide="plus" class="w-4 h-4"></i>
                    Hinzufügen
                </button>
            </div>
        </div>
        <div class="modal-backdrop" onclick="this.closest('.modal').remove()"></div>
    `;
    
    document.body.appendChild(modal);
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

/**
 * Quick Mood Input Modal
 */
showQuickMoodInput() {
    const moodOptions = [
        { value: 'excellent', label: 'Ausgezeichnet', emoji: '😄', color: 'btn-success' },
        { value: 'good', label: 'Gut', emoji: '😊', color: 'btn-info' },
        { value: 'neutral', label: 'Neutral', emoji: '😐', color: 'btn-warning' },
        { value: 'bad', label: 'Schlecht', emoji: '😔', color: 'btn-error' },
        { value: 'terrible', label: 'Furchtbar', emoji: '😢', color: 'btn-error' }
    ];
    
    const modal = document.createElement('div');
    modal.className = 'modal modal-open';
    modal.innerHTML = `
        <div class="modal-box max-w-sm">
            <h3 class="font-bold text-lg mb-4 flex items-center gap-2">
                <i data-lucide="smile" class="w-5 h-5 text-warning"></i>
                Stimmung eingeben
            </h3>
            
            <div class="form-control">
                <label class="label">
                    <span class="label-text">Wie fühlst du dich heute?</span>
                </label>
                
                <div class="grid grid-cols-1 gap-2 mt-2">
                    ${moodOptions.map(mood => `
                        <button class="btn btn-outline ${mood.color} justify-start gap-3 h-14" 
                                onclick="healthTracker?.saveQuickData?.('mood', '${mood.value}'); this.closest('.modal').remove();">
                            <span class="text-2xl">${mood.emoji}</span>
                            <div class="text-left">
                                <div class="font-semibold">${mood.label}</div>
                            </div>
                        </button>
                    `).join('')}
                </div>
            </div>
            
            <div class="modal-action">
                <button class="btn btn-ghost" onclick="this.closest('.modal').remove()">Abbrechen</button>
            </div>
        </div>
        <div class="modal-backdrop" onclick="this.closest('.modal').remove()"></div>
    `;
    
    document.body.appendChild(modal);
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

/**
 * Quick Notes Input Modal
 */
showQuickNotesInput() {
    const modal = document.createElement('div');
    modal.className = 'modal modal-open';
    modal.innerHTML = `
        <div class="modal-box max-w-md">
            <h3 class="font-bold text-lg mb-4 flex items-center gap-2">
                <i data-lucide="edit-3" class="w-5 h-5 text-success"></i>
                Schnelle Notiz
            </h3>
            
            <div class="form-control">
                <label class="label">
                    <span class="label-text">Notiz für heute</span>
                </label>
                <textarea id="quick-notes" class="textarea textarea-bordered textarea-success h-32" 
                          placeholder="Was möchtest du festhalten?" autofocus></textarea>
                <div class="label">
                    <span class="label-text-alt">Max. 500 Zeichen</span>
                    <span class="label-text-alt" id="note-counter">0/500</span>
                </div>
            </div>
            
            <!-- Quick Templates -->
            <div class="form-control mt-3">
                <label class="label">
                    <span class="label-text-alt">Schnellvorlagen:</span>
                </label>
                <div class="flex flex-wrap gap-1">
                    <button class="btn btn-xs btn-ghost" onclick="document.getElementById('quick-notes').value += 'Guter Tag! '; updateNoteCounter();">👍 Guter Tag</button>
                    <button class="btn btn-xs btn-ghost" onclick="document.getElementById('quick-notes').value += 'Training absolviert. '; updateNoteCounter();">💪 Training</button>
                    <button class="btn btn-xs btn-ghost" onclick="document.getElementById('quick-notes').value += 'Gesund gegessen. '; updateNoteCounter();">🥗 Gesunde Ernährung</button>
                    <button class="btn btn-xs btn-ghost" onclick="document.getElementById('quick-notes').value += 'Früh schlafen gegangen. '; updateNoteCounter();">😴 Früh geschlafen</button>
                </div>
            </div>
            
            <div class="modal-action">
                <button class="btn btn-ghost" onclick="this.closest('.modal').remove()">Abbrechen</button>
                <button class="btn btn-success" onclick="healthTracker?.saveQuickData?.('notes', document.getElementById('quick-notes').value); this.closest('.modal').remove();">
                    <i data-lucide="save" class="w-4 h-4"></i>
                    Speichern
                </button>
            </div>
        </div>
        <div class="modal-backdrop" onclick="this.closest('.modal').remove()"></div>
        
        <script>
            // Note counter
            const notesTextarea = document.getElementById('quick-notes');
            const noteCounter = document.getElementById('note-counter');
            
            function updateNoteCounter() {
                const length = notesTextarea.value.length;
                noteCounter.textContent = length + '/500';
                if (length > 500) {
                    noteCounter.classList.add('text-error');
                    notesTextarea.value = notesTextarea.value.substring(0, 500);
                } else {
                    noteCounter.classList.remove('text-error');
                }
            }
            
            notesTextarea.addEventListener('input', updateNoteCounter);
        </script>
    `;
    
    document.body.appendChild(modal);
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

/**
 * Scroll zum Gesundheitsformular
 */
scrollToHealthForm() {
    const healthForm = document.getElementById('health-form');
    if (healthForm) {
        healthForm.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start' 
        });
        
        // Fokus auf erstes leeres Feld setzen
        const inputs = healthForm.querySelectorAll('input:not([readonly]), select, textarea');
        for (const input of inputs) {
            if (!input.value || input.value.trim() === '') {
                setTimeout(() => input.focus(), 500);
                break;
            }
        }
    }
}

/**
 * Speichere Quick Add Daten
 */
async saveQuickData(type, value) {
    if (!value || value.trim() === '') {
        this.showToast('❌ Bitte einen Wert eingeben', 'error');
        return;
    }
    
    try {
        this.setLoadingState(true);
        
        // Aktuelle Daten für heute laden
        const allData = await this.getAllHealthData();
        const todayData = this.getTodayData(allData);
        
        // Heute-Datum
        const today = new Date();
        const todayStr = today.getFullYear() + '-' + 
                        String(today.getMonth() + 1).padStart(2, '0') + '-' + 
                        String(today.getDate()).padStart(2, '0');
        
        // Neue Daten basierend auf Typ erstellen
        const quickData = {
            userId: this.userId,
            date: todayStr,
            weight: null,
            steps: null,
            waterIntake: null,
            sleepHours: null,
            mood: null,
            notes: null,
            createdAt: new Date().toISOString()
        };
        
        // Type-spezifische Verarbeitung
        switch(type) {
            case 'steps':
                const stepsValue = parseInt(value);
                if (stepsValue <= 0 || stepsValue > 100000) {
                    this.showToast('❌ Ungültige Schrittzahl', 'error');
                    return;
                }
                quickData.steps = (todayData.steps || 0) + stepsValue;
                this.showToast(`🚶‍♂️ ${stepsValue.toLocaleString()} Schritte hinzugefügt`, 'success');
                break;
                
            case 'water':
                const waterValue = parseFloat(value);
                if (waterValue <= 0 || waterValue > 5) {
                    this.showToast('❌ Ungültige Wassermenge', 'error');
                    return;
                }
                quickData.waterIntake = Math.round(((todayData.waterIntake || 0) + waterValue) * 10) / 10;
                this.showToast(`💧 ${waterValue}L Wasser hinzugefügt`, 'success');
                break;
                
            case 'weight':
                const weightValue = parseFloat(value);
                if (weightValue < 30 || weightValue > 300) {
                    this.showToast('❌ Ungültiges Gewicht (30-300kg)', 'error');
                    return;
                }
                quickData.weight = weightValue;
                this.showToast(`⚖️ Gewicht auf ${weightValue}kg gesetzt`, 'success');
                break;
                
            case 'sleep':
                const sleepValue = parseFloat(value);
                if (sleepValue <= 0 || sleepValue > 24) {
                    this.showToast('❌ Ungültige Schlafzeit', 'error');
                    return;
                }
                quickData.sleepHours = Math.round(((todayData.sleepHours || 0) + sleepValue) * 10) / 10;
                this.showToast(`😴 ${sleepValue}h Schlaf hinzugefügt`, 'success');
                break;
                
            case 'mood':
                const validMoods = ['excellent', 'good', 'neutral', 'bad', 'terrible'];
                if (!validMoods.includes(value)) {
                    this.showToast('❌ Ungültige Stimmung', 'error');
                    return;
                }
                quickData.mood = value;
                const moodLabels = {
                    'excellent': '😄 Ausgezeichnet',
                    'good': '😊 Gut',
                    'neutral': '😐 Neutral',
                    'bad': '😔 Schlecht',
                    'terrible': '😢 Furchtbar'
                };
                this.showToast(`${moodLabels[value]} gespeichert`, 'success');
                break;
                
            case 'notes':
                const noteValue = value.trim().substring(0, 500);
                if (noteValue.length === 0) {
                    this.showToast('❌ Notiz ist leer', 'error');
                    return;
                }
                // Notizen anhängen wenn bereits vorhanden
                const existingNotes = todayData.notes || '';
                quickData.notes = existingNotes 
                    ? `${existingNotes}\n${new Date().toLocaleTimeString('de-DE', {hour: '2-digit', minute: '2-digit'})}: ${noteValue}`
                    : noteValue;
                this.showToast(`📝 Notiz hinzugefügt`, 'success');
                break;
                
            default:
                this.showToast('❌ Unbekannter Datentyp', 'error');
                return;
        }
        
        // Daten speichern
        const success = await this.saveHealthData(quickData);
        
        if (success) {
            // Komponenten aktualisieren
            await this.refreshAllComponents();
            
            // Event für andere Komponenten
            this.dispatchHealthDataEvent('quick-data-saved', { type, value, data: quickData });
            
            // Haptic Feedback
            if (navigator.vibrate && localStorage.getItem('hapticFeedback') === 'true') {
                navigator.vibrate([50, 30, 50]);
            }
        }
        
    } catch (error) {
        console.error('❌ Quick Add Fehler:', error);
        this.showToast('❌ Speichern fehlgeschlagen', 'error');
    } finally {
        this.setLoadingState(false);
    }
}

// Connection Status Check
async checkConnectionStatus() {
    const statusEl = document.getElementById('connection-status');
    const indicatorEl = document.getElementById('connection-indicator');
    
    if (!statusEl) return;
    
    // Visual Feedback
    statusEl.classList.add('loading');
    
    try {
        // Teste Verbindung mit API
        const response = await fetch('/api/health', { 
            method: 'GET',
            timeout: 5000 
        });
        
        const isOnline = response.ok;
        this.isOnline = isOnline;
        
        // Update UI
        if (isOnline) {
            statusEl.className = 'badge badge-success gap-2 cursor-pointer hover:badge-success/80 transition-colors duration-200 text-xs font-medium';
            statusEl.innerHTML = '<i data-lucide="wifi" class="w-3 h-3"></i><span class="hidden sm:inline">Online</span>';
            indicatorEl.className = 'indicator-item indicator-top indicator-end badge badge-success badge-xs animate-pulse';
            this.showToast('🌐 Verbindung aktiv', 'success', 2000);
        } else {
            throw new Error('Offline');
        }
        
    } catch (error) {
        this.isOnline = false;
        statusEl.className = 'badge badge-warning gap-2 cursor-pointer hover:badge-warning/80 transition-colors duration-200 text-xs font-medium';
        statusEl.innerHTML = '<i data-lucide="wifi-off" class="w-3 h-3"></i><span class="hidden sm:inline">Offline</span>';
        indicatorEl.className = 'indicator-item indicator-top indicator-end badge badge-warning badge-xs animate-pulse';
        this.showToast('📵 Offline-Modus', 'warning', 2000);
    } finally {
        statusEl.classList.remove('loading');
        
        // Icons aktualisieren
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }
}

// Navigation aktiven Zustand aktualisieren
updateActiveNavigation(activeSection) {
    // Entferne aktive Klassen
    document.querySelectorAll('[data-nav]').forEach(nav => {
        nav.classList.remove('btn-primary', 'text-primary-content');
        nav.classList.add('btn-ghost');
    });
    
    // Setze aktive Klasse
    const activeNav = document.querySelector(`[data-nav="${activeSection}"]`);
    if (activeNav) {
        activeNav.classList.remove('btn-ghost');
        activeNav.classList.add('btn-primary', 'text-primary-content');
    }
}
    
    /**
 * Initialize all component classes
 */
initializeComponents() {
    try {
        // Initialize notification manager first (needed by other components)
        this.notificationManager = new SmartNotificationManager(this);
        
        // Initialize other components
        this.progressHub = new ProgressHub(this);
        this.activityFeed = new ActivityFeed(this);
        this.analyticsEngine = new AnalyticsEngine(this);
        
        console.log('📦 Alle Komponenten initialisiert');
        
        // Setup progress hub tabs AFTER initialization
        setTimeout(() => {
            this.setupProgressHubTabs();
        }, 100);
        
    } catch (error) {
        console.error('❌ Fehler bei Komponenteninitialisierung:', error);
    }

    setTimeout(async () => {
  try {
    // Initiales Laden der ProgressHub-Daten sicherstellen
    if (this.progressHub && typeof this.progressHub.loadViewData === 'function') {
      await this.progressHub.loadViewData();
      // Standard-View anzeigen, falls nicht gesetzt
      if (!this.progressHub.currentView && typeof this.progressHub.showView === 'function') {
        this.progressHub.showView('overview');
      }
    }
  } catch (e) {
    console.error('❌ ProgressHub Initial-Ladefehler:', e);
  }
}, 250);
}

initializeSettings() {
    console.log('⚙️ Initialisiere Einstellungen');
    
    // Theme aus localStorage laden mit Fallback-System
    const savedTheme = localStorage.getItem('theme') || this.detectPreferredTheme();
    this.setTheme(savedTheme);
    
    // Theme-Change Event Listener
    window.addEventListener('themeChanged', (e) => {
        console.log(`🎨 Theme geändert: ${e.detail.theme}`);
        this.onThemeChanged(e.detail);
    });
    
    // System Theme Change Detection
    if (window.matchMedia) {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        mediaQuery.addEventListener('change', (e) => {
            if (!localStorage.getItem('theme-preference-override')) {
                this.setTheme(e.matches ? 'dark' : 'light');
            }
        });
    }
    
    // Haptic Feedback testen falls aktiviert
    const hapticEnabled = JSON.parse(localStorage.getItem('hapticFeedback') || 'false');
    if (hapticEnabled && navigator.vibrate) {
        // Kurze Vibration beim App-Start als Test
        navigator.vibrate(30);
    }
    
    // Datenretention prüfen
    const lastRetentionCheck = localStorage.getItem('lastRetentionCheck');
    const today = new Date().toDateString();
    
    if (lastRetentionCheck !== today) {
        this.implementDataRetention();
        localStorage.setItem('lastRetentionCheck', today);
    }
    
    // Notification Permission Status prüfen
    if ('Notification' in window && Notification.permission === 'default') {
        console.log('🔔 Notification permission not yet requested');
    }
}
    
    /**
     * Setup all event listeners for forms and UI interactions
     */
    setupEventListeners() {
        // Health form submission
        const healthForm = document.getElementById('health-form');
        if (healthForm) {
            healthForm.addEventListener('submit', this.handleFormSubmission.bind(this));
        }
        
        // Goals form submission
        const goalsForm = document.getElementById('goals-form');
        if (goalsForm) {
            goalsForm.addEventListener('submit', this.handleGoalsSubmission.bind(this));
        }
        
        // Network status changes
        window.addEventListener('online', this.handleOnlineStatus.bind(this));
        window.addEventListener('offline', this.handleOfflineStatus.bind(this));
        
        // Form input debouncing for better UX
        this.setupFormInputDebouncing();
        
        // Progress Hub tab switching
        this.setupProgressHubTabs();
        
        console.log('👂 Event Listeners konfiguriert');
    }
    
    /**
     * Setup debounced form inputs for better performance
     */
    setupFormInputDebouncing() {
        const formInputs = document.querySelectorAll('#health-form input, #health-form select, #health-form textarea');
        
        formInputs.forEach(input => {
            input.addEventListener('input', (e) => {
                this.debounceFunction(`form-${input.name}`, () => {
                    this.validateFormInput(input);
                }, 300);
            });
        });
    }
    
    setupProgressHubTabs() {
  const bind = (id, view) => {
    const el = document.getElementById(id);
    if (!el) return;
    
    const clone = el.cloneNode(true);
    el.parentNode.replaceChild(clone, el);
    
    clone.addEventListener('click', async (e) => {
      e.preventDefault();
      if (!this.progressHub) return;

      // Update tab active states
      document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('tab-active'));
      clone.classList.add('tab-active');
      
      console.log(`📊 Switching to view: ${view}`);
      
      // Set current view BEFORE calling showView
      this.progressHub.currentView = view;
      
      // Call the specific view method directly
      switch(view) {
        case 'today':
          if (typeof this.progressHub.showTodayView === 'function') {
            this.progressHub.showTodayView();
          }
          break;
        case 'week':
          if (typeof this.progressHub.showWeeklyView === 'function') {
            this.progressHub.showWeeklyView();
          }
          break;
        case 'goals':
          if (typeof this.progressHub.showGoalsView === 'function') {
            this.progressHub.showGoalsView();
          }
          break;
        case 'achievements':
          if (typeof this.progressHub.showAchievementsView === 'function') {
            this.progressHub.showAchievementsView();
          }
          break;
      }
      
      // Load data for the selected view
      if (typeof this.progressHub.loadViewData === 'function') {
        try {
          await this.progressHub.loadViewData();
        } catch (err) {
          console.error('❌ ProgressHub Tab-Ladefehler:', err);
        }
      }
    });
  };

  bind('tab-today', 'today');
  bind('tab-week', 'week'); 
  bind('tab-goals', 'goals');
  bind('tab-achievements', 'achievements');
}
    
    /**
 * Load initial application data
 */
async loadInitialData() {
    try {
        // Show loading state
        this.setLoadingState(true);
        
        // Load and display current stats
        await this.updateDashboardStats();
        
        // Update Hero statistics
        await this.updateHeroStats();
        
        // Load activity feed
        await this.activityFeed?.load();
        
        // Load analytics
        await this.analyticsEngine?.updateAllAnalytics();
        
    } catch (error) {
        console.error('❌ Fehler beim Laden der initialen Daten:', error);
    } finally {
        this.setLoadingState(false);
    }
}
    
    /**
 * Handle health data form submission
 */
async handleFormSubmission(event) {
    event.preventDefault();
    
    if (this.isLoading) {
        return;
    }

    try {
        this.setLoadingState(true);
        
        const formData = this.extractFormData(event.target);
        const validationResult = this.validateFormData(formData);
        
        if (!validationResult.isValid) {
            this.showToast(`❌ ${validationResult.message}`, 'error');
            return;
        }

        // Save data with offline-first strategy
        const success = await this.saveHealthData(formData);
        
        if (success) {
            this.showToast('✅ Gesundheitsdaten erfolgreich gespeichert!', 'success');
            event.target.reset();
            
            // Update all components with new data
            await this.refreshAllComponents();
            
            // Dispatch custom event for other components
            this.dispatchHealthDataEvent('health-data-saved', formData);
            
            // ProgressHub korrekt aktualisieren
            if (this.progressHub) {
                await this.progressHub.loadViewData();
                this.progressHub.showView(this.progressHub.currentView);
            }
        } else {
            this.showToast('❌ Speichern fehlgeschlagen - Daten lokal gesichert', 'warning');
        }
        
    } catch (error) {
        console.error('❌ Fehler beim Speichern:', error);
        this.showToast('❌ Speichern fehlgeschlagen - Daten lokal gesichert', 'warning');
    } finally {
        this.setLoadingState(false);
    }
}
    
    /**
     * Handle goals form submission
     */
    async handleGoalsSubmission(event) {
        event.preventDefault();
        
        try {
            this.setLoadingState(true);
            
            const goalsData = this.extractGoalsData(event.target);
            const success = await this.saveUserGoals(goalsData);
            
            if (success) {
                this.goals = { ...this.goals, ...goalsData };
                this.showToast('✅ Ziele erfolgreich aktualisiert!', 'success');
                
                // Update progress indicators
                await this.updateDashboardStats();
                await this.progressHub?.loadViewData();
            }
            
        } catch (error) {
            console.error('❌ Fehler beim Speichern der Ziele:', error);
            this.showToast('❌ Ziele konnten nicht gespeichert werden', 'error');
        } finally {
            this.setLoadingState(false);
        }
    }
    
    /**
 * Extract and sanitize form data
 */
extractFormData(form) {
    const formData = new FormData(form);
    
    // KRITISCHER FIX: Datum korrekt verarbeiten
    let dateValue = formData.get('date');
    if (!dateValue) {
        // Verwende lokales Datum (nicht UTC)
        const today = new Date();
        dateValue = today.getFullYear() + '-' + 
                   String(today.getMonth() + 1).padStart(2, '0') + '-' + 
                   String(today.getDate()).padStart(2, '0');
    }
    
    console.log('📅 EXTRACT FORM - Date value:', dateValue);

    const result = {
        userId: this.userId,
        date: dateValue, // Als String speichern, NICHT als Date-Objekt
        weight: this.parseNumber(formData.get('weight')),
        steps: this.parseInt(formData.get('steps')),
        waterIntake: this.parseNumber(formData.get('waterIntake')),
        sleepHours: this.parseNumber(formData.get('sleepHours')),
        mood: formData.get('mood') || null,
        notes: this.sanitizeString(formData.get('notes')),
        createdAt: new Date().toISOString() // Nur für Reihenfolge
    };
    
    console.log('📊 EXTRACTED DATA:', result);
    return result;
}
    
    /**
     * Extract goals data from form
     */
    extractGoalsData(form) {
        const formData = new FormData(form);
        
        return {
            userId: this.userId,
            weightGoal: this.parseNumber(formData.get('weightGoal')),
            stepsGoal: this.parseInt(formData.get('stepsGoal')) || 10000,
            waterGoal: this.parseNumber(formData.get('waterGoal')) || 2.0,
            sleepGoal: this.parseNumber(formData.get('sleepGoal')) || 8
        };
    }
    
    /**
     * Validate form data before submission
     */
    validateFormData(data) {
        // Date validation
        if (!data.date) {
            return { isValid: false, message: 'Datum ist erforderlich' };
        }
        
        // Numeric validations
        if (data.weight && (data.weight < 20 || data.weight > 500)) {
            return { isValid: false, message: 'Gewicht muss zwischen 20-500kg liegen' };
        }
        
        if (data.steps && data.steps < 0) {
            return { isValid: false, message: 'Schritte können nicht negativ sein' };
        }
        
        if (data.waterIntake && (data.waterIntake < 0 || data.waterIntake > 10)) {
            return { isValid: false, message: 'Wasserzufuhr muss zwischen 0-10L liegen' };
        }
        
        if (data.sleepHours && (data.sleepHours < 0 || data.sleepHours > 24)) {
            return { isValid: false, message: 'Schlafstunden müssen zwischen 0-24h liegen' };
        }
        
        // At least one field should be filled
        const hasData = data.weight || data.steps || data.waterIntake || 
                        data.sleepHours || data.mood || data.notes;
        
        if (!hasData) {
            return { isValid: false, message: 'Mindestens ein Feld muss ausgefüllt werden' };
        }
        
        return { isValid: true };
    }
    
    /**
     * Save health data with offline-first strategy
     */
    async saveHealthData(data) {
        try {
            // Always save locally first
            await this.saveToLocalStorage(data);
            
            // Try to save to server if online
            if (this.isOnline) {
                try {
                    const response = await this.makeAPICall('/api/health-data', {
                        method: 'POST',
                        body: JSON.stringify(data)
                    });
                    
                    if (response.success) {
                        // Mark as synced
                        await this.markAsSynced(data);
                        return true;
                    }
                } catch (error) {
                    console.log('Server speichern fehlgeschlagen, lokal gespeichert:', error.message);
                }
            }
            
            // Mark for later sync
            await this.markForSync(data);
            this.dispatchHealthDataEvent('health-data-saved-offline', data);
            
            return true;
            
        } catch (error) {
            console.error('❌ Speichern komplett fehlgeschlagen:', error);
            return false;
        }
    }
    
    /**
     * Load user goals from server or localStorage
     */
    async loadUserGoals() {
        try {
            let goals = null;
            
            // Try server first if online
            if (this.isOnline) {
                try {
                    const response = await this.makeAPICall(`/api/goals/${this.userId}`);
                    if (response && Object.keys(response).length > 1) {
                        goals = response;
                    }
                } catch (error) {
                    console.log('Server goals nicht verfügbar:', error.message);
                }
            }
            
            // Fallback to localStorage
            if (!goals) {
                const localGoals = localStorage.getItem('userGoals');
                if (localGoals) {
                    goals = JSON.parse(localGoals);
                }
            }
            
            // Merge with defaults
            if (goals) {
                this.goals = { ...this.goals, ...goals };
                
                // Update goals form if it exists
                this.populateGoalsForm();
            }
            
        } catch (error) {
            console.error('❌ Fehler beim Laden der Ziele:', error);
        }
    }
    
    /**
     * Save user goals with offline-first strategy
     */
    async saveUserGoals(goalsData) {
        try {
            // Save locally
            localStorage.setItem('userGoals', JSON.stringify(goalsData));
            
            // Try server if online
            if (this.isOnline) {
                try {
                    const response = await this.makeAPICall('/api/goals', {
                        method: 'POST',
                        body: JSON.stringify(goalsData)
                    });
                    
                    return response.success;
                } catch (error) {
                    console.log('Server goals speichern fehlgeschlagen:', error.message);
                    return true; // Local save successful
                }
            }
            
            return true;
            
        } catch (error) {
            console.error('❌ Goals speichern fehlgeschlagen:', error);
            return false;
        }
    }
    
    /**
 * Enhanced today data aggregation
 */
getTodayData(allData) {
    // Heutiges Datum in lokalem Format
    const today = new Date();
    const todayStr = today.getFullYear() + '-' + 
        String(today.getMonth() + 1).padStart(2, '0') + '-' + 
        String(today.getDate()).padStart(2, '0');

    console.log('🗓️ Suche Daten für:', todayStr);
    console.log('📊 Verfügbare Daten:', allData?.length || 0);

    if (!allData || !Array.isArray(allData) || allData.length === 0) {
        console.log('❌ Keine Daten verfügbar');
        return { date: todayStr };
    }

    // VERBESSERTES FILTERING - alle möglichen Datumsformate berücksichtigen
    const todayEntries = allData.filter(entry => {
        if (!entry || !entry.date) {
            return false;
        }

        let entryDateStr;
        // Fall 1: String-Datum (ISO oder einfach)
        if (typeof entry.date === 'string') {
            // ISO Format: "2025-08-06T10:30:00.000Z" -> "2025-08-06"
            if (entry.date.includes('T')) {
                entryDateStr = entry.date.split('T')[0];
            } else {
                entryDateStr = entry.date;
            }
        }
        // Fall 2: Date-Objekt
        else if (entry.date instanceof Date) {
            entryDateStr = entry.date.getFullYear() + '-' + 
                String(entry.date.getMonth() + 1).padStart(2, '0') + '-' + 
                String(entry.date.getDate()).padStart(2, '0');
        }
        // Fall 3: MongoDB Date String
        else if (typeof entry.date === 'object' && entry.date.$date) {
            const date = new Date(entry.date.$date);
            entryDateStr = date.getFullYear() + '-' + 
                String(date.getMonth() + 1).padStart(2, '0') + '-' + 
                String(date.getDate()).padStart(2, '0');
        } else {
            console.log('⚠️ Unbekanntes Datumsformat:', entry.date, typeof entry.date);
            return false;
        }

        const matches = entryDateStr === todayStr;
        console.log(`📅 "${entryDateStr}" === "${todayStr}" = ${matches}`);
        return matches;
    });

    console.log(`✅ Gefunden: ${todayEntries.length} heutige Einträge`);

    if (todayEntries.length === 0) {
        console.log('📊 Keine Einträge für heute - return empty object');
        return { date: todayStr };
    }

    // AGGREGATION - ALLE WERTE SAMMELN
    const aggregatedData = {
        date: todayStr,
        weight: null,
        steps: 0,
        waterIntake: 0,
        sleepHours: 0,
        mood: null,
        notes: [],
        entryCount: todayEntries.length,
        lastUpdated: null
    };

    console.log('🔄 Aggregiere Einträge...');
    todayEntries.forEach((entry, index) => {
        console.log(`Eintrag ${index + 1}:`, {
            weight: entry.weight,
            steps: entry.steps,
            waterIntake: entry.waterIntake,
            sleepHours: entry.sleepHours,
            mood: entry.mood
        });

        // Gewicht (letzter Wert)
        if (entry.weight !== null && entry.weight !== undefined) {
            aggregatedData.weight = entry.weight;
            console.log(`⚖️ Gewicht aktualisiert: ${aggregatedData.weight}kg`);
        }

        // Schritte (summieren)
        if (entry.steps && entry.steps > 0) {
            aggregatedData.steps += entry.steps;
            console.log(`🚶♂️ Schritte summiert: ${aggregatedData.steps}`);
        }

        // Wasser (summieren)
        if (entry.waterIntake && entry.waterIntake > 0) {
            aggregatedData.waterIntake += entry.waterIntake;
            console.log(`💧 Wasser summiert: ${aggregatedData.waterIntake}L`);
        }

        // Schlaf (summieren)
        if (entry.sleepHours && entry.sleepHours > 0) {
            aggregatedData.sleepHours += entry.sleepHours;
            console.log(`😴 Schlaf summiert: ${aggregatedData.sleepHours}h`);
        }

        // Stimmung (letzter Wert)
        if (entry.mood) {
            aggregatedData.mood = entry.mood;
            console.log(`😊 Stimmung: ${aggregatedData.mood}`);
        }

        // Notizen sammeln
        if (entry.notes && entry.notes.trim()) {
            aggregatedData.notes.push(entry.notes.trim());
        }
    });

    // Nachbearbeitung
    aggregatedData.notes = aggregatedData.notes.length > 0 ? 
        aggregatedData.notes.join(' | ') : null;
    aggregatedData.waterIntake = Math.round(aggregatedData.waterIntake * 10) / 10;
    aggregatedData.sleepHours = Math.round(aggregatedData.sleepHours * 10) / 10;

    console.log('📊 FINALE DATEN:', aggregatedData);
    return aggregatedData;
}
    
    /**
     * Update individual stat card
     */
    updateStatCard(elementId, value, unit, icon) {
        const element = document.getElementById(elementId);
        if (element) {
            const displayValue = value ? (typeof value === 'number' ? 
                value.toLocaleString('de-DE') : value) : '—';
            element.textContent = `${displayValue}${unit}`;
            
            // Add subtle animation
            element.style.transform = 'scale(1.05)';
            setTimeout(() => {
                element.style.transform = 'scale(1)';
            }, 200);
        }
    }
    
    /**
     * Update progress indicator element
     */
    updateProgressIndicator(elementId, progress) {
        const element = document.getElementById(elementId);
        if (element) {
            element.style.setProperty('--value', Math.round(progress));
            
            // Update text content if it's a progress element
            const textEl = element.querySelector('.progress-text') || element;
            if (textEl !== element) {
                textEl.textContent = Math.round(progress) + '%';
            }
        }
    }
    
    /**
     * Get all health data from server or localStorage
     */
    async getAllHealthData() {
        try {
            let allData = [];
            
            // Try server first if online
            if (this.isOnline && !this.cache.has('allHealthData')) {
                try {
                    allData = await this.makeAPICall(`/api/health-data/${this.userId}`);
                    if (Array.isArray(allData)) {
                        // Cache for 5 minutes
                        this.cache.set('allHealthData', {
                            data: allData,
                            timestamp: Date.now()
                        });
                    }
                } catch (error) {
                    console.log('Server Daten nicht verfügbar:', error.message);
                }
            }
            
            // Use cached data if available and fresh
            const cached = this.cache.get('allHealthData');
            if (cached && (Date.now() - cached.timestamp < 300000)) { // 5 minutes
                allData = cached.data;
            }
            
            // Fallback to localStorage
            if (!Array.isArray(allData) || allData.length === 0) {
                const localData = localStorage.getItem('healthData');
                allData = localData ? JSON.parse(localData) : [];
            }
            
            return Array.isArray(allData) ? allData : [];
            
        } catch (error) {
            console.error('❌ Fehler beim Laden der Gesundheitsdaten:', error);
            return [];
        }
    }

/**
 * Enhanced today data aggregation with multiple entries support
 */
getTodayData(allData) {
    // Berücksichtige lokale Zeitzone
    const today = new Date();
    const todayStr = today.getFullYear() + '-' + 
                     String(today.getMonth() + 1).padStart(2, '0') + '-' + 
                     String(today.getDate()).padStart(2, '0');
    
    console.log('🗓️ Suche Daten für heute:', todayStr);
    
    // Filter entries for today with flexible date parsing
    const todayEntries = allData.filter(entry => {
        if (!entry.date) return false;
        
        // Handle different date formats
        let entryDateStr;
        if (entry.date instanceof Date) {
            entryDateStr = entry.date.getFullYear() + '-' + 
                          String(entry.date.getMonth() + 1).padStart(2, '0') + '-' + 
                          String(entry.date.getDate()).padStart(2, '0');
        } else if (typeof entry.date === 'string') {
            // Extract date part from ISO string or regular date string
            entryDateStr = entry.date.split('T')[0];
        } else {
            return false;
        }
        
        const isToday = entryDateStr === todayStr;
        console.log(`📅 Entry date: ${entryDateStr}, Today: ${todayStr}, Match: ${isToday}`);
        return isToday;
    });
    
    console.log(`✅ Found ${todayEntries.length} entries for today:`, todayEntries);
    
    if (todayEntries.length === 0) {
        return { date: todayStr };
    }
    
    // Sort entries by creation time (newest first)
    todayEntries.sort((a, b) => {
        const timeA = new Date(a.createdAt || a.date).getTime();
        const timeB = new Date(b.createdAt || b.date).getTime();
        return timeB - timeA;
    });
    
    // Aggregate multiple entries for the same day
    const aggregatedData = {
        date: todayStr,
        weight: null,
        steps: 0,
        waterIntake: 0,
        sleepHours: 0,
        mood: null,
        notes: [],
        entryCount: todayEntries.length,
        lastUpdated: null
    };
    
    todayEntries.forEach(entry => {
        console.log('🔄 Processing entry:', entry);
        
        // For weight, take the most recent entry
        if (entry.weight !== null && entry.weight !== undefined && !aggregatedData.weight) {
            aggregatedData.weight = entry.weight;
            console.log('⚖️ Weight set to:', aggregatedData.weight);
        }
        
        // For steps, sum all entries
        if (entry.steps) {
            aggregatedData.steps += entry.steps;
            console.log('🚶♂️ Steps total:', aggregatedData.steps);
        }
        
        // For water, sum all entries
        if (entry.waterIntake) {
            aggregatedData.waterIntake += entry.waterIntake;
            console.log('💧 Water total:', aggregatedData.waterIntake);
        }
        
        // For sleep, sum all entries (supports naps and main sleep)
        if (entry.sleepHours) {
            aggregatedData.sleepHours += entry.sleepHours;
            console.log('😴 Sleep total:', aggregatedData.sleepHours);
        }
        
        // For mood, take the most recent entry
        if (entry.mood && !aggregatedData.mood) {
            aggregatedData.mood = entry.mood;
            console.log('😊 Mood set to:', aggregatedData.mood);
        }
        
        // Collect all notes with timestamps
        if (entry.notes && entry.notes.trim()) {
            const timestamp = new Date(entry.createdAt || entry.date).toLocaleTimeString('de-DE', {
                hour: '2-digit',
                minute: '2-digit'
            });
            aggregatedData.notes.push(`${timestamp}: ${entry.notes.trim()}`);
        }
        
        // Track last update time
        const entryTime = new Date(entry.createdAt || entry.date).getTime();
        if (!aggregatedData.lastUpdated || entryTime > aggregatedData.lastUpdated) {
            aggregatedData.lastUpdated = entryTime;
        }
    });
    
    // Process notes
    aggregatedData.notes = aggregatedData.notes.length > 0 ? aggregatedData.notes.join('\n') : null;
    
    // Round decimal values
    aggregatedData.waterIntake = Math.round(aggregatedData.waterIntake * 10) / 10;
    aggregatedData.sleepHours = Math.round(aggregatedData.sleepHours * 10) / 10;
    
    // Convert lastUpdated to readable format
    if (aggregatedData.lastUpdated) {
        aggregatedData.lastUpdatedFormatted = new Date(aggregatedData.lastUpdated).toLocaleTimeString('de-DE', {
            hour: '2-digit',
            minute: '2-digit'
        });
    }
    
    console.log('📊 Final aggregated data:', aggregatedData);
    return aggregatedData;
}
    
    /**
 * Get current week's health data with improved date filtering
 */
getWeekData(allData) {
    if (!allData || !Array.isArray(allData) || allData.length === 0) {
        console.log('❌ Keine Daten für Wochenfilterung verfügbar');
        return [];
    }

    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));
    
    console.log('📅 Wochenfilter:', {
        von: oneWeekAgo.toISOString().split('T')[0],
        bis: now.toISOString().split('T')[0],
        gesamtDaten: allData.length
    });

    const weekData = allData.filter(entry => {
        if (!entry || !entry.date) {
            return false;
        }

        let entryDate;
        
        // Verschiedene Datumsformate handhaben
        if (typeof entry.date === 'string') {
            // ISO Format oder einfaches Datum
            if (entry.date.includes('T')) {
                entryDate = new Date(entry.date.split('T')[0]);
            } else {
                entryDate = new Date(entry.date);
            }
        } else if (entry.date instanceof Date) {
            entryDate = entry.date;
        } else if (typeof entry.date === 'object' && entry.date.$date) {
            entryDate = new Date(entry.date.$date);
        } else {
            console.log('⚠️ Unbekanntes Datumsformat in Woche:', entry.date);
            return false;
        }

        // Prüfe ob Datum in der letzten Woche liegt
        const isInWeek = entryDate >= oneWeekAgo && entryDate <= now;
        
        if (isInWeek) {
            console.log(`✅ Wocheneintrag: ${entryDate.toISOString().split('T')[0]} - Steps: ${entry.steps}, Water: ${entry.waterIntake}, Sleep: ${entry.sleepHours}`);
        }
        
        return isInWeek;
    });

    console.log(`📊 Wöchentliche Daten gefiltert: ${weekData.length} Einträge`);
    return weekData;
}
    
    /**
 * Calculate weekly averages with improved validation
 */
calculateWeeklyAverages(weekData) {
    console.log('🧮 Berechne Wochendurchschnitte für', weekData.length, 'Einträge');
    
    if (!weekData || weekData.length === 0) {
        console.log('❌ Keine Wochendaten für Durchschnitt verfügbar');
        return { steps: 0, water: 0, sleep: 0 };
    }

    let validStepsEntries = 0;
    let validWaterEntries = 0;
    let validSleepEntries = 0;

    const totals = weekData.reduce((acc, entry) => {
        console.log(`📊 Verarbeite Eintrag:`, {
            date: entry.date,
            steps: entry.steps,
            water: entry.waterIntake,
            sleep: entry.sleepHours
        });

        if (entry.steps && entry.steps > 0) {
            acc.steps += entry.steps;
            validStepsEntries++;
        }
        if (entry.waterIntake && entry.waterIntake > 0) {
            acc.water += entry.waterIntake;
            validWaterEntries++;
        }
        if (entry.sleepHours && entry.sleepHours > 0) {
            acc.sleep += entry.sleepHours;
            validSleepEntries++;
        }
        return acc;
    }, { steps: 0, water: 0, sleep: 0 });

    console.log('📊 Wochentotale:', totals);
    console.log('📊 Gültige Einträge:', {
        steps: validStepsEntries,
        water: validWaterEntries,
        sleep: validSleepEntries
    });

    const averages = {
        steps: validStepsEntries > 0 ? Math.round(totals.steps / validStepsEntries) : 0,
        water: validWaterEntries > 0 ? Math.round((totals.water / validWaterEntries) * 10) / 10 : 0,
        sleep: validSleepEntries > 0 ? Math.round((totals.sleep / validSleepEntries) * 10) / 10 : 0
    };

    console.log('📊 Berechnete Wochendurchschnitte:', averages);
    return averages;
}
    
    /**
 * Refresh all components with new data
 */
async refreshAllComponents() {
  try {
    this.cache?.delete?.('allHealthData');

    await this.updateDashboardStats?.();
    await this.updateHeroStats?.();

    if (this.activityFeed && typeof this.activityFeed.load === 'function') {
      await this.activityFeed.load();
    }

    if (this.progressHub && typeof this.progressHub.loadViewData === 'function') {
      const viewToShow = this.progressHub.currentView || 'overview';
      // erst View setzen, dann laden (wichtig für DOM-Container)
      if (typeof this.progressHub.showView === 'function') {
        this.progressHub.showView(viewToShow);
      }
      await this.progressHub.loadViewData();
    }

    if (this.analyticsEngine && typeof this.analyticsEngine.updateAllAnalytics === 'function') {
      await this.analyticsEngine.updateAllAnalytics();
    }
  } catch (error) {
    console.error('❌ Fehler beim Aktualisieren der Komponenten:', error);
  }
}

/**
 * Update dashboard statistics with improved week data handling
 */
async updateDashboardStats() {
    try {
        console.log('📊 Aktualisiere Dashboard-Statistiken...');
        
        const data = await this.getAllHealthData();
        console.log('📊 Geladene Daten:', data.length, 'Einträge');
        
        const todayData = this.getTodayData(data);
        const weekData = this.getWeekData(data);
        
        console.log('📊 Heute-Daten:', todayData);
        console.log('📊 Wochen-Daten:', weekData.length, 'Einträge');

        // Update today's stats
        this.updateStatCard('today-weight', todayData.weight, 'kg', '⚖️');
        this.updateStatCard('today-steps', todayData.steps, '', '🚶♂️');
        this.updateStatCard('today-water', todayData.waterIntake, 'L', '💧');
        this.updateStatCard('today-sleep', todayData.sleepHours, 'h', '😴');

        // Update weekly averages
        const weeklyAvg = this.calculateWeeklyAverages(weekData);
        console.log('📊 Wöchentliche Durchschnitte berechnet:', weeklyAvg);
        
        this.updateStatCard('week-steps', weeklyAvg.steps, '', '📊');
        this.updateStatCard('week-water', weeklyAvg.water, 'L', '📈');
        this.updateStatCard('week-sleep', weeklyAvg.sleep, 'h', '🌙');

        // Update goal progress
        this.updateGoalProgress(todayData);

        console.log('✅ Dashboard Stats erfolgreich aktualisiert');
    } catch (error) {
        console.error('❌ Fehler beim Aktualisieren der Statistiken:', error);
    }
}

/**
 * Update Hero section statistics with real data
 */
async updateHeroStats() {
    try {
        const allData = await this.getAllHealthData();
        const todayData = this.getTodayData(allData);
        
        console.log('🎯 Updating Hero stats with data:', { todayData, totalEntries: allData.length });
        
        // Calculate goals achieved today
        let goalsAchieved = 0;
        let totalGoals = 0;
        
        if (this.goals.stepsGoal) {
            totalGoals++;
            if (todayData.steps >= this.goals.stepsGoal) goalsAchieved++;
        }
        
        if (this.goals.waterGoal) {
            totalGoals++;
            if (todayData.waterIntake >= this.goals.waterGoal) goalsAchieved++;
        }
        
        if (this.goals.sleepGoal) {
            totalGoals++;
            if (todayData.sleepHours >= this.goals.sleepGoal) goalsAchieved++;
        }
        
        if (this.goals.weightGoal && todayData.weight) {
            totalGoals++;
            const weightDiff = Math.abs(todayData.weight - this.goals.weightGoal);
            if (weightDiff <= this.goals.weightGoal * 0.05) goalsAchieved++; // 5% tolerance
        }
        
        // Calculate current streak
        const currentStreak = this.calculateCurrentStreak(allData);
        
        // Calculate weekly improvement
        const weeklyImprovement = this.calculateWeeklyImprovement(allData);
        
        // Update Hero elements with animation
        this.updateHeroElement('hero-goals-today', `${goalsAchieved}/${totalGoals}`);
        this.updateHeroElement('hero-current-streak', currentStreak);
        this.updateHeroElement('hero-improvement', `${weeklyImprovement >= 0 ? '+' : ''}${weeklyImprovement}%`);
        this.updateHeroElement('hero-total-entries', allData.length);
        
        console.log('✅ Hero stats updated successfully');
        
    } catch (error) {
        console.error('❌ Error updating hero stats:', error);
        // Show fallback values on error
        this.updateHeroElement('hero-goals-today', '0/0');
        this.updateHeroElement('hero-current-streak', '0');
        this.updateHeroElement('hero-improvement', '0%');
        this.updateHeroElement('hero-total-entries', '0');
    }
}

/**
 * Update individual hero statistic element with animation
 */
updateHeroElement(elementId, value) {
    const element = document.getElementById(elementId);
    if (element) {
        // Add loading animation
        element.style.opacity = '0.5';
        element.style.transform = 'scale(0.9)';
        element.style.transition = 'all 0.3s ease';
        
        setTimeout(() => {
            element.textContent = value;
            element.style.opacity = '1';
            element.style.transform = 'scale(1)';
            
            // Add success animation
            setTimeout(() => {
                element.style.transform = 'scale(1.05)';
                setTimeout(() => {
                    element.style.transform = 'scale(1)';
                }, 200);
            }, 100);
        }, 150);
    }
}

/**
 * Calculate current tracking streak
 */
calculateCurrentStreak(allData) {
    if (!allData || allData.length === 0) return 0;
    
    let streak = 0;
    const today = new Date();
    
    for (let i = 0; i < 365; i++) { // Max 1 year streak
        const checkDate = new Date(today.getTime() - (i * 24 * 60 * 60 * 1000));
        const dateStr = checkDate.getFullYear() + '-' + 
                       String(checkDate.getMonth() + 1).padStart(2, '0') + '-' + 
                       String(checkDate.getDate()).padStart(2, '0');
        
        const hasEntry = allData.some(entry => {
            if (!entry.date) return false;
            let entryDateStr;
            
            if (typeof entry.date === 'string') {
                entryDateStr = entry.date.split('T')[0];
            } else if (entry.date instanceof Date) {
                entryDateStr = entry.date.getFullYear() + '-' + 
                              String(entry.date.getMonth() + 1).padStart(2, '0') + '-' + 
                              String(entry.date.getDate()).padStart(2, '0');
            } else {
                return false;
            }
            
            return entryDateStr === dateStr;
        });
        
        if (hasEntry) {
            streak++;
        } else {
            break;
        }
    }
    
    return streak;
}

/**
 * Calculate weekly improvement percentage
 */
calculateWeeklyImprovement(allData) {
    if (!allData || allData.length < 7) return 0;
    
    const now = new Date();
    const thisWeekStart = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));
    const lastWeekStart = new Date(now.getTime() - (14 * 24 * 60 * 60 * 1000));
    
    const thisWeek = allData.filter(entry => {
        const date = new Date(entry.date);
        return date >= thisWeekStart;
    });
    
    const lastWeek = allData.filter(entry => {
        const date = new Date(entry.date);
        return date >= lastWeekStart && date < thisWeekStart;
    });
    
    if (thisWeek.length === 0 || lastWeek.length === 0) return 0;
    
    // Calculate average steps for comparison
    const thisWeekSteps = thisWeek.reduce((sum, d) => sum + (d.steps || 0), 0) / thisWeek.length;
    const lastWeekSteps = lastWeek.reduce((sum, d) => sum + (d.steps || 0), 0) / lastWeek.length;
    
    if (lastWeekSteps === 0) return 0;
    
    return Math.round(((thisWeekSteps - lastWeekSteps) / lastWeekSteps) * 100);
}

/**
 * Update individual stat card
 */
updateStatCard(elementId, value, unit, icon) {
    const element = document.getElementById(elementId);
    if (element) {
        const displayValue = value ? (typeof value === 'number' ? value.toLocaleString('de-DE') : value) : '—';
        element.textContent = `${displayValue}${unit}`;
        
        // Add subtle animation
        element.style.transform = 'scale(1.05)';
        setTimeout(() => {
            element.style.transform = 'scale(1)';
        }, 200);
    }
}

/**
 * Update goal progress indicators
 */
updateGoalProgress(todayData) {
    // Steps progress
    if (todayData.steps && this.goals.stepsGoal) {
        const progress = Math.min((todayData.steps / this.goals.stepsGoal) * 100, 100);
        this.updateProgressIndicator('steps-progress', progress);
    }

    // Water progress
    if (todayData.waterIntake && this.goals.waterGoal) {
        const progress = Math.min((todayData.waterIntake / this.goals.waterGoal) * 100, 100);
        this.updateProgressIndicator('water-progress', progress);
    }

    // Sleep progress
    if (todayData.sleepHours && this.goals.sleepGoal) {
        const progress = Math.min((todayData.sleepHours / this.goals.sleepGoal) * 100, 100);
        this.updateProgressIndicator('sleep-progress', progress);
    }

    // Weight progress (if goal is set)
    if (todayData.weight && this.goals.weightGoal) {
        const diff = Math.abs(todayData.weight - this.goals.weightGoal);
        const maxDiff = this.goals.weightGoal * 0.1; // 10% tolerance
        const progress = Math.max(0, Math.min(100, ((maxDiff - diff) / maxDiff) * 100));
        this.updateProgressIndicator('weight-progress', progress);
    }
}

/**
 * Update progress indicator element
 */
updateProgressIndicator(elementId, progress) {
    const element = document.getElementById(elementId);
    if (element) {
        element.style.setProperty('--value', Math.round(progress));
        
        // Update text content if it's a progress element
        const textEl = element.querySelector('.progress-text') || element;
        if (textEl !== element) {
            textEl.textContent = Math.round(progress) + '%';
        }
    }
}

/**
 * Calculate weekly averages
 */
calculateWeeklyAverages(weekData) {
    if (weekData.length === 0) {
        return { steps: 0, water: 0, sleep: 0 };
    }

    const totals = weekData.reduce((acc, entry) => {
        acc.steps += entry.steps || 0;
        acc.water += entry.waterIntake || 0;
        acc.sleep += entry.sleepHours || 0;
        return acc;
    }, { steps: 0, water: 0, sleep: 0 });

    return {
        steps: Math.round(totals.steps / weekData.length),
        water: Math.round((totals.water / weekData.length) * 10) / 10,
        sleep: Math.round((totals.sleep / weekData.length) * 10) / 10
    };
}
    
    // ====================================================================
    // NETWORK & SYNC MANAGEMENT
    // ====================================================================
    
    /**
     * Handle online status change
     */
    async handleOnlineStatus() {
        this.isOnline = true;
        this.updateConnectionStatus(true);
        
        // Sync offline data
        if (!this.syncInProgress) {
            await this.syncOfflineData();
        }
    }
    
    /**
     * Handle offline status change
     */
    handleOfflineStatus() {
        this.isOnline = false;
        this.updateConnectionStatus(false);
    }
    
    /**
     * Update connection status indicator
     */
    updateConnectionStatus(isOnline) {
        const statusEl = document.getElementById('connection-status');
        if (statusEl) {
            statusEl.textContent = isOnline ? '🌐 Online' : '📵 Offline';
            statusEl.className = `text-xs ${isOnline ? 'text-green-600' : 'text-yellow-600'}`;
        }
        
        // Show toast notification
        if (isOnline) {
            this.showToast('🌐 Verbindung wiederhergestellt', 'success');
        } else {
            this.showToast('📵 Offline-Modus aktiv', 'warning');
        }
    }
    
    /**
     * Sync offline data to server
     */
    async syncOfflineData() {
        if (!this.isOnline || this.syncInProgress) {
            return;
        }
        
        try {
            this.syncInProgress = true;
            
            const unsyncedData = this.getUnsyncedData();
            
            if (unsyncedData.length === 0) {
                return;
            }
            
            console.log(`🔄 Synchronisiere ${unsyncedData.length} offline Einträge...`);
            
            let successCount = 0;
            
            for (const data of unsyncedData) {
                try {
                    const response = await this.makeAPICall('/api/health-data', {
                        method: 'POST',
                        body: JSON.stringify(data)
                    });
                    
                    if (response.success) {
                        await this.markAsSynced(data);
                        successCount++;
                    }
                } catch (error) {
                    console.error('Sync fehler für Eintrag:', error);
                }
            }
            
            if (successCount > 0) {
                this.showToast(`📤 ${successCount} Einträge synchronisiert`, 'success');
                
                // Refresh components after sync
                await this.refreshAllComponents();
            }
            
        } catch (error) {
            console.error('❌ Sync fehler:', error);
        } finally {
            this.syncInProgress = false;
        }
    }
    
    /**
     * Setup periodic sync every 5 minutes when online
     */
    setupPeriodicSync() {
        setInterval(async () => {
            if (this.isOnline && !this.syncInProgress) {
                await this.syncOfflineData();
            }
        }, 5 * 60 * 1000); // 5 minutes
    }
    
    // ====================================================================
    // UTILITY METHODS & HELPERS
    // ====================================================================
    
    /**
 * Enhanced API Call Method
 */
async makeAPICall(endpoint, options = {}) {
    const defaultOptions = {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
        timeout: 15000
    };
    
    const finalOptions = { ...defaultOptions, ...options };
    
    // API Base URL Detection
    const baseURL = window.location.hostname.includes('localhost') 
        ? 'http://localhost:8888/.netlify/functions/api'  // Netlify Dev
        : '/.netlify/functions/api';  // Production
    
    const fullURL = `${baseURL}${endpoint}`;
    
    try {
        console.log(`🔗 API Call: ${finalOptions.method} ${fullURL}`);
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), finalOptions.timeout);
        
        const response = await fetch(fullURL, {
            ...finalOptions,
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(`API Error ${response.status}: ${errorData.message || response.statusText}`);
        }
        
        const data = await response.json();
        console.log(`✅ API Response:`, data);
        return data;
        
    } catch (error) {
        if (error.name === 'AbortError') {
            throw new Error('Request timeout - Server nicht erreichbar');
        }
        console.error(`❌ API Call failed:`, error);
        throw error;
    }
}
    
    /**
     * Debounce function calls for performance
     */
    debounceFunction(key, func, delay) {
        const existingTimer = this.debounceTimers.get(key);
        if (existingTimer) {
            clearTimeout(existingTimer);
        }
        
        const newTimer = setTimeout(() => {
            func();
            this.debounceTimers.delete(key);
        }, delay);
        
        this.debounceTimers.set(key, newTimer);
    }
    
    /**
     * Generate unique user ID
     */
    generateUserId() {
        let userId = localStorage.getItem('userId');
        if (!userId) {
            userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('userId', userId);
        }
        return userId;
    }
    
    /**
     * Safe number parsing
     */
    parseNumber(value) {
        if (!value || value === '') return null;
        const num = parseFloat(value);
        return isNaN(num) ? null : num;
    }
    
    /**
     * Safe integer parsing
     */
    parseInt(value) {
        if (!value || value === '') return null;
        const num = parseInt(value, 10);
        return isNaN(num) ? null : num;
    }
    
    /**
     * Sanitize string input
     */
    sanitizeString(value) {
        if (!value) return null;
        return value.trim().substring(0, 500); // Limit length
    }
    
    /**
     * Set loading state for the application
     */
    setLoadingState(loading) {
        this.isLoading = loading;
        
        const submitBtn = document.querySelector('#health-form button[type="submit"]');
        if (submitBtn) {
            if (loading) {
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<i data-lucide="loader-2" class="w-4 h-4 mr-2 animate-spin"></i> Speichern...';
            } else {
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<i data-lucide="save" class="w-4 h-4 mr-2"></i> Speichern';
            }
            
            // Re-initialize lucide icons
            if (typeof lucide !== 'undefined') {
                lucide.createIcons();
            }
        }
    }
    
    /**
     * Show toast notification
     */
    /**
 * Erweiterte Toast-Funktion für Notifikationen unten rechts
 */
showToast(message, type = 'info', duration = 4000, options = {}) {
    try {
        // Toast Container finden oder erstellen
        let toastContainer = document.getElementById('toast-container');
        if (!toastContainer) {
            toastContainer = document.createElement('div');
            toastContainer.id = 'toast-container';
            toastContainer.className = 'toast toast-end toast-bottom z-50 space-y-2';
            document.body.appendChild(toastContainer);
        }

        // Toast Element erstellen
        const toast = document.createElement('div');
        const toastId = 'toast-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
        toast.id = toastId;
        
        // Type-spezifische Klassen und Icons
        const typeConfig = {
            success: {
                alertClass: 'alert-success',
                icon: 'check-circle',
                bgClass: 'bg-success',
                textClass: 'text-success-content'
            },
            error: {
                alertClass: 'alert-error', 
                icon: 'x-circle',
                bgClass: 'bg-error',
                textClass: 'text-error-content'
            },
            warning: {
                alertClass: 'alert-warning',
                icon: 'alert-triangle', 
                bgClass: 'bg-warning',
                textClass: 'text-warning-content'
            },
            info: {
                alertClass: 'alert-info',
                icon: 'info',
                bgClass: 'bg-info', 
                textClass: 'text-info-content'
            }
        };

        const config = typeConfig[type] || typeConfig.info;
        
        // Enhanced Toast HTML
        toast.className = `alert ${config.alertClass} shadow-lg backdrop-blur-sm border border-base-300/50 transform transition-all duration-300 ease-in-out translate-x-full opacity-0 min-w-80 max-w-96`;
        
        toast.innerHTML = `
            <div class="flex items-start gap-3 w-full">
                <i data-lucide="${config.icon}" class="w-5 h-5 flex-shrink-0 mt-0.5"></i>
                <div class="flex-1 min-w-0">
                    <div class="font-medium text-sm leading-tight">${message}</div>
                    ${options.subtitle ? `<div class="text-xs opacity-80 mt-1">${options.subtitle}</div>` : ''}
                </div>
                ${options.closable !== false ? `
                    <button class="btn btn-ghost btn-xs btn-circle ml-2 opacity-70 hover:opacity-100" onclick="this.closest('.alert').remove()">
                        <i data-lucide="x" class="w-3 h-3"></i>
                    </button>
                ` : ''}
            </div>
            ${options.progress !== false && duration > 0 ? `
                <div class="absolute bottom-0 left-0 h-1 bg-base-content/20 w-full rounded-b-lg overflow-hidden">
                    <div class="h-full ${config.bgClass} opacity-50 transition-all duration-${duration} ease-linear" 
                         style="width: 100%; animation: progress-shrink ${duration}ms linear;"></div>
                </div>
            ` : ''}
        `;

        // Toast zum Container hinzufügen
        toastContainer.appendChild(toast);

        // Icons initialisieren
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }

        // Slide-in Animation
        requestAnimationFrame(() => {
            toast.classList.remove('translate-x-full', 'opacity-0');
            toast.classList.add('translate-x-0', 'opacity-100');
        });

        // Auto-remove nach Duration
        let autoRemoveTimer;
        if (duration > 0) {
            autoRemoveTimer = setTimeout(() => {
                this.removeToast(toastId);
            }, duration);
        }

        // Click Handler für manuelle Entfernung
        toast.addEventListener('click', (e) => {
            if (!e.target.closest('button')) {
                this.removeToast(toastId);
                if (autoRemoveTimer) clearTimeout(autoRemoveTimer);
            }
        });

        // Hover: Animation pausieren
        if (duration > 0) {
            toast.addEventListener('mouseenter', () => {
                const progressBar = toast.querySelector('[style*="animation"]');
                if (progressBar) {
                    progressBar.style.animationPlayState = 'paused';
                }
                if (autoRemoveTimer) {
                    clearTimeout(autoRemoveTimer);
                }
            });

            toast.addEventListener('mouseleave', () => {
                const progressBar = toast.querySelector('[style*="animation"]');
                if (progressBar) {
                    progressBar.style.animationPlayState = 'running';
                }
                const remainingTime = duration; // Vereinfacht, könnte berechnet werden
                autoRemoveTimer = setTimeout(() => {
                    this.removeToast(toastId);
                }, remainingTime);
            });
        }

        // Sound-Feedback (optional)
        if (options.sound !== false && localStorage.getItem('soundFeedback') === 'true') {
            this.playNotificationSound(type);
        }

        // Haptic Feedback
        if (navigator.vibrate && localStorage.getItem('hapticFeedback') === 'true') {
            const vibrationPattern = {
                success: [50, 30, 50],
                error: [100, 50, 100],
                warning: [80],
                info: [30]
            };
            navigator.vibrate(vibrationPattern[type] || [30]);
        }

        // Max Toasts Limit (verhindert Spam)
        this.limitToastCount();

        console.log(`📢 Toast angezeigt: ${type} - ${message}`);
        return toastId;

    } catch (error) {
        console.error('❌ Toast Error:', error);
        // Fallback: Nativer Alert
        alert(`${type.toUpperCase()}: ${message}`);
    }
}

/**
 * Toast entfernen mit Animation
 */
removeToast(toastId) {
    const toast = document.getElementById(toastId);
    if (toast) {
        // Slide-out Animation
        toast.classList.add('translate-x-full', 'opacity-0');
        
        setTimeout(() => {
            toast.remove();
        }, 300);
    }
}

/**
 * Begrenze Anzahl der gleichzeitigen Toasts
 */
limitToastCount(maxToasts = 5) {
    const container = document.getElementById('toast-container');
    if (container) {
        const toasts = container.querySelectorAll('.alert');
        if (toasts.length > maxToasts) {
            // Älteste Toasts entfernen
            for (let i = 0; i < toasts.length - maxToasts; i++) {
                this.removeToast(toasts[i].id);
            }
        }
    }
}

/**
 * Notification Sound abspielen
 */
playNotificationSound(type) {
    try {
        // Web Audio API Context
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        const frequencies = {
            success: [523, 659, 784], // C-E-G Major Chord
            error: [220, 277, 330],   // A-C#-E Minor Chord  
            warning: [440, 554],      // A-C# 
            info: [440]               // A
        };

        const freqs = frequencies[type] || frequencies.info;
        
        freqs.forEach((freq, index) => {
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.setValueAtTime(freq, audioContext.currentTime);
            oscillator.type = 'sine';
            
            gainNode.gain.setValueAtTime(0, audioContext.currentTime);
            gainNode.gain.linearRampToValueAtTime(0.1, audioContext.currentTime + 0.01);
            gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.3);
            
            oscillator.start(audioContext.currentTime + index * 0.1);
            oscillator.stop(audioContext.currentTime + 0.3 + index * 0.1);
        });
        
    } catch (error) {
        console.warn('Sound playback not supported:', error);
    }
}
    
    /**
     * Populate goals form with current values
     */
    populateGoalsForm() {
        const goalsForm = document.getElementById('goals-form');
        if (!goalsForm) return;
        
        Object.entries(this.goals).forEach(([key, value]) => {
            const input = goalsForm.querySelector(`[name="${key}"]`);
            if (input && value !== null) {
                input.value = value;
            }
        });
    }
    
    /**
     * Validate individual form input
     */
    validateFormInput(input) {
        // Remove previous error states
        input.classList.remove('input-error');
        
        const value = input.value.trim();
        let isValid = true;
        
        // Specific validations based on input name
        switch (input.name) {
            case 'weight':
                if (value && (parseFloat(value) < 20 || parseFloat(value) > 500)) {
                    isValid = false;
                }
                break;
            case 'steps':
                if (value && parseInt(value) < 0) {
                    isValid = false;
                }
                break;
            case 'waterIntake':
                if (value && (parseFloat(value) < 0 || parseFloat(value) > 10)) {
                    isValid = false;
                }
                break;
            case 'sleepHours':
                if (value && (parseFloat(value) < 0 || parseFloat(value) > 24)) {
                    isValid = false;
                }
                break;
        }
        
        if (!isValid) {
            input.classList.add('input-error');
        }
    }
    
    /**
     * Dispatch custom health data events
     */
    dispatchHealthDataEvent(eventName, data) {
        const event = new CustomEvent(eventName, {
            detail: data,
            bubbles: true
        });
        document.dispatchEvent(event);
    }
    
    // ====================================================================
    // LOCAL STORAGE MANAGEMENT
    // ====================================================================
    
    /**
 * Save data to localStorage
 */
async saveToLocalStorage(data) {
    try {
        const existingData = JSON.parse(localStorage.getItem('healthData') || '[]');
        
        // KRITISCHER FIX: Sicherstellen dass date als String gespeichert wird
        const dataWithMetadata = {
            ...data,
            date: typeof data.date === 'string' ? data.date : data.date.toISOString().split('T')[0],
            _localId: 'local_' + Date.now(),
            _synced: false,
            _createdAt: new Date().toISOString()
        };
        
        console.log('💾 SAVING TO LOCALSTORAGE:', dataWithMetadata);
        
        existingData.push(dataWithMetadata);
        
        // Keep only last 100 entries
        const trimmedData = existingData.slice(-100);
        localStorage.setItem('healthData', JSON.stringify(trimmedData));
        
        console.log('✅ SAVED TO LOCALSTORAGE. Total entries:', trimmedData.length);
        
    } catch (error) {
        console.error('❌ localStorage Fehler:', error);
        throw error;
    }
}
    
    /**
     * Mark data as synced
     */
    async markAsSynced(data) {
        try {
            const existingData = JSON.parse(localStorage.getItem('healthData') || '[]');
            const updatedData = existingData.map(item => {
                if (item._localId === data._localId) {
                    return { ...item, _synced: true };
                }
                return item;
            });
            
            localStorage.setItem('healthData', JSON.stringify(updatedData));
        } catch (error) {
            console.error('❌ Fehler beim Markieren als synchronisiert:', error);
        }
    }
    
    /**
     * Mark data for later sync
     */
    async markForSync(data) {
        // Data is already marked for sync when saved to localStorage
        // This is a placeholder for additional sync logic if needed
    }
    
    /**
     * Get unsynced data for server synchronization
     */
    getUnsyncedData() {
        try {
            const allData = JSON.parse(localStorage.getItem('healthData') || '[]');
            return allData.filter(item => !item._synced);
        } catch (error) {
            console.error('❌ Fehler beim Abrufen unsyncer Daten:', error);
            return [];
        }
    }

    /**
 * Initialize form with today's date
 */
initializeFormDefaults() {
    const dateInput = document.getElementById('date');
    if (dateInput) {
        const today = new Date();
        const todayStr = today.getFullYear() + '-' + 
                        String(today.getMonth() + 1).padStart(2, '0') + '-' + 
                        String(today.getDate()).padStart(2, '0');
        
        dateInput.value = todayStr;
        console.log('📅 Formular-Datum initialisiert:', todayStr);
    }
}

    /**
     * Update footer statistics
     */
    async updateFooterStats() {
        try {
            const allData = await this.getAllHealthData();
            const todayData = this.getTodayData(allData);
            const weekData = this.getWeekData(allData);
            
            // Today entries count
            const todayEntries = allData.filter(entry => {
                const today = new Date().toISOString().split('T')[0];
                return entry.date === today;
            }).length;
            
            // Goals achieved today
            let goalsAchieved = 0;
            if (todayData.steps >= this.goals.stepsGoal) goalsAchieved++;
            if (todayData.waterIntake >= this.goals.waterGoal) goalsAchieved++;
            if (todayData.sleepHours >= this.goals.sleepGoal) goalsAchieved++;
            if (this.goals.weightGoal && Math.abs(todayData.weight - this.goals.weightGoal) <= this.goals.weightGoal * 0.05) goalsAchieved++;
            
            // Calculate streak
            const streak = this.calculateCurrentStreak(allData);
            
            // Update DOM
            const todayEl = document.getElementById('footer-today-entries');
            const weekEl = document.getElementById('footer-week-entries');
            const goalsEl = document.getElementById('footer-goals-achieved');
            const streakEl = document.getElementById('footer-current-streak');
            
            if (todayEl) todayEl.textContent = todayEntries;
            if (weekEl) weekEl.textContent = weekData.length;
            if (goalsEl) goalsEl.textContent = goalsAchieved;
            if (streakEl) streakEl.textContent = streak;
            
        } catch (error) {
            console.error('Footer stats update error:', error);
        }
    }

    /**
     * Calculate current tracking streak
     */
    calculateCurrentStreak(allData) {
        if (!allData || allData.length === 0) return 0;
        
        let streak = 0;
        const today = new Date();
        
        for (let i = 0; i < 365; i++) { // Max 1 year streak
            const checkDate = new Date(today.getTime() - (i * 24 * 60 * 60 * 1000));
            const dateStr = checkDate.toISOString().split('T')[0];
            
            const hasEntry = allData.some(entry => entry.date === dateStr);
            
            if (hasEntry) {
                streak++;
            } else {
                break;
            }
        }
        
        return streak;
    }

    /**
     * Update footer connection status
     */
    updateFooterConnectionStatus() {
        const statusEl = document.getElementById('footer-connection-status');
        if (statusEl) {
            const isOnline = navigator.onLine;
            statusEl.innerHTML = `
                <div class="w-2 h-2 ${isOnline ? 'bg-success' : 'bg-warning'} rounded-full animate-pulse"></div>
                <span class="text-xs">${isOnline ? 'Online' : 'Offline'}</span>
            `;
            statusEl.className = `badge badge-ghost gap-1 ${isOnline ? '' : 'badge-warning'}`;
        }
    }

        /** * Initialize footer functionality */
    initializeFooter() {
        console.log('👣 Initializing footer functionality');
        
        // Update footer stats
        this.updateFooterStats();
        
        // Update stats every 30 seconds
        setInterval(() => this.updateFooterStats(), 30000);
        
        // Footer theme toggle
        const footerThemeToggle = document.getElementById('footer-theme-toggle');
        if (footerThemeToggle) {
            footerThemeToggle.addEventListener('click', () => {
                const mainThemeToggle = document.getElementById('theme-toggle');
                if (mainThemeToggle) {
                    mainThemeToggle.click();
                }
            });
        }
        
        // Update connection status in footer
        this.updateFooterConnectionStatus();
        window.addEventListener('online', () => this.updateFooterConnectionStatus());
        window.addEventListener('offline', () => this.updateFooterConnectionStatus());
    }

    /** * Update footer statistics */
    async updateFooterStats() {
        try {
            const allData = await this.getAllHealthData();
            const todayData = this.getTodayData(allData);
            const weekData = this.getWeekData(allData);
            
            // Today entries count
            const today = new Date().toISOString().split('T')[0];
            const todayEntries = allData.filter(entry => {
                const entryDate = typeof entry.date === 'string' ? entry.date.split('T')[0] : entry.date;
                return entryDate === today;
            }).length;
            
            // Goals achieved today
            let goalsAchieved = 0;
            if (todayData.steps >= this.goals.stepsGoal) goalsAchieved++;
            if (todayData.waterIntake >= this.goals.waterGoal) goalsAchieved++;
            if (todayData.sleepHours >= this.goals.sleepGoal) goalsAchieved++;
            if (this.goals.weightGoal && Math.abs(todayData.weight - this.goals.weightGoal) <= this.goals.weightGoal * 0.05) goalsAchieved++;
            
            // Calculate streak
            const streak = this.calculateCurrentStreak(allData);
            
            // Update DOM
            const todayEl = document.getElementById('footer-today-entries');
            const weekEl = document.getElementById('footer-week-entries');
            const goalsEl = document.getElementById('footer-goals-achieved');
            const streakEl = document.getElementById('footer-current-streak');
            
            if (todayEl) todayEl.textContent = todayEntries;
            if (weekEl) weekEl.textContent = weekData.length;
            if (goalsEl) goalsEl.textContent = goalsAchieved;
            if (streakEl) streakEl.textContent = streak;
        } catch (error) {
            console.error('Footer stats update error:', error);
        }
    }

    /** * Update footer connection status */
    updateFooterConnectionStatus() {
        const statusEl = document.getElementById('footer-connection-status');
        if (statusEl) {
            const isOnline = navigator.onLine;
            statusEl.innerHTML = `${isOnline ? '🌐 Online' : '📵 Offline'}`;
            statusEl.className = `badge badge-ghost gap-1 ${isOnline ? '' : 'badge-warning'}`;
        }
    }

            /** 
 * Initialize Analytics Event Listeners through HealthTracker 
 * Optimierte Version mit verbessertem Error Handling
 */
initializeAnalyticsEventListeners() {
    try {
        console.log('📊 Initializing analytics event listeners...');
        
        // Check if analytics engine exists
        if (!this.analyticsEngine) {
            console.log('⚠️ Analytics engine not available yet, retrying...');
            setTimeout(() => this.initializeAnalyticsEventListeners(), 1000);
            return;
        }

        // Current state tracking
        this.currentAnalyticsPeriod = 14; // Default 14 days
        this.currentMetricFilter = 'all'; // Default all metrics
        
        // Period filter buttons - Verbesserte Implementation
        document.querySelectorAll('[data-period]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const button = e.target.closest('[data-period]');
                
                try {
                    // Update active state
                    document.querySelectorAll('[data-period]').forEach(b => {
                        b.classList.remove('btn-primary', 'active');
                        b.classList.add('btn-outline');
                    });
                    button.classList.remove('btn-outline');
                    button.classList.add('btn-primary', 'active');
                    
                    // Trigger analytics update through AnalyticsEngine
                    const period = parseInt(button.dataset.period);
                    console.log('📊 Updating analytics period to:', period, 'days');
                    
                    // Store current period
                    this.currentAnalyticsPeriod = period;
                    
                    // Check if method exists
                    if (typeof this.analyticsEngine.updateAnalyticsPeriod === 'function') {
                        this.analyticsEngine.updateAnalyticsPeriod(period);
                    } else {
                        // Fallback: Manual data filtering
                        console.log('📊 Using fallback period update');
                        this.handlePeriodChange(period);
                    }
                    
                } catch (error) {
                    console.error('❌ Period change error:', error);
                    this.showToast('⚠️ Fehler beim Ändern des Zeitraums', 'warning');
                }
            });
        });

        // Metric selection buttons - Verbesserte Implementation
        document.querySelectorAll('.metric-tab[data-metric]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const button = e.target.closest('.metric-tab');
                
                try {
                    // Update tab states
                    document.querySelectorAll('.metric-tab').forEach(b => {
                        b.classList.remove('tab-active');
                    });
                    button.classList.add('tab-active');
                    
                    // Get metric and label
                    const metric = button.dataset.metric;
                    const label = button.dataset.label || button.textContent.trim();
                    
                    console.log('📈 Updating trends chart for metric:', metric);
                    
                    // Store current metric
                    this.currentMetricFilter = metric;
                    
                    // Update title
                    const titleElement = document.getElementById('trends-title');
                    if (titleElement) {
                        titleElement.textContent = `${label} Trends`;
                    }
                    
                    // Update chart through AnalyticsEngine
                    if (typeof this.analyticsEngine.updateTrendsChart === 'function') {
                        // Filter data based on current period
                        const filteredData = this.getFilteredHealthData(this.currentAnalyticsPeriod);
                        this.analyticsEngine.updateTrendsChart(filteredData);
                    } else {
                        console.warn('⚠️ updateTrendsChart method not available');
                        this.showToast('📊 Chart-Update nicht verfügbar', 'warning');
                    }
                    
                } catch (error) {
                    console.error('❌ Metric change error:', error);
                    this.showToast('⚠️ Fehler beim Ändern der Metrik', 'warning');
                }
            });
        });

        // Dropdown Filter Integration
        document.querySelectorAll('.metric-filter-btn[data-metric]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const button = e.target.closest('.metric-filter-btn');
                
                try {
                    // Update active states
                    document.querySelectorAll('.metric-filter-btn').forEach(b => {
                        b.classList.remove('active');
                        b.removeAttribute('data-active');
                    });
                    button.classList.add('active');
                    button.setAttribute('data-active', 'true');
                    
                    // Apply filter
                    const metric = button.dataset.metric;
                    this.applyMetricFilter(metric);
                    
                    // Close dropdown
                    const dropdown = button.closest('.dropdown');
                    if (dropdown) {
                        dropdown.removeAttribute('open');
                        const toggle = dropdown.querySelector('[tabindex]');
                        if (toggle) toggle.blur();
                    }
                    
                } catch (error) {
                    console.error('❌ Filter error:', error);
                }
            });
        });

        // Retry Button Integration
        const retryBtn = document.getElementById('trends-retry-btn');
        if (retryBtn) {
            retryBtn.addEventListener('click', () => this.retryTrendsLoad());
        }

        // Export Button Integration
        const exportBtn = document.getElementById('export-chart-btn');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.exportTrendsChart());
        }

        console.log('✅ Analytics event listeners initialized successfully');
        
        // Initial state setup
        this.setInitialAnalyticsState();
        
    } catch (error) {
        console.error('❌ Analytics event listeners initialization failed:', error);
        this.showToast('⚠️ Analytics-Features teilweise nicht verfügbar', 'warning');
    }
}

/**
 * Set Initial Analytics State
 */
setInitialAnalyticsState() {
    try {
        // Set default period button as active
        const defaultPeriodBtn = document.querySelector('[data-period="14"]');
        if (defaultPeriodBtn) {
            defaultPeriodBtn.classList.add('btn-primary', 'active');
            defaultPeriodBtn.classList.remove('btn-outline');
        }

        // Set default metric tab as active
        const defaultMetricTab = document.querySelector('.metric-tab[data-metric="all"]');
        if (defaultMetricTab) {
            defaultMetricTab.classList.add('tab-active');
        }

        // Update data count
        this.updateTrendsDataCount();

    } catch (error) {
        console.error('❌ Initial state setup error:', error);
    }
}

/**
 * Get Filtered Health Data
 */
getFilteredHealthData(days = 14) {
    try {
        if (!this.healthData || !Array.isArray(this.healthData)) {
            return [];
        }

        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);

        return this.healthData.filter(item => {
            const itemDate = new Date(item.date);
            return itemDate >= cutoffDate;
        }).sort((a, b) => new Date(a.date) - new Date(b.date));

    } catch (error) {
        console.error('❌ Data filtering error:', error);
        return [];
    }
}

/**
 * Apply Metric Filter
 */
applyMetricFilter(metric) {
    try {
        this.currentMetricFilter = metric;
        
        // Update chart with current filter
        const filteredData = this.getFilteredHealthData(this.currentAnalyticsPeriod);
        
        if (this.analyticsEngine && typeof this.analyticsEngine.updateTrendsChart === 'function') {
            this.analyticsEngine.updateTrendsChart(filteredData);
        }
        
        // Update UI elements
        this.updateMetricFilterUI(metric);
        
    } catch (error) {
        console.error('❌ Metric filter error:', error);
    }
}

/**
 * Update Metric Filter UI
 */
updateMetricFilterUI(metric) {
    try {
        const labels = {
            'all': 'Alle Metriken',
            'steps': 'Schritte',
            'waterIntake': 'Wasser',
            'sleepHours': 'Schlaf',
            'weight': 'Gewicht'
        };

        // Update title
        const titleElement = document.getElementById('trends-title');
        if (titleElement) {
            titleElement.textContent = `${labels[metric] || 'Trends'} & Entwicklung`;
        }

        // Update active tab
        document.querySelectorAll('.metric-tab').forEach(tab => {
            tab.classList.remove('tab-active');
            if (tab.dataset.metric === metric) {
                tab.classList.add('tab-active');
            }
        });

    } catch (error) {
        console.error('❌ UI update error:', error);
    }
}

/**
 * Update Trends Data Count
 */
updateTrendsDataCount() {
    try {
        const dataCountElement = document.getElementById('trends-data-count');
        if (dataCountElement && this.healthData) {
            const count = this.healthData.length;
            const days = count > 0 ? Math.min(count, this.currentAnalyticsPeriod) : 0;
            dataCountElement.textContent = `${days} Tage`;
        }
    } catch (error) {
        console.error('❌ Data count update error:', error);
    }
}

/**
 * Retry Trends Load
 */
async retryTrendsLoad() {
    try {
        console.log('🔄 Retrying trends load...');
        this.showTrendsLoading();
        
        // Reload data
        await this.loadHealthData();
        
        // Update analytics
        if (this.analyticsEngine) {
            await this.analyticsEngine.updateAllAnalytics();
        }
        
        this.showToast('✅ Trends erfolgreich aktualisiert', 'success');
        
    } catch (error) {
        console.error('❌ Retry failed:', error);
        this.showTrendsError('Wiederholung fehlgeschlagen');
        this.showToast('❌ Aktualisierung fehlgeschlagen', 'error');
    }
}

    // === MEHR-MENÜ FUNKTIONEN ===
showImportExport() {
    console.log('📥 Import/Export Dialog wird geöffnet');
    const modal = document.createElement('div');
    modal.className = 'modal modal-open';
    modal.innerHTML = `
        <div class="modal-box max-w-2xl">
            <h3 class="font-bold text-lg mb-4">📥 Daten Import/Export</h3>
            
            <div class="tabs tabs-bordered mb-4">
                <a class="tab tab-active" onclick="this.parentNode.querySelector('.tab-active').classList.remove('tab-active'); this.classList.add('tab-active'); document.getElementById('export-tab').style.display='block'; document.getElementById('import-tab').style.display='none'">Export</a>
                <a class="tab" onclick="this.parentNode.querySelector('.tab-active').classList.remove('tab-active'); this.classList.add('tab-active'); document.getElementById('import-tab').style.display='block'; document.getElementById('export-tab').style.display='none'">Import</a>
            </div>

            <div id="export-tab">
                <p class="mb-4">Exportiere deine Gesundheitsdaten als JSON-Datei:</p>
                <button class="btn btn-primary mb-4" onclick="healthTracker.exportData()">📤 Daten exportieren</button>
            </div>

            <div id="import-tab" style="display:none">
                <p class="mb-4">Importiere deine Gesundheitsdaten aus einer JSON-Datei:</p>
                <input type="file" class="file-input file-input-bordered w-full mb-4" id="import-file" accept=".json">
                <button class="btn btn-primary" onclick="healthTracker.importData()">📥 Daten importieren</button>
            </div>

            <div class="modal-action">
                <button class="btn" onclick="this.closest('.modal').remove()">Schließen</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

showDataPrivacy() {
    console.log('🔒 Datenschutz-Info wird angezeigt');
    const modal = document.createElement('div');
    modal.className = 'modal modal-open';
    modal.innerHTML = `
        <div class="modal-box max-w-2xl">
            <h3 class="font-bold text-lg mb-4">🔒 Datenschutz</h3>
            <div class="prose max-w-none">
                <h4>Deine Daten sind sicher</h4>
                <ul>
                    <li>Alle Gesundheitsdaten werden lokal auf deinem Gerät gespeichert</li>
                    <li>Synchronisation erfolgt verschlüsselt über sichere Verbindungen</li>
                    <li>Keine Weitergabe an Dritte</li>
                    <li>Du behältst die vollständige Kontrolle über deine Daten</li>
                </ul>
                <h4>Offline-First Ansatz</h4>
                <p>Die App funktioniert vollständig offline und synchronisiert nur bei verfügbarer Internetverbindung.</p>
            </div>
            <div class="modal-action">
                <button class="btn" onclick="this.closest('.modal').remove()">Verstanden</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

/**
 * Zeige erweiterte App-Informationen mit verbesserter UX
 */
showAbout() {
    console.log('ℹ️ Über die App wird angezeigt');
    
    // Prüfe ob bereits ein About-Modal existiert
    const existingModal = document.querySelector('.about-modal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // Sammle dynamische App-Statistiken
    const appStats = this.getAppStats();
    const buildInfo = this.getBuildInfo();
    
    const modal = document.createElement('div');
    modal.className = 'modal modal-open about-modal';
    modal.innerHTML = `
        <div class="modal-box max-w-4xl">
            <!-- Header mit Animation -->
            <div class="flex items-center gap-3 mb-6">
                <div class="avatar placeholder">
                    <div class="bg-gradient-to-br from-primary to-secondary text-primary-content rounded-xl w-12 h-12">
                        <i data-lucide="activity" class="w-6 h-6"></i>
                    </div>
                </div>
                <div>
                    <h3 class="font-bold text-2xl bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                        Health Tracker Pro
                    </h3>
                    <p class="text-sm text-base-content/70">Progressive Web Application</p>
                </div>
            </div>
            
            <!-- Tabs für verschiedene Infobereiche -->
            <div class="tabs tabs-lifted mb-4">
                <a class="tab tab-active" data-about-tab="overview">📊 Übersicht</a>
                <a class="tab" data-about-tab="features">🚀 Features</a>
                <a class="tab" data-about-tab="stats">📈 Statistiken</a>
                <a class="tab" data-about-tab="tech">⚡ Technologie</a>
            </div>
            
            <!-- Tab Content Container -->
            <div class="tab-content min-h-[400px]">
                <!-- Overview Tab -->
                <div id="about-overview" class="tab-panel block">
                    <div class="grid md:grid-cols-2 gap-6">
                        <div class="card bg-base-200">
                            <div class="card-body">
                                <h4 class="card-title text-lg flex items-center gap-2">
                                    <i data-lucide="info" class="w-5 h-5"></i>
                                    App-Informationen
                                </h4>
                                <div class="space-y-2">
                                    <div class="flex justify-between">
                                        <span class="text-base-content/70">Version:</span>
                                        <span class="font-semibold">${buildInfo.version}</span>
                                    </div>
                                    <div class="flex justify-between">
                                        <span class="text-base-content/70">Build:</span>
                                        <span class="font-mono text-xs">${buildInfo.buildDate}</span>
                                    </div>
                                    <div class="flex justify-between">
                                        <span class="text-base-content/70">Typ:</span>
                                        <div class="badge badge-primary badge-sm">PWA</div>
                                    </div>
                                    <div class="flex justify-between">
                                        <span class="text-base-content/70">Status:</span>
                                        <div class="badge badge-success badge-sm">
                                            ${this.isOnline ? '🌐 Online' : '📵 Offline'}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="card bg-base-200">
                            <div class="card-body">
                                <h4 class="card-title text-lg flex items-center gap-2">
                                    <i data-lucide="users" class="w-5 h-5"></i>
                                    Nutzung
                                </h4>
                                <div class="space-y-3">
                                    <div class="stat">
                                        <div class="stat-title text-xs">Tage mit Daten</div>
                                        <div class="stat-value text-2xl">${appStats.totalDays}</div>
                                    </div>
                                    <div class="stat">
                                        <div class="stat-title text-xs">Einträge gesamt</div>
                                        <div class="stat-value text-2xl">${appStats.totalEntries}</div>
                                    </div>
                                    <div class="stat">
                                        <div class="stat-title text-xs">Aktuelle Serie</div>
                                        <div class="stat-value text-2xl">${appStats.currentStreak}</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="mt-6 p-4 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-lg border border-primary/20">
                        <p class="text-center text-base-content/80">
                            <i data-lucide="heart" class="w-4 h-4 inline mr-1 text-red-500"></i>
                            Eine moderne, sichere und benutzerfreundliche Lösung für dein Gesundheitsmanagement.
                        </p>
                    </div>
                </div>
                
                <!-- Features Tab -->
                <div id="about-features" class="tab-panel hidden">
                    <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        ${this.generateFeatureCards()}
                    </div>
                    <div class="mt-6 alert alert-info">
                        <i data-lucide="lightbulb" class="w-5 h-5"></i>
                        <div>
                            <h4 class="font-semibold">Produktivitäts-Tipp</h4>
                            <p class="text-sm">Nutze die Schnellerfassung (Quick Add) für eine effiziente tägliche Dateneingabe!</p>
                        </div>
                    </div>
                </div>
                
                <!-- Stats Tab -->
                <div id="about-stats" class="tab-panel hidden">
                    <div class="stats stats-vertical lg:stats-horizontal shadow w-full mb-6">
                        <div class="stat">
                            <div class="stat-figure text-primary">
                                <i data-lucide="calendar-days" class="w-8 h-8"></i>
                            </div>
                            <div class="stat-title">Installiert seit</div>
                            <div class="stat-value text-lg">${appStats.installDuration}</div>
                            <div class="stat-desc">${appStats.installDate}</div>
                        </div>
                        
                        <div class="stat">
                            <div class="stat-figure text-secondary">
                                <i data-lucide="target" class="w-8 h-8"></i>
                            </div>
                            <div class="stat-title">Ziele erreicht</div>
                            <div class="stat-value text-lg">${appStats.goalsAchieved}</div>
                            <div class="stat-desc">von ${appStats.totalGoals} gesetzt</div>
                        </div>
                        
                        <div class="stat">
                            <div class="stat-figure text-accent">
                                <i data-lucide="database" class="w-8 h-8"></i>
                            </div>
                            <div class="stat-title">Datenspeicher</div>
                            <div class="stat-value text-lg">${appStats.storageSize}</div>
                            <div class="stat-desc">lokal gespeichert</div>
                        </div>
                    </div>
                    
                    <!-- Speicher-Details -->
                    <div class="card bg-base-200">
                        <div class="card-body">
                            <h4 class="card-title flex items-center gap-2">
                                <i data-lucide="hard-drive" class="w-5 h-5"></i>
                                Speicher-Details
                            </h4>
                            <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                                <div class="bg-base-100 p-3 rounded-lg">
                                    <div class="text-2xl font-bold text-primary">${appStats.healthDataSize}</div>
                                    <div class="text-xs text-base-content/70">Gesundheitsdaten</div>
                                </div>
                                <div class="bg-base-100 p-3 rounded-lg">
                                    <div class="text-2xl font-bold text-secondary">${appStats.goalsSize}</div>
                                    <div class="text-xs text-base-content/70">Ziele</div>
                                </div>
                                <div class="bg-base-100 p-3 rounded-lg">
                                    <div class="text-2xl font-bold text-accent">${appStats.settingsSize}</div>
                                    <div class="text-xs text-base-content/70">Einstellungen</div>
                                </div>
                                <div class="bg-base-100 p-3 rounded-lg">
                                    <div class="text-2xl font-bold text-info">${appStats.cacheSize}</div>
                                    <div class="text-xs text-base-content/70">Cache</div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Performance Metriken -->
                    <div class="mt-4 alert alert-success">
                        <i data-lucide="zap" class="w-5 h-5"></i>
                        <div>
                            <h4 class="font-semibold">Performance</h4>
                            <p class="text-sm">App läuft optimal mit ${appStats.totalEntries} Einträgen in ${appStats.storageSize} Speicher.</p>
                        </div>
                    </div>
                </div>
                
                <!-- Tech Tab -->
                <div id="about-tech" class="tab-panel hidden">
                    <div class="space-y-6">
                        <!-- Technologie Stack -->
                        <div class="card bg-base-200">
                            <div class="card-body">
                                <h4 class="card-title flex items-center gap-2">
                                    <i data-lucide="code" class="w-5 h-5"></i>
                                    Technologie-Stack
                                </h4>
                                <div class="grid sm:grid-cols-2 gap-4">
                                    <div>
                                        <h5 class="font-semibold mb-2">Frontend</h5>
                                        <div class="flex flex-wrap gap-1">
                                            <div class="badge badge-outline">Vanilla JavaScript ES6+</div>
                                            <div class="badge badge-outline">HTML5 & CSS3</div>
                                            <div class="badge badge-outline">DaisyUI + Tailwind CSS</div>
                                            <div class="badge badge-outline">Lucide Icons</div>
                                        </div>
                                    </div>
                                    <div>
                                        <h5 class="font-semibold mb-2">Backend & Infrastruktur</h5>
                                        <div class="flex flex-wrap gap-1">
                                            <div class="badge badge-outline">Netlify Functions</div>
                                            <div class="badge badge-outline">MongoDB Atlas</div>
                                            <div class="badge badge-outline">Service Worker</div>
                                            <div class="badge badge-outline">PWA Manifest</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- PWA Features -->
                        <div class="card bg-base-200">
                            <div class="card-body">
                                <h4 class="card-title flex items-center gap-2">
                                    <i data-lucide="smartphone" class="w-5 h-5"></i>
                                    PWA-Features
                                </h4>
                                <div class="grid sm:grid-cols-2 gap-4">
                                    <div class="space-y-2">
                                        <div class="flex items-center gap-2">
                                            <i data-lucide="wifi-off" class="w-4 h-4 text-success"></i>
                                            <span>Offline-First Architecture</span>
                                        </div>
                                        <div class="flex items-center gap-2">
                                            <i data-lucide="download" class="w-4 h-4 text-success"></i>
                                            <span>App-Installation möglich</span>
                                        </div>
                                        <div class="flex items-center gap-2">
                                            <i data-lucide="sync" class="w-4 h-4 text-success"></i>
                                            <span>Automatische Synchronisation</span>
                                        </div>
                                    </div>
                                    <div class="space-y-2">
                                        <div class="flex items-center gap-2">
                                            <i data-lucide="bell" class="w-4 h-4 text-success"></i>
                                            <span>Push-Benachrichtigungen</span>
                                        </div>
                                        <div class="flex items-center gap-2">
                                            <i data-lucide="shield" class="w-4 h-4 text-success"></i>
                                            <span>Sichere Datenhaltung</span>
                                        </div>
                                        <div class="flex items-center gap-2">
                                            <i data-lucide="smartphone" class="w-4 h-4 text-success"></i>
                                            <span>Responsive Design</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- System Requirements -->
                        <div class="card bg-base-200">
                            <div class="card-body">
                                <h4 class="card-title flex items-center gap-2">
                                    <i data-lucide="monitor" class="w-5 h-5"></i>
                                    System-Anforderungen
                                </h4>
                                <div class="grid sm:grid-cols-2 gap-4">
                                    <div>
                                        <h5 class="font-semibold mb-2">Unterstützte Browser</h5>
                                        <ul class="text-sm space-y-1">
                                            <li>• Chrome/Chromium 80+</li>
                                            <li>• Firefox 75+</li>
                                            <li>• Safari 13+</li>
                                            <li>• Edge 80+</li>
                                        </ul>
                                    </div>
                                    <div>
                                        <h5 class="font-semibold mb-2">Geräte</h5>
                                        <ul class="text-sm space-y-1">
                                            <li>• Desktop/Laptop</li>
                                            <li>• Tablets</li>
                                            <li>• Smartphones</li>
                                            <li>• Touch-Geräte</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Browser Support Alert -->
                        <div class="alert alert-info">
                            <i data-lucide="info" class="w-5 h-5"></i>
                            <div>
                                <h4 class="font-semibold">Browser-Kompatibilität</h4>
                                <p class="text-sm">Optimiert für moderne Browser mit PWA-Support. Installation als App möglich.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Action Buttons -->
            <div class="modal-action mt-6">
                <div class="flex flex-wrap gap-2">
                    <button class="btn btn-ghost btn-sm" onclick="healthTracker?.exportAppData?.()">
                        <i data-lucide="download" class="w-4 h-4"></i>
                        Daten exportieren
                    </button>
                    <button class="btn btn-ghost btn-sm" onclick="healthTracker?.showHelp?.()">
                        <i data-lucide="help-circle" class="w-4 h-4"></i>
                        Hilfe
                    </button>
                    <button class="btn btn-primary" onclick="this.closest('.modal').remove()">
                        <i data-lucide="x" class="w-4 h-4"></i>
                        Schließen
                    </button>
                </div>
            </div>
        </div>
        <div class="modal-backdrop" onclick="this.closest('.modal').remove()"></div>
    `;
    
    document.body.appendChild(modal);
    
    // Tab-Funktionalität aktivieren mit Delay für DOM-Aufbau
    setTimeout(() => {
        this.initializeAboutTabsImproved(modal);
        
        // Icons initialisieren
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }, 50);
    
    // Haptic Feedback
    if (navigator.vibrate && localStorage.getItem('hapticFeedback') === 'true') {
        navigator.vibrate(10);
    }
}

/**
 * VERBESSERTE Tab-Funktionalität für About Modal
 */
initializeAboutTabsImproved(modal) {
    console.log('🔧 Initialisiere About Tabs (Improved)');
    
    const tabs = modal.querySelectorAll('[data-about-tab]');
    const panels = modal.querySelectorAll('.tab-panel');
    
    if (tabs.length === 0 || panels.length === 0) {
        console.warn('⚠️ Keine Tabs oder Panels gefunden');
        return;
    }
    
    console.log(`📊 Gefunden: ${tabs.length} Tabs, ${panels.length} Panels`);
    
    function showTab(tabName) {
        console.log(`🔄 Wechsle zu Tab: ${tabName}`);
        
        // Alle Panels verstecken
        panels.forEach(panel => {
            panel.classList.add('hidden');
            panel.classList.remove('block');
        });
        
        // Alle Tabs deaktivieren
        tabs.forEach(tab => {
            tab.classList.remove('tab-active');
        });
        
        // Ziel-Panel anzeigen
        const targetPanel = modal.querySelector(`#about-${tabName}`);
        const targetTab = modal.querySelector(`[data-about-tab="${tabName}"]`);
        
        if (targetPanel && targetTab) {
            targetPanel.classList.remove('hidden');
            targetPanel.classList.add('block');
            targetTab.classList.add('tab-active');
            
            console.log(`✅ Tab ${tabName} aktiviert`);
            
            // Icons neu initialisieren für den angezeigten Panel
            setTimeout(() => {
                if (typeof lucide !== 'undefined') {
                    lucide.createIcons();
                }
            }, 10);
        } else {
            console.error(`❌ Panel oder Tab für ${tabName} nicht gefunden`);
        }
    }
    
    // Event Listeners für Tabs
    tabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
            e.preventDefault();
            const tabName = tab.dataset.aboutTab;
            if (tabName) {
                showTab(tabName);
                
                // Haptic Feedback
                if (navigator.vibrate && localStorage.getItem('hapticFeedback') === 'true') {
                    navigator.vibrate(5);
                }
            }
        });
    });
    
    // Initialer Tab (Overview)
    showTab('overview');
}

/**
 * Generiere Feature-Karten für About Modal
 */
generateFeatureCards() {
    const features = [
        {
            icon: 'activity',
            title: 'Gesundheitstracking',
            description: 'Verfolge Gewicht, Schritte, Wasserzufuhr, Schlaf und Stimmung',
            color: 'text-primary'
        },
        {
            icon: 'target',
            title: 'Ziele setzen',
            description: 'Definiere persönliche Gesundheitsziele und verfolge den Fortschritt',
            color: 'text-secondary'
        },
        {
            icon: 'trending-up',
            title: 'Analytics & Trends',
            description: 'Entdecke Muster und Trends in deinen Gesundheitsdaten',
            color: 'text-accent'
        },
        {
            icon: 'bell',
            title: 'Smart Notifications',
            description: 'Intelligente Erinnerungen für deine Gesundheitsziele',
            color: 'text-info'
        },
        {
            icon: 'wifi-off',
            title: 'Offline-Funktionalität',
            description: 'Funktioniert vollständig offline und synchronisiert automatisch',
            color: 'text-success'
        },
        {
            icon: 'shield-check',
            title: 'Datenschutz',
            description: 'Deine Daten bleiben sicher und privat gespeichert',
            color: 'text-warning'
        }
    ];
    
    return features.map(feature => `
        <div class="card bg-base-200 hover:bg-base-300 transition-colors duration-200">
            <div class="card-body p-4">
                <div class="flex items-start gap-3">
                    <div class="flex-shrink-0">
                        <i data-lucide="${feature.icon}" class="w-6 h-6 ${feature.color}"></i>
                    </div>
                    <div>
                        <h5 class="font-semibold text-sm">${feature.title}</h5>
                        <p class="text-xs text-base-content/70 mt-1">${feature.description}</p>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

/**
 * Sammle App-Statistiken für About Modal
 */
getAppStats() {
    try {
        // Installationsdatum ermitteln
        const installDate = localStorage.getItem('app-install-date') || new Date().toISOString();
        const installDays = Math.floor((Date.now() - new Date(installDate).getTime()) / (1000 * 60 * 60 * 24));
        
        // Storage-Größen berechnen
        const healthData = localStorage.getItem('healthData') || '[]';
        const goalsData = localStorage.getItem('userGoals') || '{}';
        const settingsData = localStorage.getItem('app-settings') || '{}';
        
        const healthDataSize = this.formatBytes(new Blob([healthData]).size);
        const goalsSize = this.formatBytes(new Blob([goalsData]).size);
        const settingsSize = this.formatBytes(new Blob([settingsData]).size);
        const totalSize = this.formatBytes(
            new Blob([healthData]).size + 
            new Blob([goalsData]).size + 
            new Blob([settingsData]).size
        );
        
        // Gesundheitsdaten-Statistiken
        const allData = JSON.parse(healthData);
        const uniqueDates = [...new Set(allData.map(entry => entry.date?.split('T')?.[0] || entry.date))];
        
        // Ziele-Statistiken
        const goals = JSON.parse(goalsData);
        const totalGoals = Object.values(goals).filter(goal => goal && goal !== null).length;
        
        return {
            installDate: new Date(installDate).toLocaleDateString('de-DE'),
            installDuration: installDays === 0 ? 'Heute' : `${installDays} Tage`,
            totalDays: uniqueDates.length,
            totalEntries: allData.length,
            currentStreak: this.calculateCurrentStreak(allData),
            goalsAchieved: this.countAchievedGoals(),
            totalGoals: totalGoals,
            storageSize: totalSize,
            healthDataSize: healthDataSize,
            goalsSize: goalsSize,
            settingsSize: settingsSize,
            cacheSize: this.getCacheSize()
        };
    } catch (error) {
        console.error('❌ Fehler beim Sammeln der App-Statistiken:', error);
        return {
            installDate: 'Unbekannt',
            installDuration: '0 Tage',
            totalDays: 0,
            totalEntries: 0,
            currentStreak: 0,
            goalsAchieved: 0,
            totalGoals: 0,
            storageSize: '0 KB',
            healthDataSize: '0 KB',
            goalsSize: '0 KB',
            settingsSize: '0 KB',
            cacheSize: '0 KB'
        };
    }
}

/**
 * Build-Informationen sammeln
 */
getBuildInfo() {
    return {
        version: '2.0.1',
        buildDate: new Date().toLocaleDateString('de-DE'),
        environment: window.location.hostname.includes('localhost') ? 'Development' : 'Production'
    };
}

/**
 * Formatiere Bytes in lesbare Einheiten
 */
formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

/**
 * Cache-Größe schätzen
 */
getCacheSize() {
    try {
        let totalSize = 0;
        for (let key in localStorage) {
            if (localStorage.hasOwnProperty(key)) {
                totalSize += localStorage[key].length;
            }
        }
        return this.formatBytes(totalSize);
    } catch (error) {
        return '0 KB';
    }
}

/**
 * Zähle erreichte Ziele
 */
countAchievedGoals() {
    try {
        // Implementierung abhängig von der Ziel-Logik
        return 0; // Placeholder
    } catch (error) {
        return 0;
    }
}

showHelp() {
    console.log('❓ Hilfe wird angezeigt');
    const modal = document.createElement('div');
    modal.className = 'modal modal-open';
    modal.innerHTML = `
        <div class="modal-box max-w-3xl">
            <h3 class="font-bold text-lg mb-4">❓ Hilfe & Anleitung</h3>
            <div class="collapse collapse-arrow bg-base-200 mb-2">
                <input type="radio" name="help-accordion" checked="checked" /> 
                <div class="collapse-title text-lg font-medium">📊 Wie tracke ich meine Gesundheitsdaten?</div>
                <div class="collapse-content"> 
                    <p>Verwende die Schnellerfassung im Dashboard oder navigiere zu den spezifischen Bereichen für detaillierte Eingaben.</p>
                </div>
            </div>
            <div class="collapse collapse-arrow bg-base-200 mb-2">
                <input type="radio" name="help-accordion" /> 
                <div class="collapse-title text-lg font-medium">🎯 Wie setze ich Ziele?</div>
                <div class="collapse-content"> 
                    <p>Gehe zum Progress Hub → Ziele und erstelle neue Ziele mit spezifischen Zielvorgaben und Zeiträumen.</p>
                </div>
            </div>
            <div class="collapse collapse-arrow bg-base-200 mb-2">
                <input type="radio" name="help-accordion" /> 
                <div class="collapse-title text-lg font-medium">📈 Wie interpretiere ich die Analytics?</div>
                <div class="collapse-content"> 
                    <p>Das Analytics Dashboard zeigt Trends, Korrelationen und Muster in deinen Daten. Nutze die Filter für spezifische Auswertungen.</p>
                </div>
            </div>
            <div class="modal-action">
                <button class="btn" onclick="this.closest('.modal').remove()">Schließen</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

showSettings() {
    console.log('⚙️ Einstellungen werden geöffnet');
    
    try {
        const modal = document.createElement('div');
        modal.className = 'modal modal-open';
        modal.innerHTML = `
            <div class="modal-box max-w-3xl">
                <h3 class="font-bold text-lg mb-4">
                    <i data-lucide="settings" class="w-6 h-6 inline mr-2"></i>
                    Einstellungen
                </h3>
                
                <div class="tabs tabs-bordered mb-6">
                    <a class="tab tab-active" onclick="this.parentNode.querySelector('.tab-active').classList.remove('tab-active'); this.classList.add('tab-active'); document.getElementById('general-settings').style.display='block'; document.getElementById('privacy-settings').style.display='none'; document.getElementById('notification-settings').style.display='none';">Allgemein</a>
                    <a class="tab" onclick="this.parentNode.querySelector('.tab-active').classList.remove('tab-active'); this.classList.add('tab-active'); document.getElementById('notification-settings').style.display='block'; document.getElementById('general-settings').style.display='none'; document.getElementById('privacy-settings').style.display='none';">Benachrichtigungen</a>
                    <a class="tab" onclick="this.parentNode.querySelector('.tab-active').classList.remove('tab-active'); this.classList.add('tab-active'); document.getElementById('privacy-settings').style.display='block'; document.getElementById('general-settings').style.display='none'; document.getElementById('notification-settings').style.display='none';">Privatsphäre</a>
                </div>

                <!-- Allgemeine Einstellungen -->
                <div id="general-settings" class="space-y-4">

                    <!-- Theme-Auswahl -->
                    <div class="form-control">
                        <label class="label">
                             <span class="label-text flex items-center">
                                <i data-lucide="palette" class="w-4 h-4 mr-2"></i>
                                Theme
                            </span>
                        </label>
                    <div class="join w-full">
                <select class="select select-bordered join-item flex-1" id="theme-selector" onchange="healthTracker.setTheme(this.value)">
                    ${this.getAvailableThemes().map(theme => `
                <option value="${theme.value}" ${document.documentElement.getAttribute('data-theme') === theme.value ? 'selected' : ''}>
                    ${theme.icon} ${theme.name}
                </option>
                    `).join('')}
                </select>
                    <button class="btn btn-outline join-item" onclick="healthTracker.showThemeSelector()">
                    <i data-lucide="eye" class="w-4 h-4"></i>
                    </button>
                </div>
            <label class="label">
                <span class="label-text-alt text-base-content/60">Wähle dein bevorzugtes Design</span>
            </label>
                </div>

                    <div class="form-control">
                        <label class="label cursor-pointer">
                            <span class="label-text flex items-center">
                                <i data-lucide="vibrate" class="w-4 h-4 mr-2"></i>
                                Haptic Feedback aktivieren
                            </span> 
                            <input type="checkbox" class="toggle toggle-primary" id="haptic-toggle" 
                                ${localStorage.getItem('hapticFeedback') === 'true' ? 'checked' : ''} 
                                onchange="healthTracker.toggleHapticFeedback()">
                        </label>
                    </div>

                    <div class="form-control">
                        <label class="label cursor-pointer">
                            <span class="label-text flex items-center">
                                <i data-lucide="gauge" class="w-4 h-4 mr-2"></i>
                                Erweiterte Analytics aktivieren
                            </span> 
                            <input type="checkbox" class="toggle toggle-primary" id="analytics-toggle" 
                                ${localStorage.getItem('advancedAnalytics') === 'true' ? 'checked' : ''} 
                                onchange="healthTracker.toggleAnalytics()">
                        </label>
                    </div>

                    <div class="form-control">
                        <label class="label">
                            <span class="label-text flex items-center">
                                <i data-lucide="globe" class="w-4 h-4 mr-2"></i>
                                Sprache
                            </span>
                        </label>
                        <select class="select select-bordered" id="language-select" onchange="healthTracker.changeLanguage(this.value)">
                            <option value="de" selected>Deutsch</option>
                            <option value="en" disabled>English (Coming soon)</option>
                            <option value="es" disabled>Español (Coming soon)</option>
                        </select>
                    </div>

                    <div class="form-control">
                        <label class="label">
                            <span class="label-text flex items-center">
                                <i data-lucide="calendar" class="w-4 h-4 mr-2"></i>
                                Datumsformat
                            </span>
                        </label>
                        <select class="select select-bordered" id="date-format" onchange="healthTracker.changeDateFormat(this.value)">
                            <option value="DD.MM.YYYY">TT.MM.JJJJ (08.08.2025)</option>
                            <option value="MM/DD/YYYY">MM/DD/YYYY (08/08/2025)</option>
                            <option value="YYYY-MM-DD">YYYY-MM-DD (2025-08-08)</option>
                        </select>
                    </div>

                    <div class="form-control">
                        <label class="label">
                            <span class="label-text flex items-center">
                                <i data-lucide="ruler" class="w-4 h-4 mr-2"></i>
                                Einheitensystem
                            </span>
                        </label>
                        <select class="select select-bordered" id="unit-system" onchange="healthTracker.changeUnitSystem(this.value)">
                            <option value="metric">Metrisch (kg, km, °C)</option>
                            <option value="imperial">Imperial (lbs, mi, °F)</option>
                        </select>
                    </div>
                </div>

                <!-- Benachrichtigungs-Einstellungen -->
                <div id="notification-settings" style="display:none" class="space-y-4">
                    <div class="form-control">
                        <label class="label cursor-pointer">
                            <span class="label-text flex items-center">
                                <i data-lucide="bell" class="w-4 h-4 mr-2"></i>
                                Push-Benachrichtigungen
                            </span> 
                            <input type="checkbox" class="toggle toggle-primary" id="notifications-toggle" 
                                ${this.smartNotificationManager?.isEnabled ? 'checked' : ''} 
                                onchange="healthTracker.toggleNotifications()">
                        </label>
                    </div>

                    <div class="form-control">
                        <label class="label cursor-pointer">
                            <span class="label-text flex items-center">
                                <i data-lucide="droplets" class="w-4 h-4 mr-2"></i>
                                Wassererinnerungen
                            </span> 
                            <input type="checkbox" class="toggle toggle-primary" id="water-reminders" 
                                ${localStorage.getItem('waterReminders') === 'true' ? 'checked' : ''} 
                                onchange="healthTracker.toggleWaterReminders()">
                        </label>
                    </div>

                    <div class="form-control">
                        <label class="label cursor-pointer">
                            <span class="label-text flex items-center">
                                <i data-lucide="footprints" class="w-4 h-4 mr-2"></i>
                                Aktivitätserinnerungen
                            </span> 
                            <input type="checkbox" class="toggle toggle-primary" id="activity-reminders" 
                                ${localStorage.getItem('activityReminders') === 'true' ? 'checked' : ''} 
                                onchange="healthTracker.toggleActivityReminders()">
                        </label>
                    </div>

                    <div class="form-control">
                        <label class="label cursor-pointer">
                            <span class="label-text flex items-center">
                                <i data-lucide="moon" class="w-4 h-4 mr-2"></i>
                                Schlafenserinnerungen
                            </span> 
                            <input type="checkbox" class="toggle toggle-primary" id="sleep-reminders" 
                                ${localStorage.getItem('sleepReminders') === 'true' ? 'checked' : ''} 
                                onchange="healthTracker.toggleSleepReminders()">
                        </label>
                    </div>

                    <div class="form-control">
                        <label class="label">
                            <span class="label-text flex items-center">
                                <i data-lucide="clock" class="w-4 h-4 mr-2"></i>
                                Erinnerungsintervall
                            </span>
                        </label>
                        <select class="select select-bordered" id="reminder-interval" onchange="healthTracker.changeReminderInterval(this.value)">
                            <option value="30">Alle 30 Minuten</option>
                            <option value="60" selected>Stündlich</option>
                            <option value="120">Alle 2 Stunden</option>
                            <option value="240">Alle 4 Stunden</option>
                        </select>
                    </div>

                    <div class="form-control">
                        <label class="label cursor-pointer">
                            <span class="label-text flex items-center">
                                <i data-lucide="volume-x" class="w-4 h-4 mr-2"></i>
                                Stille Stunden aktivieren
                            </span> 
                            <input type="checkbox" class="toggle toggle-primary" id="quiet-hours" 
                                ${localStorage.getItem('quietHours') === 'true' ? 'checked' : ''} 
                                onchange="healthTracker.toggleQuietHours()">
                        </label>
                    </div>

                    <div class="grid grid-cols-2 gap-4" id="quiet-hours-times" ${localStorage.getItem('quietHours') !== 'true' ? 'style="display:none"' : ''}>
                        <div class="form-control">
                            <label class="label">
                                <span class="label-text-alt">Stille Stunden von</span>
                            </label>
                            <input type="time" class="input input-bordered input-sm" id="quiet-start" 
                                value="${localStorage.getItem('quietStart') || '22:00'}" 
                                onchange="healthTracker.setQuietHours()">
                        </div>
                        <div class="form-control">
                            <label class="label">
                                <span class="label-text-alt">bis</span>
                            </label>
                            <input type="time" class="input input-bordered input-sm" id="quiet-end" 
                                value="${localStorage.getItem('quietEnd') || '07:00'}" 
                                onchange="healthTracker.setQuietHours()">
                        </div>
                    </div>
                </div>

                <!-- Privatsphäre-Einstellungen -->
                <div id="privacy-settings" style="display:none" class="space-y-4">
                    <div class="form-control">
                        <label class="label cursor-pointer">
                            <span class="label-text flex items-center">
                                <i data-lucide="shield" class="w-4 h-4 mr-2"></i>
                                Biometrische Entsperrung
                            </span> 
                            <input type="checkbox" class="toggle toggle-primary" id="biometric-lock" 
                                ${localStorage.getItem('biometricLock') === 'true' ? 'checked' : ''} 
                                onchange="healthTracker.toggleBiometricLock()">
                        </label>
                    </div>

                    <div class="form-control">
                        <label class="label cursor-pointer">
                            <span class="label-text flex items-center">
                                <i data-lucide="wifi-off" class="w-4 h-4 mr-2"></i>
                                Nur lokale Datenspeicherung
                            </span> 
                            <input type="checkbox" class="toggle toggle-primary" id="local-only" 
                                ${localStorage.getItem('localOnlyMode') === 'true' ? 'checked' : ''} 
                                onchange="healthTracker.toggleLocalOnlyMode()">
                        </label>
                    </div>

                    <div class="form-control">
                        <label class="label cursor-pointer">
                            <span class="label-text flex items-center">
                                <i data-lucide="eye-off" class="w-4 h-4 mr-2"></i>
                                Anonyme Nutzungsstatistiken
                            </span> 
                            <input type="checkbox" class="toggle toggle-primary" id="analytics-sharing" 
                                ${localStorage.getItem('analyticsSharing') === 'true' ? 'checked' : ''} 
                                onchange="healthTracker.toggleAnalyticsSharing()">
                        </label>
                    </div>

                    <div class="form-control">
                        <label class="label">
                            <span class="label-text flex items-center">
                                <i data-lucide="clock" class="w-4 h-4 mr-2"></i>
                                Automatische Datenbereinigung
                            </span>
                        </label>
                        <select class="select select-bordered" id="data-retention" onchange="healthTracker.changeDataRetention(this.value)">
                            <option value="never">Niemals löschen</option>
                            <option value="365" selected>Nach 1 Jahr</option>
                            <option value="180">Nach 6 Monaten</option>
                            <option value="90">Nach 3 Monaten</option>
                        </select>
                    </div>

                    <div class="divider">Daten-Management</div>

                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <button class="btn btn-outline btn-info" onclick="healthTracker.exportData()">
                            <i data-lucide="download" class="w-4 h-4 mr-2"></i>
                            Daten exportieren
                        </button>
                        <button class="btn btn-outline btn-warning" onclick="healthTracker.showDataUsage()">
                            <i data-lucide="hard-drive" class="w-4 h-4 mr-2"></i>
                            Speicherverbrauch
                        </button>
                        <button class="btn btn-outline btn-warning" onclick="healthTracker.showDataCleanupModal()">
                            <i data-lucide="broom" class="w-4 h-4 mr-2"></i>
                            Daten bereinigen
                        </button>
                    </div>
                </div>

                <div class="divider"></div>
                
                <button class="btn btn-error btn-outline w-full" onclick="healthTracker.resetApp()">
                    <i data-lucide="refresh-ccw" class="w-4 h-4 mr-2"></i>
                    App komplett zurücksetzen
                </button>

                <div class="modal-action">
                    <button class="btn" onclick="healthTracker.closeSettings()">Schließen</button>
                </div>
            </div>
            <div class="modal-backdrop" onclick="healthTracker.closeSettings()"></div>
        `;

        document.body.appendChild(modal);
        
        // Lucide Icons für das Modal neu initialisieren
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }

    } catch (error) {
        console.error('❌ Fehler beim Öffnen der Einstellungen:', error);
        this.showToast('❌ Fehler beim Öffnen der Einstellungen', 'error');
    }
}

closeSettings() {
    const modal = document.querySelector('.modal-open');
    if (modal) modal.remove();
}

toggleHapticFeedback() {
    const enabled = !JSON.parse(localStorage.getItem('hapticFeedback') || 'false');
    localStorage.setItem('hapticFeedback', enabled);
    
    if (enabled && navigator.vibrate) {
        navigator.vibrate(50);
    }
    
    this.showToast(`📳 Haptic Feedback ${enabled ? 'aktiviert' : 'deaktiviert'}`, 'info');
}

toggleAnalytics() {
    const enabled = !JSON.parse(localStorage.getItem('advancedAnalytics') || 'false');
    localStorage.setItem('advancedAnalytics', enabled);
    
    // Visuelles Feedback sofort anzeigen
    const toggle = document.getElementById('analytics-toggle');
    if (toggle) {
        toggle.checked = enabled;
        // Animation für visuelles Feedback
        toggle.parentElement.style.transform = 'scale(1.05)';
        setTimeout(() => {
            toggle.parentElement.style.transform = 'scale(1)';
        }, 200);
    }
    
    // Advanced Analytics Features aktivieren/deaktivieren
    if (enabled) {
        this.enableAdvancedAnalytics();
    } else {
        this.disableAdvancedAnalytics();
    }
    
    this.showToast(`📊 Erweiterte Analytics ${enabled ? 'aktiviert' : 'deaktiviert'}`, 'info');
}

enableAdvancedAnalytics() {
    console.log('📈 Erweiterte Analytics werden aktiviert');
    
    // Erweiterte Features verfügbar machen
    if (this.analyticsEngine) {
        this.analyticsEngine.advancedMode = true;
    }
    
    // UI-Elemente für erweiterte Analytics anzeigen
    this.showAdvancedAnalyticsFeatures();
    
    // Sofortiges Refresh der Analytics
    setTimeout(() => {
        if (this.analyticsEngine && typeof this.analyticsEngine.loadCompleteAnalyticsData === 'function') {
            this.analyticsEngine.loadCompleteAnalyticsData();
        }
    }, 100);
    
    this.showToast('🚀 Erweiterte Analytics aktiviert!', 'success');
}

disableAdvancedAnalytics() {
    console.log('📉 Erweiterte Analytics werden deaktiviert');
    
    // Basis-Modus aktivieren
    if (this.analyticsEngine) {
        this.analyticsEngine.advancedMode = false;
    }
    
    // Erweiterte UI-Elemente ausblenden
    this.hideAdvancedAnalyticsFeatures();
    
    this.showToast('📊 Basis-Analytics aktiviert', 'info');
}

showAdvancedAnalyticsFeatures() {
    console.log('🔧 Aktiviere erweiterte Analytics-Features');
    
    // 1. Erweiterte UI-Elemente einblenden
    const advancedElements = [
        // Erweiterte Buttons und Panels
        '.advanced-analytics',
        '.analytics-tab-advanced',
        // Spezifische Advanced Features
        '#correlation-insights',
        '#ai-predictions',
        '#anomaly-detection',
        '[data-advanced="true"]'
    ];
    
    advancedElements.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        elements.forEach(el => {
            el.classList.remove('hidden');
            el.style.display = 'block';
        });
    });
    
    // 2. Erweiterte Analytics-Tabs hinzufügen
    this.addAdvancedAnalyticsTabs();
    
    // 3. KI-Insights Container erstellen
    this.createAdvancedInsightsContainers();
    
    // 4. Erweiterte Chart-Optionen aktivieren
    this.enableAdvancedChartFeatures();
}

hideAdvancedAnalyticsFeatures() {
    console.log('🔧 Deaktiviere erweiterte Analytics-Features');
    
    // Erweiterte UI-Elemente ausblenden
    const advancedElements = [
        '.advanced-analytics',
        '.analytics-tab-advanced',
        '#correlation-insights .advanced-correlation',
        '#ai-predictions',
        '#anomaly-detection',
        '[data-advanced="true"]'
    ];
    
    advancedElements.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        elements.forEach(el => {
            el.classList.add('hidden');
            el.style.display = 'none';
        });
    });
    
    // Entferne erweiterte Tabs
    const advancedTabs = document.querySelectorAll('.analytics-tab-advanced');
    advancedTabs.forEach(tab => tab.remove());
}

addAdvancedAnalyticsTabs() {
    // Suche das Analytics-Tab-Container
    const tabContainer = document.querySelector('.tabs.tabs-boxed') || 
                        document.querySelector('#analytics .tabs') ||
                        document.querySelector('.analytics-tabs');
    
    if (!tabContainer) {
        console.warn('⚠️ Kein Tab-Container für erweiterte Analytics gefunden');
        return;
    }
    
    // Füge erweiterte Tabs hinzu (falls nicht vorhanden)
    if (!document.querySelector('.analytics-tab-advanced')) {
        const advancedTabs = [
            {
                id: 'predictions-tab',
                icon: 'brain',
                label: 'KI-Vorhersagen',
                action: 'showPredictions'
            },
            {
                id: 'anomalies-tab',
                icon: 'alert-triangle',
                label: 'Anomalien',
                action: 'showAnomalies'
            },
            {
                id: 'correlations-tab',
                icon: 'git-branch',
                label: 'Korrelationen',
                action: 'showCorrelations'
            }
        ];
        
        advancedTabs.forEach(tab => {
            const tabElement = document.createElement('button');
            tabElement.className = 'tab analytics-tab-advanced';
            tabElement.innerHTML = `
                <i data-lucide="${tab.icon}" class="w-4 h-4 mr-1"></i>
                ${tab.label}
            `;
            tabElement.onclick = () => {
                if (typeof this.analyticsEngine[tab.action] === 'function') {
                    this.analyticsEngine[tab.action]();
                }
            };
            tabContainer.appendChild(tabElement);
        });
        
        // Lucide Icons neu initialisieren
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }
}

createAdvancedInsightsContainers() {
    // Erstelle Container für erweiterte Insights
    const analyticsSection = document.getElementById('analytics') || 
                            document.querySelector('.analytics-content');
    
    if (!analyticsSection) return;
    
    // KI-Predictions Container
    if (!document.getElementById('ai-predictions')) {
        const predictionsContainer = document.createElement('div');
        predictionsContainer.id = 'ai-predictions';
        predictionsContainer.className = 'card bg-gradient-to-br from-primary/5 to-secondary/5 border border-primary/20 shadow-xl advanced-analytics';
        predictionsContainer.innerHTML = `
            <div class="card-body p-6">
                <h3 class="card-title text-xl mb-6 flex items-center gap-3">
                    <i data-lucide="brain" class="w-6 h-6 text-primary"></i>
                    KI-Vorhersagen
                    <div class="badge badge-primary badge-sm">Erweitert</div>
                </h3>
                <div id="predictions-content">
                    <div class="text-center py-8">
                        <i data-lucide="brain" class="w-12 h-12 text-primary/30 mx-auto mb-2"></i>
                        <p class="text-base-content/60">KI-Analyse wird geladen...</p>
                    </div>
                </div>
            </div>
        `;
        analyticsSection.appendChild(predictionsContainer);
    }
    
    // Anomaly Detection Container
    if (!document.getElementById('anomaly-detection')) {
        const anomalyContainer = document.createElement('div');
        anomalyContainer.id = 'anomaly-detection';
        anomalyContainer.className = 'card bg-gradient-to-br from-warning/5 to-error/5 border border-warning/20 shadow-xl advanced-analytics';
        anomalyContainer.innerHTML = `
            <div class="card-body p-6">
                <h3 class="card-title text-xl mb-6 flex items-center gap-3">
                    <i data-lucide="alert-triangle" class="w-6 h-6 text-warning"></i>
                    Anomalie-Erkennung
                    <div class="badge badge-warning badge-sm">Erweitert</div>
                </h3>
                <div id="anomaly-content">
                    <div class="alert alert-success">
                        <i data-lucide="check-circle" class="w-5 h-5"></i>
                        <span>Keine Anomalien in den letzten 7 Tagen erkannt</span>
                    </div>
                </div>
            </div>
        `;
        analyticsSection.appendChild(anomalyContainer);
    }
    
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}

enableAdvancedChartFeatures() {
    // Erweiterte Chart-Features aktivieren
    const chartContainers = [
        '#trends-chart-container',
        '#correlation-chart',
        '#heatmap-chart'
    ];
    
    chartContainers.forEach(selector => {
        const container = document.querySelector(selector);
        if (container) {
            // Füge erweiterte Chart-Optionen hinzu
            container.classList.add('advanced-chart-enabled');
            
            // Erweiterte Tooltips
            container.setAttribute('data-advanced', 'true');
        }
    });
    
    console.log('📈 Erweiterte Chart-Features aktiviert');
}

changeLanguage(lang) {
    localStorage.setItem('language', lang);
    this.showToast('🌍 Sprache wird beim nächsten Start angewendet', 'info');
}

changeDateFormat(format) {
    localStorage.setItem('dateFormat', format);
    this.showToast(`📅 Datumsformat auf ${format} geändert`, 'success');
}

changeUnitSystem(system) {
    localStorage.setItem('unitSystem', system);
    this.showToast(`📏 Einheitensystem auf ${system === 'metric' ? 'Metrisch' : 'Imperial'} geändert`, 'success');
}

toggleWaterReminders() {
    const enabled = !JSON.parse(localStorage.getItem('waterReminders') || 'false');
    localStorage.setItem('waterReminders', enabled);
    this.showToast(`💧 Wassererinnerungen ${enabled ? 'aktiviert' : 'deaktiviert'}`, 'info');
}

toggleActivityReminders() {
    const enabled = !JSON.parse(localStorage.getItem('activityReminders') || 'false');
    localStorage.setItem('activityReminders', enabled);
    this.showToast(`👟 Aktivitätserinnerungen ${enabled ? 'aktiviert' : 'deaktiviert'}`, 'info');
}

toggleSleepReminders() {
    const enabled = !JSON.parse(localStorage.getItem('sleepReminders') || 'false');
    localStorage.setItem('sleepReminders', enabled);
    this.showToast(`😴 Schlafenserinnerungen ${enabled ? 'aktiviert' : 'deaktiviert'}`, 'info');
}

changeReminderInterval(minutes) {
    localStorage.setItem('reminderInterval', minutes);
    this.showToast(`⏰ Erinnerungsintervall auf ${minutes} Minuten geändert`, 'success');
}

toggleQuietHours() {
    const enabled = !JSON.parse(localStorage.getItem('quietHours') || 'false');
    localStorage.setItem('quietHours', enabled);
    
    const timesDiv = document.getElementById('quiet-hours-times');
    if (timesDiv) {
        timesDiv.style.display = enabled ? 'grid' : 'none';
    }
    
    this.showToast(`🔇 Stille Stunden ${enabled ? 'aktiviert' : 'deaktiviert'}`, 'info');
}

setQuietHours() {
    const start = document.getElementById('quiet-start')?.value || '22:00';
    const end = document.getElementById('quiet-end')?.value || '07:00';
    
    localStorage.setItem('quietStart', start);
    localStorage.setItem('quietEnd', end);
    
    this.showToast(`🕐 Stille Stunden: ${start} - ${end}`, 'success');
}

async toggleBiometricLock() {
    const enabled = !JSON.parse(localStorage.getItem('biometricLock') || 'false');
    
    if (enabled) {
        // Überprüfen ob WebAuthn verfügbar ist
        if (!window.PublicKeyCredential) {
            this.showToast('⚠️ Biometrische Authentifizierung nicht unterstützt', 'warning');
            return;
        }
        
        try {
            // Vereinfachte WebAuthn-Implementierung
            const credential = await navigator.credentials.create({
                publicKey: {
                    challenge: new Uint8Array(32),
                    rp: { name: "Health Tracker" },
                    user: {
                        id: new TextEncoder().encode("health-user"),
                        name: "health-user",
                        displayName: "Health Tracker User"
                    },
                    pubKeyCredParams: [{alg: -7, type: "public-key"}],
                    authenticatorSelection: {
                        authenticatorAttachment: "platform",
                        userVerification: "required"
                    }
                }
            });
            
            localStorage.setItem('biometricLock', 'true');
            localStorage.setItem('biometricCredential', btoa(JSON.stringify(credential.id)));
            this.showToast('🔐 Biometrische Entsperrung aktiviert', 'success');
            
        } catch (error) {
            console.error('❌ Biometric setup failed:', error);
            this.showToast('❌ Biometrische Einrichtung fehlgeschlagen', 'error');
        }
    } else {
        localStorage.setItem('biometricLock', 'false');
        localStorage.removeItem('biometricCredential');
        this.showToast('🔓 Biometrische Entsperrung deaktiviert', 'info');
    }
}

toggleLocalOnlyMode() {
    const enabled = !JSON.parse(localStorage.getItem('localOnlyMode') || 'false');
    localStorage.setItem('localOnlyMode', enabled);
    this.showToast(`📱 ${enabled ? 'Nur lokale' : 'Cloud-'} Speicherung aktiviert`, 'info');
}

toggleAnalyticsSharing() {
    const enabled = !JSON.parse(localStorage.getItem('analyticsSharing') || 'false');
    localStorage.setItem('analyticsSharing', enabled);
    this.showToast(`📈 Anonyme Statistiken ${enabled ? 'aktiviert' : 'deaktiviert'}`, 'info');
}

changeDataRetention(days) {
    localStorage.setItem('dataRetention', days);
    const text = days === 'never' ? 'niemals löschen' : `nach ${days} Tagen löschen`;
    this.showToast(`🗂️ Datenbereinigung: ${text}`, 'success');
}

/**
 * Zeige erweiterte Speicherverbrauch-Informationen mit verbesserter UX
 */
showDataUsage() {
    try {
        console.log('💾 Zeige Speicherverbrauch-Details');
        
        // Verwende die bereits vorhandene getAppStats Methode
        const appStats = this.getAppStats();
        const storageDetails = this.getStorageDetails();
        
        const modal = document.createElement('div');
        modal.className = 'modal modal-open storage-usage-modal';
        modal.innerHTML = `
            <div class="modal-box max-w-2xl">
                <!-- Header mit verbessertem Design -->
                <div class="flex items-center gap-3 mb-6">
                    <div class="p-2 bg-primary/10 rounded-lg">
                        <i data-lucide="hard-drive" class="w-6 h-6 text-primary"></i>
                    </div>
                    <div>
                        <h3 class="font-bold text-xl">Speicherverbrauch</h3>
                        <p class="text-sm text-base-content/70">Lokale Datenspeicher-Übersicht</p>
                    </div>
                </div>

                <!-- Übersichts-Statistiken -->
                <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div class="stat bg-base-200 rounded-lg p-3">
                        <div class="stat-figure text-primary">
                            <i data-lucide="database" class="w-6 h-6"></i>
                        </div>
                        <div class="stat-title text-xs">Gesamt</div>
                        <div class="stat-value text-lg">${appStats.storageSize}</div>
                    </div>
                    <div class="stat bg-base-200 rounded-lg p-3">
                        <div class="stat-figure text-info">
                            <i data-lucide="activity" class="w-6 h-6"></i>
                        </div>
                        <div class="stat-title text-xs">Einträge</div>
                        <div class="stat-value text-lg">${appStats.totalEntries}</div>
                    </div>
                    <div class="stat bg-base-200 rounded-lg p-3">
                        <div class="stat-figure text-success">
                            <i data-lucide="calendar-days" class="w-6 h-6"></i>
                        </div>
                        <div class="stat-title text-xs">Tage</div>
                        <div class="stat-value text-lg">${appStats.totalDays}</div>
                    </div>
                    <div class="stat bg-base-200 rounded-lg p-3">
                        <div class="stat-figure text-warning">
                            <i data-lucide="target" class="w-6 h-6"></i>
                        </div>
                        <div class="stat-title text-xs">Ziele</div>
                        <div class="stat-value text-lg">${appStats.totalGoals}</div>
                    </div>
                </div>

                <!-- Detaillierte Speicher-Aufschlüsselung -->
                <div class="card bg-base-200 mb-6">
                    <div class="card-body">
                        <h4 class="card-title text-lg mb-4 flex items-center gap-2">
                            <i data-lucide="pie-chart" class="w-5 h-5"></i>
                            Speicher-Aufschlüsselung
                        </h4>
                        
                        <div class="space-y-4">
                            <!-- Gesundheitsdaten -->
                            <div class="flex items-center justify-between p-3 bg-base-100 rounded-lg">
                                <div class="flex items-center gap-3">
                                    <div class="w-3 h-3 bg-primary rounded-full"></div>
                                    <div>
                                        <div class="font-medium">Gesundheitsdaten</div>
                                        <div class="text-xs text-base-content/70">${appStats.totalEntries} Einträge</div>
                                    </div>
                                </div>
                                <div class="text-right">
                                    <div class="font-bold">${appStats.healthDataSize}</div>
                                    <div class="text-xs text-base-content/70">${storageDetails.healthDataPercentage}%</div>
                                </div>
                            </div>

                            <!-- Ziele & Einstellungen -->
                            <div class="flex items-center justify-between p-3 bg-base-100 rounded-lg">
                                <div class="flex items-center gap-3">
                                    <div class="w-3 h-3 bg-secondary rounded-full"></div>
                                    <div>
                                        <div class="font-medium">Ziele & Einstellungen</div>
                                        <div class="text-xs text-base-content/70">Konfiguration & Präferenzen</div>
                                    </div>
                                </div>
                                <div class="text-right">
                                    <div class="font-bold">${appStats.goalsSize}</div>
                                    <div class="text-xs text-base-content/70">${storageDetails.goalsPercentage}%</div>
                                </div>
                            </div>

                            <!-- App-Einstellungen -->
                            <div class="flex items-center justify-between p-3 bg-base-100 rounded-lg">
                                <div class="flex items-center gap-3">
                                    <div class="w-3 h-3 bg-accent rounded-full"></div>
                                    <div>
                                        <div class="font-medium">App-Einstellungen</div>
                                        <div class="text-xs text-base-content/70">Theme, Notifications, etc.</div>
                                    </div>
                                </div>
                                <div class="text-right">
                                    <div class="font-bold">${appStats.settingsSize}</div>
                                    <div class="text-xs text-base-content/70">${storageDetails.settingsPercentage}%</div>
                                </div>
                            </div>

                            <!-- Cache & Temporäre Daten -->
                            <div class="flex items-center justify-between p-3 bg-base-100 rounded-lg">
                                <div class="flex items-center gap-3">
                                    <div class="w-3 h-3 bg-info rounded-full"></div>
                                    <div>
                                        <div class="font-medium">Cache & Temporäre Daten</div>
                                        <div class="text-xs text-base-content/70">Browser-Cache, Bilder, etc.</div>
                                    </div>
                                </div>
                                <div class="text-right">
                                    <div class="font-bold">${appStats.cacheSize}</div>
                                    <div class="text-xs text-base-content/70">${storageDetails.cachePercentage}%</div>
                                </div>
                            </div>
                        </div>

                        <!-- Visueller Progress Bar -->
                        <div class="mt-4">
                            <div class="flex justify-between text-xs mb-2">
                                <span>Speichernutzung</span>
                                <span>${storageDetails.totalSizeBytes} von ${storageDetails.availableStorage} verfügbar</span>
                            </div>
                            <div class="progress progress-primary">
                                <div class="progress-bar" style="width: ${storageDetails.usagePercentage}%"></div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Speicher-Optimierung Tipps -->
                <div class="alert alert-info mb-4">
                    <i data-lucide="lightbulb" class="w-5 h-5"></i>
                    <div>
                        <h4 class="font-semibold">Optimierungstipps</h4>
                        <ul class="text-sm mt-1 space-y-1">
                            ${this.getStorageOptimizationTips(storageDetails)}
                        </ul>
                    </div>
                </div>

                <!-- Action Buttons -->
                <div class="modal-action">
                    <div class="flex flex-wrap gap-2">
                        <!-- Clear Cache Button -->
                        <button class="btn btn-outline btn-warning gap-2" onclick="healthTracker?.clearAppCache?.(); this.closest('.modal').remove();">
                            <i data-lucide="trash-2" class="w-4 h-4"></i>
                            Cache leeren
                        </button>
                        
                        <!-- Export Data Button -->
                        <button class="btn btn-outline gap-2" onclick="healthTracker?.exportAppData?.(); this.closest('.modal').remove();">
                            <i data-lucide="download" class="w-4 h-4"></i>
                            Daten exportieren
                        </button>
                        
                        <!-- Data Cleanup Button -->
                        <button class="btn btn-outline btn-secondary gap-2" onclick="healthTracker?.showDataCleanup?.(); this.closest('.modal').remove();">
                            <i data-lucide="broom" class="w-4 h-4"></i>
                            Daten bereinigen
                        </button>
                        
                        <!-- Close Button -->
                        <button class="btn btn-primary" onclick="this.closest('.modal').remove()">
                            <i data-lucide="x" class="w-4 h-4"></i>
                            Schließen
                        </button>
                    </div>
                </div>
            </div>
            <div class="modal-backdrop" onclick="this.closest('.modal').remove()"></div>
        `;
        
        document.body.appendChild(modal);
        
        // Icons initialisieren
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
        
        // Haptic Feedback
        if (navigator.vibrate && localStorage.getItem('hapticFeedback') === 'true') {
            navigator.vibrate(10);
        }

    } catch (error) {
        console.error('❌ Fehler beim Anzeigen der Speichernutzung:', error);
        this.showToast('❌ Speicherverbrauch konnte nicht geladen werden', 'error');
    }
}

/**
 * Erweiterte Speicher-Details berechnen
 */
getStorageDetails() {
    try {
        const appStats = this.getAppStats();
        
        // Parse sizes zurück zu Bytes für Berechnungen
        const parseSize = (sizeStr) => {
            const num = parseFloat(sizeStr);
            if (sizeStr.includes('MB')) return num * 1024 * 1024;
            if (sizeStr.includes('KB')) return num * 1024;
            return num;
        };

        const healthDataBytes = parseSize(appStats.healthDataSize);
        const goalsBytes = parseSize(appStats.goalsSize);
        const settingsBytes = parseSize(appStats.settingsSize);
        const cacheBytes = parseSize(appStats.cacheSize);
        const totalBytes = healthDataBytes + goalsBytes + settingsBytes + cacheBytes;

        // Prozentuale Verteilung berechnen
        const calculatePercentage = (value) => totalBytes > 0 ? Math.round((value / totalBytes) * 100) : 0;

        // Geschätzte verfügbare Storage (localStorage Limit ~5-10MB)
        const estimatedLimit = 5 * 1024 * 1024; // 5MB
        const usagePercentage = Math.min(100, Math.round((totalBytes / estimatedLimit) * 100));

        return {
            totalSizeBytes: this.formatBytes(totalBytes),
            availableStorage: this.formatBytes(estimatedLimit),
            usagePercentage: usagePercentage,
            healthDataPercentage: calculatePercentage(healthDataBytes),
            goalsPercentage: calculatePercentage(goalsBytes),
            settingsPercentage: calculatePercentage(settingsBytes),
            cachePercentage: calculatePercentage(cacheBytes),
            isHighUsage: usagePercentage > 80,
            canOptimize: totalBytes > 1024 * 100 // Mehr als 100KB
        };
    } catch (error) {
        console.error('❌ Fehler bei Speicher-Detail-Berechnung:', error);
        return {
            totalSizeBytes: '0 B',
            availableStorage: '5 MB',
            usagePercentage: 0,
            healthDataPercentage: 0,
            goalsPercentage: 0,
            settingsPercentage: 0,
            cachePercentage: 0,
            isHighUsage: false,
            canOptimize: false
        };
    }
}

/**
 * Generiere kontextuelle Optimierungstipps
 */
getStorageOptimizationTips(storageDetails) {
    const tips = [];
    
    if (storageDetails.isHighUsage) {
        tips.push('⚠️ Hohe Speichernutzung - erwäge Datenbereinigung');
    }
    
    if (storageDetails.healthDataPercentage > 70) {
        tips.push('📊 Viele Gesundheitsdaten - exportiere ältere Einträge');
    }
    
    if (storageDetails.cachePercentage > 30) {
        tips.push('🗄️ Cache könnte geleert werden für mehr Speicherplatz');
    }
    
    if (tips.length === 0) {
        tips.push('✅ Speichernutzung ist optimal');
        tips.push('💡 Regelmäßige Datenexporte empfohlen für Backup');
    }
    
    return tips.map(tip => `<li>${tip}</li>`).join('');
}

/**
 * Erweiterte Cache-Bereinigung
 */
async clearAppCache() {
    try {
        console.log('🧹 Starte Cache-Bereinigung...');
        
        // Temporäre localStorage Keys entfernen
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && (
                key.startsWith('temp_') ||
                key.startsWith('cache_') ||
                key.startsWith('lastSync_') ||
                key.includes('_cached')
            )) {
                keysToRemove.push(key);
            }
        }
        
        keysToRemove.forEach(key => localStorage.removeItem(key));
        
        // In-Memory Cache leeren
        if (this.cache && typeof this.cache.clear === 'function') {
            this.cache.clear();
        }
        
        console.log(`✅ Cache bereinigt - ${keysToRemove.length} Einträge entfernt`);
        
        return keysToRemove.length;
        
    } catch (error) {
        console.error('❌ Fehler beim Cache-Leeren:', error);
        return 0;
    }
}

/**
 * Zeige Datenbereinigung-Dialog
 */
showDataCleanup() {
    const modal = document.createElement('div');
    modal.className = 'modal modal-open';
    modal.innerHTML = `
        <div class="modal-box">
            <h3 class="font-bold text-lg mb-4 flex items-center gap-2">
                <i data-lucide="broom" class="w-5 h-5"></i>
                Datenbereinigung
            </h3>
            <div class="space-y-4">
                <div class="alert alert-warning">
                    <i data-lucide="alert-triangle" class="w-5 h-5"></i>
                    <div>
                        <h4 class="font-semibold">Achtung</h4>
                        <p class="text-sm">Diese Aktionen können nicht rückgängig gemacht werden. Exportiere wichtige Daten vorher.</p>
                    </div>
                </div>
                
                <div class="form-control">
                    <label class="label">
                        <span class="label-text">Alte Daten entfernen</span>
                    </label>
                    <select class="select select-bordered" id="cleanup-period">
                        <option value="90">Älter als 90 Tage</option>
                        <option value="180">Älter als 6 Monate</option>
                        <option value="365">Älter als 1 Jahr</option>
                    </select>
                </div>
                
                <div class="form-control">
                    <label class="cursor-pointer label">
                        <span class="label-text">Cache & temporäre Daten</span>
                        <input type="checkbox" class="checkbox" id="cleanup-cache" checked>
                    </label>
                </div>
                
                <div class="form-control">
                    <label class="cursor-pointer label">
                        <span class="label-text">Unvollständige Einträge</span>
                        <input type="checkbox" class="checkbox" id="cleanup-incomplete">
                    </label>
                </div>
            </div>
            
            <div class="modal-action">
                <button class="btn btn-outline" onclick="this.closest('.modal').remove()">
                    Abbrechen
                </button>
                <button class="btn btn-warning" onclick="healthTracker?.executeDataCleanup?.(); this.closest('.modal').remove();">
                    <i data-lucide="trash-2" class="w-4 h-4"></i>
                    Bereinigen
                </button>
            </div>
        </div>
        <div class="modal-backdrop" onclick="this.closest('.modal').remove()"></div>
    `;
    
    document.body.appendChild(modal);
    
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}

async exportData() {
    try {
        const data = {
            healthData: JSON.parse(localStorage.getItem('healthData') || '{}'),
            goals: JSON.parse(localStorage.getItem('goals') || '[]'),
            exportDate: new Date().toISOString(),
            version: '2.0'
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `health-tracker-backup-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);

        this.showToast('📤 Daten erfolgreich exportiert', 'success');
        console.log('📤 Datenexport erfolgreich');
    } catch (error) {
        console.error('❌ Export-Fehler:', error);
        this.showToast('❌ Fehler beim Exportieren', 'error');
    }
}

async importData() {
    try {
        const fileInput = document.getElementById('import-file');
        const file = fileInput.files[0];
        
        if (!file) {
            this.showToast('⚠️ Bitte wähle eine Datei aus', 'warning');
            return;
        }

        const text = await file.text();
        const data = JSON.parse(text);

        if (data.healthData) localStorage.setItem('healthData', JSON.stringify(data.healthData));
        if (data.goals) localStorage.setItem('goals', JSON.stringify(data.goals));

        this.showToast('📥 Daten erfolgreich importiert', 'success');
        console.log('📥 Datenimport erfolgreich');
        
        // UI aktualisieren
        setTimeout(() => location.reload(), 1500);
    } catch (error) {
        console.error('❌ Import-Fehler:', error);
        this.showToast('❌ Fehler beim Importieren', 'error');
    }
}

// === THEME TOGGLE ===
toggleTheme() {
    const availableThemes = ['light', 'dark', 'emerald', 'cupcake', 'corporate'];
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
    const currentIndex = availableThemes.indexOf(currentTheme);
    const nextIndex = (currentIndex + 1) % availableThemes.length;
    const newTheme = availableThemes[nextIndex];
    
    // Neue setTheme Methode verwenden
    this.setTheme(newTheme);
}

// === THEME SETZEN ===
setTheme(themeName) {
    console.log(`🎨 Theme wird gesetzt auf: ${themeName}`);
    
    try {
        // Validierung: Theme existiert
        const availableThemes = this.getAvailableThemes();
        const themeExists = availableThemes.some(theme => theme.value === themeName);
        
        if (!themeExists) {
            console.warn(`⚠️ Theme '${themeName}' nicht verfügbar, fallback zu 'light'`);
            themeName = 'light';
        }

        // Smooth transition vorbereiten
        document.documentElement.style.transition = 'background-color 0.4s ease, color 0.4s ease';
        
        // Theme anwenden
        document.documentElement.setAttribute('data-theme', themeName);
        localStorage.setItem('theme', themeName);
        
        // Meta-Theme-Color für PWA anpassen
        this.updateMetaThemeColor(themeName);
        
        // Charts aktualisieren falls Analytics Engine verfügbar
        if (this.analyticsEngine && typeof this.analyticsEngine.updateChartsTheme === 'function') {
            setTimeout(() => {
                this.analyticsEngine.updateChartsTheme(themeName);
            }, 200);
        }
        
        // Theme-spezifische Styles anwenden
        this.applyThemeSpecificStyles(themeName);
        
        // UI-Elemente aktualisieren
        this.updateThemeSelectors(themeName);
        
        // Haptic Feedback
        if (JSON.parse(localStorage.getItem('hapticFeedback') || 'false') && navigator.vibrate) {
            navigator.vibrate(50);
        }
        
        // Success-Message mit Theme-Icon
        const themeObj = availableThemes.find(t => t.value === themeName);
        this.showToast(`${themeObj.icon} ${themeObj.name} aktiviert`, 'success');
        
        // Theme-Change Event für andere Komponenten
        window.dispatchEvent(new CustomEvent('themeChanged', { 
            detail: { theme: themeName, themeData: themeObj }
        }));
        
        console.log(`✅ Theme erfolgreich gesetzt: ${themeName}`);
        
    } catch (error) {
        console.error('❌ Fehler beim Setzen des Themes:', error);
        this.showToast('❌ Fehler beim Theme-Wechsel', 'error');
        
        // Fallback zu default Theme
        document.documentElement.setAttribute('data-theme', 'light');
        localStorage.setItem('theme', 'light');
    } finally {
        // Transition nach Abschluss entfernen
        setTimeout(() => {
            document.documentElement.style.transition = '';
        }, 400);
    }
}

// === THEME HILFSMETHODEN ===
getThemeDisplayName(theme) {
    const themeNames = {
        'light': 'Hell',
        'dark': 'Dunkel',
        'cupcake': 'Cupcake',
        'emerald': 'Emerald',
        'corporate': 'Corporate',
        'synthwave': 'Synthwave',
        'retro': 'Retro',
        'cyberpunk': 'Cyberpunk',
        'valentine': 'Valentine',
        'halloween': 'Halloween',
        'garden': 'Garden',
        'forest': 'Forest',
        'aqua': 'Aqua',
        'lofi': 'Lo-Fi',
        'pastel': 'Pastel',
        'fantasy': 'Fantasy',
        'wireframe': 'Wireframe',
        'black': 'Black',
        'luxury': 'Luxury',
        'dracula': 'Dracula',
        'cmyk': 'CMYK',
        'autumn': 'Autumn',
        'business': 'Business',
        'acid': 'Acid',
        'lemonade': 'Lemonade',
        'night': 'Night',
        'coffee': 'Coffee',
        'winter': 'Winter'
    };
    return themeNames[theme] || theme.charAt(0).toUpperCase() + theme.slice(1);
}

applyThemeSpecificStyles(theme) {
    const body = document.body;
    
    // Performance: Batch DOM updates
    requestAnimationFrame(() => {
        // Alle Theme-Klassen entfernen
        const themeClasses = [
            'theme-light', 'theme-dark', 'theme-nature', 'theme-corporate', 
            'theme-retro', 'theme-neon', 'theme-luxury', 'theme-minimal',
            'theme-warm', 'theme-cool', 'theme-vibrant', 'theme-muted'
        ];
        body.classList.remove(...themeClasses);
        
        // CSS Custom Properties für Theme-spezifische Werte
        const root = document.documentElement;
        
        // Theme-Kategorisierung und entsprechende Klassen/Properties
        const themeConfig = this.getThemeConfiguration(theme);
        
        // Theme-Kategorie-Klasse hinzufügen
        if (themeConfig.category) {
            body.classList.add(`theme-${themeConfig.category}`);
        }
        
        // Custom Properties setzen
        Object.entries(themeConfig.properties).forEach(([property, value]) => {
            root.style.setProperty(`--theme-${property}`, value);
        });
        
        // Spezielle Animationen für bestimmte Themes
        this.applyThemeAnimations(theme, themeConfig);
        
        // Accessibility-Anpassungen
        this.adjustAccessibilityForTheme(theme);
    });
}

getThemeConfiguration(theme) {
    const configurations = {
        'light': {
            category: 'light',
            properties: {
                'shadow-opacity': '0.1',
                'border-opacity': '0.2',
                'animation-speed': '0.3s',
                'glass-effect': 'none'
            }
        },
        'dark': {
            category: 'dark',
            properties: {
                'shadow-opacity': '0.3',
                'border-opacity': '0.1',
                'animation-speed': '0.4s',
                'glass-effect': 'blur(10px)'
            }
        },
        'emerald': {
            category: 'nature',
            properties: {
                'shadow-opacity': '0.15',
                'border-opacity': '0.15',
                'animation-speed': '0.5s',
                'glass-effect': 'none'
            }
        },
        'cyberpunk': {
            category: 'neon',
            properties: {
                'shadow-opacity': '0.4',
                'border-opacity': '0.3',
                'animation-speed': '0.2s',
                'glass-effect': 'blur(5px)'
            }
        },
        'luxury': {
            category: 'luxury',
            properties: {
                'shadow-opacity': '0.2',
                'border-opacity': '0.25',
                'animation-speed': '0.6s',
                'glass-effect': 'blur(8px)'
            }
        },
        'corporate': {
            category: 'corporate',
            properties: {
                'shadow-opacity': '0.08',
                'border-opacity': '0.12',
                'animation-speed': '0.25s',
                'glass-effect': 'none'
            }
        }
    };
    
    return configurations[theme] || configurations['light'];
}

applyThemeAnimations(theme, config) {
    const animationClass = `theme-animation-${config.category}`;
    
    // Bestehende Animation-Klassen entfernen
    document.body.classList.remove(
        'theme-animation-light', 'theme-animation-dark', 'theme-animation-nature',
        'theme-animation-neon', 'theme-animation-luxury', 'theme-animation-corporate'
    );
    
    // Neue Animation-Klasse hinzufügen
    document.body.classList.add(animationClass);
    
    // Spezielle Effekte für bestimmte Themes
    if (theme === 'cyberpunk' || theme === 'synthwave') {
        this.enableNeonEffects();
    } else {
        this.disableNeonEffects();
    }
}

adjustAccessibilityForTheme(theme) {
    const root = document.documentElement;
    
    // Kontrast-Anpassungen für bessere Lesbarkeit
    const contrastAdjustments = {
        'black': { contrast: '1.2', brightness: '1.1' },
        'dark': { contrast: '1.1', brightness: '1.05' },
        'halloween': { contrast: '1.3', brightness: '1.2' },
        'cyberpunk': { contrast: '1.25', brightness: '1.1' }
    };
    
    const adjustment = contrastAdjustments[theme];
    if (adjustment) {
        root.style.setProperty('--accessibility-contrast', adjustment.contrast);
        root.style.setProperty('--accessibility-brightness', adjustment.brightness);
    } else {
        root.style.removeProperty('--accessibility-contrast');
        root.style.removeProperty('--accessibility-brightness');
    }
}

updateMetaThemeColor(theme) {
    // PWA Theme-Color Meta-Tag für Statusbar anpassen
    let metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (!metaThemeColor) {
        metaThemeColor = document.createElement('meta');
        metaThemeColor.name = 'theme-color';
        document.head.appendChild(metaThemeColor);
    }
    
    const themeColors = {
        'light': '#ffffff',
        'dark': '#1d232a',
        'emerald': '#065f46',
        'cupcake': '#fdf2f8',
        'corporate': '#f3f4f6',
        'synthwave': '#1a103d',
        'retro': '#a16207',
        'cyberpunk': '#0f0f23',
        'valentine': '#881337',
        'halloween': '#451a03',
        'garden': '#14532d',
        'aqua': '#0c4a6e',
        'lofi': '#44403c',
        'dracula': '#282a36',
        'luxury': '#451a03',
        'night': '#0f172a',
        'coffee': '#44403c'
    };
    
    metaThemeColor.content = themeColors[theme] || '#ffffff';
}

updateThemeSelectors(themeName) {
    // Alle Theme-Selektoren in der UI aktualisieren
    const selectors = [
        '#theme-selector',
        '.theme-dropdown select',
        '.theme-picker input[type="radio"]'
    ];
    
    selectors.forEach(selector => {
        const element = document.querySelector(selector);
        if (element) {
            if (element.tagName === 'SELECT') {
                element.value = themeName;
            } else if (element.type === 'radio') {
                element.checked = element.value === themeName;
            }
        }
    });
    
    // Theme-Vorschau Cards aktualisieren
    const previewCards = document.querySelectorAll('.theme-preview-card');
    previewCards.forEach(card => {
        card.classList.remove('ring-2', 'ring-primary');
        const badge = card.querySelector('.badge-primary');
        if (badge) badge.remove();
        
        if (card.dataset.theme === themeName) {
            card.classList.add('ring-2', 'ring-primary');
            card.insertAdjacentHTML('beforeend', '<div class="badge badge-primary badge-sm absolute top-2 right-2">Aktiv</div>');
        }
    });
}

enableNeonEffects() {
    if (!document.getElementById('neon-effects-style')) {
        const style = document.createElement('style');
        style.id = 'neon-effects-style';
        style.textContent = `
            .theme-animation-neon .btn:hover {
                box-shadow: 0 0 20px currentColor, 0 0 40px currentColor;
                animation: neonPulse 2s infinite alternate;
            }
            
            .theme-animation-neon .card {
                box-shadow: 0 0 15px rgba(0, 255, 255, 0.1);
            }
            
            @keyframes neonPulse {
                0% { filter: brightness(1) saturate(1); }
                100% { filter: brightness(1.2) saturate(1.5); }
            }
        `;
        document.head.appendChild(style);
    }
}

disableNeonEffects() {
    const neonStyle = document.getElementById('neon-effects-style');
    if (neonStyle) {
        neonStyle.remove();
    }
}

getAvailableThemes() {
    return [
        { value: 'light', name: 'Hell', icon: '☀️', description: 'Klassisches helles Design' },
        { value: 'dark', name: 'Dunkel', icon: '🌙', description: 'Augenschonendes dunkles Design' },
        { value: 'cupcake', name: 'Cupcake', icon: '🧁', description: 'Freundliches rosa Design' },
        { value: 'emerald', name: 'Emerald', icon: '💎', description: 'Beruhigendes grünes Design' },
        { value: 'corporate', name: 'Corporate', icon: '💼', description: 'Professionelles Business-Design' },
        { value: 'synthwave', name: 'Synthwave', icon: '🌆', description: 'Retro-futuristisches Design' },
        { value: 'retro', name: 'Retro', icon: '📻', description: 'Nostalgisches Retro-Design' },
        { value: 'cyberpunk', name: 'Cyberpunk', icon: '🤖', description: 'Futuristisches Neon-Design' },
        { value: 'valentine', name: 'Valentine', icon: '💖', description: 'Romantisches rosa Design' },
        { value: 'halloween', name: 'Halloween', icon: '🎃', description: 'Gruseliges Halloween-Design' },
        { value: 'garden', name: 'Garden', icon: '🌻', description: 'Natürliches Garten-Design' },
        { value: 'aqua', name: 'Aqua', icon: '🌊', description: 'Frisches Wasser-Design' },
        { value: 'lofi', name: 'Lo-Fi', icon: '🎵', description: 'Entspanntes Lo-Fi Design' },
        { value: 'dracula', name: 'Dracula', icon: '🧛', description: 'Elegantes dunkles Design' },
        { value: 'autumn', name: 'Autumn', icon: '🍂', description: 'Warmes Herbst-Design' },
        { value: 'coffee', name: 'Coffee', icon: '☕', description: 'Gemütliches Kaffee-Design' }
    ];
}

toggleNotifications() {
    if (!this.smartNotificationManager) {
        this.showToast('⚠️ Notification Manager nicht verfügbar', 'warning');
        return;
    }
    
    const wasEnabled = this.smartNotificationManager.isEnabled;
    this.smartNotificationManager.isEnabled = !wasEnabled;
    localStorage.setItem('notificationsEnabled', this.smartNotificationManager.isEnabled);
    
    if (this.smartNotificationManager.isEnabled) {
        // Berechtigung anfragen falls noch nicht erteilt
        this.requestNotificationPermission();
    }
    
    this.showToast(`🔔 Benachrichtigungen ${this.smartNotificationManager.isEnabled ? 'aktiviert' : 'deaktiviert'}`, 'info');
}

resetApp() {
    const modal = document.createElement('div');
    modal.className = 'modal modal-open';
    modal.innerHTML = `
        <div class="modal-box">
            <h3 class="font-bold text-lg text-error mb-4">
                <i data-lucide="alert-triangle" class="w-6 h-6 inline mr-2"></i>
                App zurücksetzen
            </h3>
            <div class="alert alert-warning mb-4">
                <i data-lucide="alert-circle" class="w-5 h-5"></i>
                <div>
                    <strong>Achtung!</strong>
                    <p>Diese Aktion löscht alle deine Gesundheitsdaten, Ziele und Einstellungen unwiderruflich.</p>
                </div>
            </div>
            
            <div class="form-control mb-4">
                <label class="label cursor-pointer">
                    <span class="label-text">Ich verstehe, dass alle Daten gelöscht werden</span>
                    <input type="checkbox" class="checkbox checkbox-error" id="confirm-reset">
                </label>
            </div>
            
            <div class="modal-action">
                <button class="btn" onclick="this.closest('.modal').remove()">Abbrechen</button>
                <button class="btn btn-error" onclick="healthTracker.confirmReset()" id="confirm-reset-btn" disabled>
                    <i data-lucide="trash-2" class="w-4 h-4 mr-2"></i>
                    Endgültig löschen
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Checkbox-Validation
    const checkbox = modal.querySelector('#confirm-reset');
    const button = modal.querySelector('#confirm-reset-btn');
    checkbox.addEventListener('change', () => {
        button.disabled = !checkbox.checked;
    });
    
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

confirmReset() {
    try {
        // Alle Charts zerstören
        if (this.analyticsEngine) {
            this.analyticsEngine.destroyAllCharts();
        }
        
        // LocalStorage komplett leeren
        localStorage.clear();
        
        // Service Worker Cache leeren
        if ('caches' in window) {
            caches.keys().then(names => {
                names.forEach(name => caches.delete(name));
            });
        }
        
        this.showToast('🔄 App wird zurückgesetzt...', 'info');
        
        // Modal schließen und App neu laden
        document.querySelector('.modal-open')?.remove();
        setTimeout(() => {
            window.location.reload();
        }, 1500);
        
    } catch (error) {
        console.error('❌ Fehler beim App-Reset:', error);
        this.showToast('❌ Fehler beim Zurücksetzen', 'error');
    }
}

async implementDataRetention() {
    const retentionDays = localStorage.getItem('dataRetention');
    if (!retentionDays || retentionDays === 'never') return;
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - parseInt(retentionDays));
    
    try {
        const healthData = JSON.parse(localStorage.getItem('healthData') || '{}');
        let removedEntries = 0;
        
        Object.keys(healthData).forEach(date => {
            if (new Date(date) < cutoffDate) {
                delete healthData[date];
                removedEntries++;
            }
        });
        
        if (removedEntries > 0) {
            localStorage.setItem('healthData', JSON.stringify(healthData));
            console.log(`🗑️ ${removedEntries} alte Einträge automatisch gelöscht`);
        }
        
    } catch (error) {
        console.error('❌ Fehler bei automatischer Datenbereinigung:', error);
    }
}

updateChartsTheme(theme) {
    const isDark = theme === 'dark';
    const textColor = isDark ? '#e5e7eb' : '#374151';
    const gridColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
    
    // Alle aktiven Charts aktualisieren
    [this.currentTrendsChart, this.currentHeatmapChart, this.currentComparisonChart].forEach(chart => {
        if (chart) {
            chart.options.scales.x.title.color = textColor;
            chart.options.scales.y.title.color = textColor;
            chart.options.scales.x.grid.color = gridColor;
            chart.options.scales.y.grid.color = gridColor;
            chart.options.plugins.legend.labels.color = textColor;
            chart.update('none');
        }
    });
}

/**
 * Zeige erweiterte Datenbereinigung-Modal
 */
showDataCleanupModal() {
    console.log('🧹 Datenbereinigung-Modal wird geöffnet');
    
    try {
        // Prüfe ob bereits ein Modal existiert
        const existingModal = document.querySelector('.data-cleanup-modal');
        if (existingModal) {
            existingModal.remove();
        }

        const appStats = this.getAppStats();
        const storageDetails = this.getStorageDetails();
        
        const retentionDays = localStorage.getItem('dataRetention') || '365';
        
        const modal = document.createElement('div');
        modal.className = 'modal modal-open data-cleanup-modal';
        modal.innerHTML = `
            <div class="modal-box max-w-2xl">
                <h3 class="font-bold text-lg mb-4">
                    <i data-lucide="broom" class="w-6 h-6 inline mr-2"></i>
                    Datenbereinigung
                </h3>
                
                <div class="alert alert-info mb-4">
                    <i data-lucide="info" class="w-5 h-5"></i>
                    <div>
                        <strong>Aktuelle Einstellung:</strong>
                        <p class="text-sm mt-1">
                            Daten werden ${retentionDays === 'never' ? 'niemals automatisch' : `nach ${retentionDays} Tagen`} gelöscht
                        </p>
                    </div>
                </div>

                <!-- Aktuelle Speicher-Statistiken -->
                <div class="stats stats-vertical w-full mb-4">
                    <div class="stat">
                        <div class="stat-title">Aktueller Speicherverbrauch</div>
                        <div class="stat-value text-sm">${appStats.storageSize}</div>
                        <div class="stat-desc">Gesamt genutzter Speicher</div>
                    </div>
                    <div class="stat">
                        <div class="stat-title">Gesundheitsdaten</div>
                        <div class="stat-value text-sm">${appStats.healthDataSize}</div>
                        <div class="stat-desc">Tracking-Daten (${appStats.totalEntries} Einträge)</div>
                    </div>
                    <div class="stat">
                        <div class="stat-title">Verwendungsgrad</div>
                        <div class="stat-value text-sm">${storageDetails.usagePercentage}%</div>
                        <div class="stat-desc">von 5MB verfügbarer Speicher</div>
                    </div>
                </div>

                <!-- Bereinigungs-Optionen -->
                <div class="form-control mb-4">
                    <label class="label">
                        <span class="label-text">Daten älter als:</span>
                    </label>
                    <select class="select select-bordered" id="cleanup-period">
                        <option value="30">30 Tage</option>
                        <option value="90">90 Tage (3 Monate)</option>
                        <option value="180">180 Tage (6 Monate)</option>
                        <option value="365">365 Tage (1 Jahr)</option>
                    </select>
                </div>

                <div class="form-control mb-4">
                    <label class="label cursor-pointer">
                        <span class="label-text">Auch Cache und temporäre Daten löschen</span>
                        <input type="checkbox" class="checkbox" id="cleanup-cache" checked>
                    </label>
                </div>

                <!-- Erweiterte Bereinigungsoptionen -->
                <div class="collapse collapse-arrow bg-base-200 mb-4">
                    <input type="checkbox" /> 
                    <div class="collapse-title text-sm font-medium">
                        Erweiterte Optionen
                    </div>
                    <div class="collapse-content text-sm">
                        <div class="form-control">
                            <label class="label cursor-pointer">
                                <span class="label-text">Unvollständige Einträge entfernen</span>
                                <input type="checkbox" class="checkbox" id="cleanup-incomplete">
                            </label>
                        </div>
                        <div class="form-control">
                            <label class="label cursor-pointer">
                                <span class="label-text">Backup vor Bereinigung erstellen</span>
                                <input type="checkbox" class="checkbox" id="cleanup-backup" checked>
                            </label>
                        </div>
                    </div>
                </div>

                <!-- Warnung bei hohem Speicherverbrauch -->
                ${storageDetails.isHighUsage ? `
                    <div class="alert alert-warning mb-4">
                        <i data-lucide="alert-triangle" class="w-5 h-5"></i>
                        <div>
                            <strong>Hoher Speicherverbrauch!</strong>
                            <p class="text-sm">Deine App verwendet ${storageDetails.usagePercentage}% des verfügbaren Speichers. Eine Bereinigung wird empfohlen.</p>
                        </div>
                    </div>
                ` : ''}

                <div class="modal-action">
                    <button class="btn" onclick="this.closest('.modal').remove()">Abbrechen</button>
                    <button class="btn btn-primary" onclick="healthTracker?.executeDataCleanup?.(); this.closest('.modal').remove();">
                        <i data-lucide="broom" class="w-4 h-4 mr-2"></i>
                        Bereinigung starten
                    </button>
                </div>
            </div>
            <div class="modal-backdrop" onclick="this.closest('.modal').remove()"></div>
        `;

        document.body.appendChild(modal);
        
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }

    } catch (error) {
        console.error('❌ Fehler beim Öffnen des Bereinigungs-Modals:', error);
        this.showToast('❌ Fehler beim Öffnen der Bereinigung', 'error');
    }
}

/**
 * Führe Datenbereinigung basierend auf Benutzerauswahl durch
 */
async executeDataCleanup() {
    try {
        console.log('🧹 Starte Datenbereinigung...');
        
        const period = parseInt(document.getElementById('cleanup-period')?.value) || 90;
        const cleanCache = document.getElementById('cleanup-cache')?.checked || false;
        const cleanIncomplete = document.getElementById('cleanup-incomplete')?.checked || false;
        const createBackup = document.getElementById('cleanup-backup')?.checked || false;
        
        let cleanedItems = 0;
        
        // Backup erstellen falls gewünscht
        if (createBackup) {
            await this.exportAppData();
            this.showToast('💾 Backup erstellt', 'info', 2000);
        }
        
        // Alte Daten bereinigen
        const healthData = JSON.parse(localStorage.getItem('healthData') || '[]');
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - period);
        
        const filteredData = healthData.filter(entry => {
            if (!entry.date) return true;
            
            let entryDate;
            if (typeof entry.date === 'string') {
                entryDate = new Date(entry.date.split('T')[0]);
            } else {
                entryDate = new Date(entry.date);
            }
            
            const shouldKeep = entryDate >= cutoffDate;
            if (!shouldKeep) cleanedItems++;
            return shouldKeep;
        });
        
        localStorage.setItem('healthData', JSON.stringify(filteredData));
        
        // Unvollständige Einträge bereinigen
        if (cleanIncomplete) {
            const completeEntries = filteredData.filter(entry => {
                const hasData = entry.weight || entry.steps || entry.waterIntake || entry.sleepHours;
                const hasNotes = entry.notes && entry.notes.trim().length > 5;
                return hasData || hasNotes;
            });
            
            cleanedItems += filteredData.length - completeEntries.length;
            localStorage.setItem('healthData', JSON.stringify(completeEntries));
        }
        
        // Cache bereinigen
        if (cleanCache) {
            await this.clearAppCache();
        }
        
        // Erfolg melden
        this.showToast(`🧹 Bereinigung abgeschlossen! ${cleanedItems} Einträge entfernt`, 'success');
        
        // Komponenten aktualisieren
        this.cache?.clear?.();
        await this.refreshAllComponents();
        
        console.log(`✅ Datenbereinigung abgeschlossen - ${cleanedItems} Einträge entfernt`);
        
    } catch (error) {
        console.error('❌ Fehler bei der Datenbereinigung:', error);
        this.showToast('❌ Bereinigung fehlgeschlagen', 'error');
    }
}

showDataCleanupResult(removedEntries, cutoffDate, cacheCleared) {
    const modal = document.createElement('div');
    modal.className = 'modal modal-open';
    modal.innerHTML = `
        <div class="modal-box">
            <h3 class="font-bold text-lg mb-4">
                <i data-lucide="check-circle" class="w-6 h-6 inline mr-2 text-success"></i>
                Bereinigung abgeschlossen
            </h3>
            
            <div class="stats stats-vertical w-full mb-4">
                <div class="stat">
                    <div class="stat-title">Entfernte Einträge</div>
                    <div class="stat-value text-primary">${removedEntries}</div>
                    <div class="stat-desc">Gesundheitsdaten-Einträge</div>
                </div>
                <div class="stat">
                    <div class="stat-title">Cutoff-Datum</div>
                    <div class="stat-value text-sm">${cutoffDate.toLocaleDateString('de-DE')}</div>
                    <div class="stat-desc">Daten vor diesem Datum entfernt</div>
                </div>
            </div>

            ${cacheCleared ? `
                <div class="alert alert-success mb-4">
                    <i data-lucide="check" class="w-5 h-5"></i>
                    <span>Cache und temporäre Daten wurden ebenfalls geleert</span>
                </div>
            ` : ''}

            <div class="modal-action">
                <button class="btn btn-primary" onclick="this.closest('.modal').remove()">
                    <i data-lucide="thumbs-up" class="w-4 h-4 mr-2"></i>
                    Super!
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
    
    console.log(`✅ Datenbereinigung abgeschlossen: ${removedEntries} Einträge entfernt`);
}

// === THEME-SELECTOR MODAL ===
showThemeSelector() {
    console.log('🎨 Theme-Selector wird geöffnet');
    
    try {
        const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
        const availableThemes = this.getAvailableThemes();
        
        const modal = document.createElement('div');
        modal.className = 'modal modal-open';
        modal.innerHTML = `
            <div class="modal-box max-w-2xl">
                <h3 class="font-bold text-lg mb-6">
                    <i data-lucide="palette" class="w-6 h-6 inline mr-2"></i>
                    Design ändern
                </h3>
                
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                    ${availableThemes.map(theme => `
                        <div class="card bg-base-200 cursor-pointer transition-all hover:scale-105 ${currentTheme === theme.value ? 'ring-2 ring-primary' : ''}" 
                             onclick="healthTracker.previewTheme('${theme.value}')">
                            <div class="card-body text-center p-4">
                                <div class="text-4xl mb-2">${theme.icon}</div>
                                <h4 class="font-semibold">${theme.name}</h4>
                                <p class="text-sm text-base-content/70">${theme.description}</p>
                                ${currentTheme === theme.value ? `
                                    <div class="badge badge-primary badge-sm mt-2">Aktiv</div>
                                ` : ''}
                            </div>
                        </div>
                    `).join('')}
                </div>

                <div class="alert alert-info mb-4">
                    <i data-lucide="info" class="w-5 h-5"></i>
                    <div>
                        <strong>Tipp:</strong>
                        <p class="text-sm mt-1">Klicke auf ein Theme für eine Vorschau. Das Theme wird automatisch gespeichert.</p>
                    </div>
                </div>

                <div class="modal-action">
                    <button class="btn" onclick="this.closest('.modal').remove()">Schließen</button>
                </div>
            </div>
            <div class="modal-backdrop" onclick="this.closest('.modal').remove()"></div>
        `;

        document.body.appendChild(modal);
        
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }

    } catch (error) {
        console.error('❌ Fehler beim Öffnen des Theme-Selectors:', error);
        this.showToast('❌ Fehler beim Öffnen der Theme-Auswahl', 'error');
    }
}

previewTheme(themeName) {
    // Theme sofort anwenden
    this.setTheme(themeName);
    
    // Visual Feedback
    const cards = document.querySelectorAll('.modal-open .card');
    cards.forEach(card => {
        card.classList.remove('ring-2', 'ring-primary');
        const badge = card.querySelector('.badge');
        if (badge) badge.remove();
    });
    
    const selectedCard = document.querySelector(`[onclick*="'${themeName}'"]`);
    if (selectedCard) {
        selectedCard.classList.add('ring-2', 'ring-primary');
        const cardBody = selectedCard.querySelector('.card-body');
        cardBody.insertAdjacentHTML('beforeend', '<div class="badge badge-primary badge-sm mt-2">Aktiv</div>');
    }
    
    // Haptic Feedback falls aktiviert
    if (JSON.parse(localStorage.getItem('hapticFeedback') || 'false') && navigator.vibrate) {
        navigator.vibrate(30);
    }
}

getAvailableThemes() {
    return [
        { value: 'light', name: 'Hell', icon: '☀️', description: 'Klassisches helles Design' },
        { value: 'dark', name: 'Dunkel', icon: '🌙', description: 'Augenschonendes dunkles Design' },
        { value: 'cupcake', name: 'Cupcake', icon: '🧁', description: 'Freundliches rosa Design' },
        { value: 'emerald', name: 'Emerald', icon: '💎', description: 'Beruhigendes grünes Design' },
        { value: 'corporate', name: 'Corporate', icon: '💼', description: 'Professionelles Business-Design' },
        { value: 'synthwave', name: 'Synthwave', icon: '🌆', description: 'Retro-futuristisches Design' },
        { value: 'retro', name: 'Retro', icon: '📻', description: 'Nostalgisches 80er Design' },
        { value: 'cyberpunk', name: 'Cyberpunk', icon: '🤖', description: 'Futuristisches Neon-Design' },
        { value: 'valentine', name: 'Valentine', icon: '💖', description: 'Romantisches Design' },
        { value: 'halloween', name: 'Halloween', icon: '🎃', description: 'Gruseliges Halloween-Design' },
        { value: 'garden', name: 'Garden', icon: '🌻', description: 'Natürliches Garten-Design' },
        { value: 'aqua', name: 'Aqua', icon: '🌊', description: 'Frisches Wasser-Design' },
        { value: 'lofi', name: 'Lo-Fi', icon: '🎵', description: 'Entspanntes Design' },
        { value: 'pastel', name: 'Pastel', icon: '🎨', description: 'Sanfte Pastellfarben' },
        { value: 'fantasy', name: 'Fantasy', icon: '🧙‍♀️', description: 'Magisches Fantasy-Design' },
        { value: 'wireframe', name: 'Wireframe', icon: '📐', description: 'Minimalistisches Wireframe' },
        { value: 'black', name: 'Black', icon: '⚫', description: 'Elegantes schwarzes Design' },
        { value: 'luxury', name: 'Luxury', icon: '💰', description: 'Luxuriöses Gold-Design' },
        { value: 'dracula', name: 'Dracula', icon: '🧛', description: 'Elegantes dunkles Design' },
        { value: 'cmyk', name: 'CMYK', icon: '🖨️', description: 'Druckfarben-Palette' },
        { value: 'autumn', name: 'Autumn', icon: '🍂', description: 'Warme Herbstfarben' },
        { value: 'business', name: 'Business', icon: '📊', description: 'Seriöses Business-Design' },
        { value: 'acid', name: 'Acid', icon: '🟢', description: 'Knalliges Acid-Design' },
        { value: 'lemonade', name: 'Lemonade', icon: '🍋', description: 'Frisches Zitronen-Design' },
        { value: 'night', name: 'Night', icon: '🌃', description: 'Nächtliches Design' },
        { value: 'coffee', name: 'Coffee', icon: '☕', description: 'Gemütliches Kaffee-Design' },
        { value: 'winter', name: 'Winter', icon: '❄️', description: 'Kühles Winter-Design' }
    ];
}

detectPreferredTheme() {
    // System-Präferenz erkennen
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark';
    }
    
    // Uhrzeit-basierte Empfehlung
    const hour = new Date().getHours();
    if (hour >= 20 || hour <= 6) {
        return 'dark';
    }
    
    return 'light';
}

onThemeChanged(themeData) {
    // Zusätzliche Aktionen bei Theme-Wechsel
    
    // Service Worker benachrichtigen (falls verfügbar)
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
            type: 'THEME_CHANGED',
            theme: themeData.theme
        });
    }
    
    // Analytics Update (anonymisiert)
    if (JSON.parse(localStorage.getItem('analyticsSharing') || 'false')) {
        console.log(`📊 Theme-Wechsel: ${themeData.theme} (Analytics)`);
    }
    
    // Progressive Enhancement für Theme
    this.enhanceThemeExperience(themeData.theme);
}

enhanceThemeExperience(theme) {
    // Scroll-to-Top Button Style anpassen
    const scrollBtn = document.querySelector('.scroll-to-top');
    if (scrollBtn) {
        scrollBtn.className = `scroll-to-top btn btn-circle btn-primary ${theme.includes('dark') ? 'btn-outline' : ''}`;
    }
    
    // Loading Spinner Farbe anpassen
    const loadingElements = document.querySelectorAll('.loading');
    loadingElements.forEach(loader => {
        if (theme === 'cyberpunk' || theme === 'synthwave') {
            loader.classList.add('loading-accent');
        } else {
            loader.classList.remove('loading-accent');
        }
    });
}

// 1. KORRELATIONSANALYSE
generateCorrelationAnalysis() {
    if (!this.advancedMode) return;
    
    console.log('🔗 Generating correlation analysis');
    
    const healthData = this.getHealthData();
    const correlations = {};
    
    // Beispiel: Schlaf vs. Stimmung Korrelation
    const sleepMoodCorr = this.calculateCorrelation('sleep', 'mood', healthData);
    const stepsMoodCorr = this.calculateCorrelation('steps', 'mood', healthData);
    const waterEnergyCorr = this.calculateCorrelation('water', 'mood', healthData);
    
    return {
        sleepMood: { value: sleepMoodCorr, interpretation: this.interpretCorrelation(sleepMoodCorr, 'Schlaf', 'Stimmung') },
        stepsMood: { value: stepsMoodCorr, interpretation: this.interpretCorrelation(stepsMoodCorr, 'Schritte', 'Stimmung') },
        waterEnergy: { value: waterEnergyCorr, interpretation: this.interpretCorrelation(waterEnergyCorr, 'Wasser', 'Energie') }
    };
}

// 2. TRENDANALYSE MIT PROGNOSEN
generateTrendForecast(metric, days = 7) {
    if (!this.advancedMode) return;
    
    console.log(`📈 Generating ${days}-day forecast for ${metric}`);
    
    const data = this.getMetricData(metric, 30); // Letzte 30 Tage
    if (data.length < 7) return null;
    
    // Vereinfachte lineare Regression für Trend
    const trend = this.calculateLinearTrend(data);
    const forecast = [];
    
    for (let i = 1; i <= days; i++) {
        const forecastValue = data[data.length - 1].value + (trend.slope * i);
        forecast.push({
            date: new Date(Date.now() + i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            value: Math.max(0, forecastValue),
            confidence: Math.max(0.3, 0.9 - (i * 0.1)) // Abnehmendes Vertrauen
        });
    }
    
    return {
        trend: trend,
        forecast: forecast,
        accuracy: this.calculateForecastAccuracy(data)
    };
}

// 3. GESUNDHEITS-SCORE BERECHNUNG
calculateHealthScore() {
    if (!this.advancedMode) return { score: 0, details: {} };
    
    console.log('🎯 Calculating comprehensive health score');
    
    const today = new Date().toISOString().split('T')[0];
    const data = this.getHealthData()[today] || {};
    const goals = this.getCurrentGoals();
    
    let totalScore = 0;
    let maxScore = 0;
    const details = {};
    
    // Gewichtung der verschiedenen Metriken
    const weights = {
        steps: 25,    // 25% Gewichtung
        water: 20,    // 20% Gewichtung  
        sleep: 25,    // 25% Gewichtung
        mood: 15,     // 15% Gewichtung
        weight: 15    // 15% Gewichtung
    };
    
    Object.entries(weights).forEach(([metric, weight]) => {
        if (data[metric] !== undefined) {
            const score = this.calculateMetricScore(metric, data[metric], goals);
            details[metric] = {
                score: score,
                weight: weight,
                contribution: (score * weight) / 100
            };
            totalScore += (score * weight) / 100;
        }
        maxScore += weight;
    });
    
    const finalScore = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;
    
    return {
        score: finalScore,
        grade: this.getHealthGrade(finalScore),
        details: details,
        recommendations: this.generateRecommendations(details)
    };
}

// 4. ANOMALIE-ERKENNUNG
detectAnomalies() {
    if (!this.advancedMode) return [];
    
    console.log('🚨 Detecting health data anomalies');
    
    const anomalies = [];
    const metrics = ['steps', 'water', 'sleep', 'weight'];
    
    metrics.forEach(metric => {
        const data = this.getMetricData(metric, 14); // Letzte 14 Tage
        if (data.length < 7) return;
        
        const stats = this.calculateStats(data);
        const threshold = 2; // 2 Standardabweichungen
        
        data.slice(-3).forEach(point => { // Letzte 3 Tage prüfen
            if (Math.abs(point.value - stats.mean) > threshold * stats.stdDev) {
                anomalies.push({
                    metric: metric,
                    date: point.date,
                    value: point.value,
                    expected: stats.mean,
                    deviation: Math.abs(point.value - stats.mean),
                    severity: this.getAnomalySeverity(Math.abs(point.value - stats.mean), stats.stdDev)
                });
            }
        });
    });
    
    return anomalies;
}

// 5. PERSONALISIERTE INSIGHTS
generatePersonalizedInsights() {
    if (!this.advancedMode) return [];
    
    console.log('💡 Generating personalized health insights');
    
    const insights = [];
    const healthData = this.getHealthData();
    const recentData = this.getRecentData(7); // Letzte 7 Tage
    
    // Insight 1: Beste Tage identifizieren
    const bestDays = this.findBestPerformanceDays();
    if (bestDays.length > 0) {
        insights.push({
            type: 'performance',
            title: '🌟 Deine stärksten Tage',
            description: `Du bist besonders aktiv an ${bestDays.join(', ')}. Plane wichtige Aktivitäten an diesen Tagen!`,
            priority: 'high',
            actionable: true
        });
    }
    
    // Insight 2: Schlaf-Aktivität Zusammenhang
    const sleepActivityCorr = this.calculateCorrelation('sleep', 'steps', healthData);
    if (sleepActivityCorr > 0.5) {
        insights.push({
            type: 'correlation',
            title: '😴 Schlaf steigert deine Aktivität',
            description: `Mehr Schlaf führt zu ${Math.round(sleepActivityCorr * 100)}% mehr Aktivität am nächsten Tag.`,
            priority: 'medium',
            actionable: true
        });
    }
    
    // Insight 3: Hydration Pattern
    const waterPattern = this.analyzeHydrationPattern();
    if (waterPattern.recommendation) {
        insights.push({
            type: 'hydration',
            title: '💧 Optimiere deine Flüssigkeitszufuhr',
            description: waterPattern.recommendation,
            priority: 'medium',
            actionable: true
        });
    }
    
    return insights;
}

calculateCorrelation(metric1, metric2, data) {
    const pairs = [];
    
    Object.entries(data).forEach(([date, dayData]) => {
        if (dayData[metric1] !== undefined && dayData[metric2] !== undefined) {
            pairs.push([dayData[metric1], dayData[metric2]]);
        }
    });
    
    if (pairs.length < 3) return 0;
    
    // Pearson Korrelationskoeffizient
    const n = pairs.length;
    const sum1 = pairs.reduce((sum, pair) => sum + pair[0], 0);
    const sum2 = pairs.reduce((sum, pair) => sum + pair[1], 0);
    const sum1Sq = pairs.reduce((sum, pair) => sum + pair[0] * pair[0], 0);
    const sum2Sq = pairs.reduce((sum, pair) => sum + pair[1] * pair[1], 0);
    const pSum = pairs.reduce((sum, pair) => sum + pair[0] * pair[1], 0);
    
    const num = pSum - (sum1 * sum2 / n);
    const den = Math.sqrt((sum1Sq - sum1 * sum1 / n) * (sum2Sq - sum2 * sum2 / n));
    
    return den === 0 ? 0 : num / den;
}

interpretCorrelation(value, metric1, metric2) {
    const abs = Math.abs(value);
    let strength = '';
    
    if (abs >= 0.7) strength = 'starke';
    else if (abs >= 0.4) strength = 'moderate';
    else if (abs >= 0.2) strength = 'schwache';
    else return `Keine signifikante Korrelation zwischen ${metric1} und ${metric2}.`;
    
    const direction = value > 0 ? 'positive' : 'negative';
    
    return `${strength.charAt(0).toUpperCase() + strength.slice(1)} ${direction} Korrelation zwischen ${metric1} und ${metric2} (${Math.round(abs * 100)}%).`;
}

calculateLinearTrend(data) {
    const n = data.length;
    const x = data.map((_, i) => i);
    const y = data.map(d => d.value);
    
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    return { slope, intercept, trend: slope > 0 ? 'steigend' : slope < 0 ? 'fallend' : 'stabil' };
}

getHealthGrade(score) {
    if (score >= 90) return { grade: 'A', description: 'Ausgezeichnet', color: 'success' };
    if (score >= 80) return { grade: 'B', description: 'Sehr gut', color: 'success' };
    if (score >= 70) return { grade: 'C', description: 'Gut', color: 'info' };
    if (score >= 60) return { grade: 'D', description: 'Befriedigend', color: 'warning' };
    return { grade: 'F', description: 'Verbesserungsbedarf', color: 'error' };
}

generateRecommendations(details) {
    const recommendations = [];
    
    Object.entries(details).forEach(([metric, data]) => {
        if (data.score < 70) {
            const recommendation = this.getMetricRecommendation(metric, data.score);
            if (recommendation) recommendations.push(recommendation);
        }
    });
    
    return recommendations.slice(0, 3); // Top 3 Empfehlungen
}

getMetricRecommendation(metric, score) {
    const recommendations = {
        steps: 'Versuche täglich 1000 zusätzliche Schritte zu gehen. Nimm die Treppe statt den Aufzug.',
        water: 'Stelle dir eine Wasserflasche sichtbar auf den Schreibtisch als Erinnerung.',
        sleep: 'Erstelle eine feste Abendroutine und gehe jeden Tag zur gleichen Zeit ins Bett.',
        mood: 'Plane täglich 10 Minuten für Entspannung oder Meditation ein.',
        weight: 'Fokussiere dich auf eine ausgewogene Ernährung und regelmäßige Bewegung.'
    };
    
    return recommendations[metric] || null;
}

/**
 * Enhanced Notification Integration
 */
async initializeNotifications() {
    try {
        if (!this.notificationManager) {
            this.notificationManager = new SmartNotificationManager(this);
        }
        
        // Toast-Container sicherstellen
        this.ensureToastContainer();
        
        // Notification permission prüfen
        await this.checkNotificationPermission();
        
        console.log('✅ Notifications initialisiert');
        
    } catch (error) {
        console.error('❌ Notification Init Fehler:', error);
        this.showToast('⚠️ Benachrichtigungen konnten nicht initialisiert werden', 'warning');
    }
}

/**
 * Toast Container sicherstellen
 */
ensureToastContainer() {
    if (!document.getElementById('toast-container')) {
        const container = document.createElement('div');
        container.id = 'toast-container';
        container.className = 'toast toast-end toast-bottom z-50 space-y-2';
        document.body.appendChild(container);
        
        console.log('📢 Toast Container erstellt');
    }
}

/**
 * Erweiterte Toast-Wrapper für verschiedene Use Cases
 */
showSuccessToast(message, subtitle = null, duration = 4000) {
    return this.showToast(message, 'success', duration, { subtitle });
}

showErrorToast(message, subtitle = null, duration = 6000) {
    return this.showToast(message, 'error', duration, { subtitle, sound: true });
}

showWarningToast(message, subtitle = null, duration = 5000) {
    return this.showToast(message, 'warning', duration, { subtitle });
}

showInfoToast(message, subtitle = null, duration = 3000) {
    return this.showToast(message, 'info', duration, { subtitle });
}

/**
 * Persistent Toast (manuelles Schließen erforderlich)
 */
showPersistentToast(message, type = 'info', options = {}) {
    return this.showToast(message, type, 0, { 
        ...options, 
        closable: true,
        progress: false 
    });
}

/**
 * Quick Toast für kurze Bestätigungen
 */
showQuickToast(message, type = 'success') {
    return this.showToast(message, type, 2000, { 
        closable: false,
        sound: false 
    });
}
}

// ====================================================================
// SMART NOTIFICATION MANAGER
// ====================================================================

class SmartNotificationManager {
    constructor(healthTracker) {
        this.healthTracker = healthTracker;
        this.notificationQueue = [];
        this.activeNotifications = new Map();
        this.reminderIntervals = new Map();
        this.notificationsEnabled = false;
        this.smartCheckInterval = null;
        
        this.initialize();
    }
    
    /**
     * Initialize notification system
     */
    async initialize() {
        console.log('🔔 Smart Notification Manager wird initialisiert...');
        
        // Check browser support
        if (!('Notification' in window)) {
            console.log('ℹ️ Browser unterstützt keine Benachrichtigungen');
            return;
        }
        
        const permission = await this.checkNotificationPermission();
        
        if (permission === 'granted') {
            this.notificationsEnabled = true;
            this.setupSmartReminders();
        } else if (permission === 'default') {
            // Show permission request after 30 seconds
            setTimeout(() => this.showPermissionModal(), 30000);
        }
        
        // Always setup in-app notifications
        this.setupInAppNotifications();
        // Initialize footer through health tracker
        if (this.healthTracker && typeof this.healthTracker.initializeFooter === 'function') {
            this.healthTracker.initializeFooter();
        }
        
        console.log('✅ Smart Notification Manager initialisiert');
    }
    
    /**
     * Check current notification permission
     */
    async checkNotificationPermission() {
        if (Notification.permission === 'granted') return 'granted';
        if (Notification.permission === 'denied') return 'denied';
        return 'default';
    }
    
    /**
     * Show permission request modal
     */
    showPermissionModal() {
        const modal = document.getElementById('notification-permission-modal');
        const enableBtn = document.getElementById('enable-notifications-btn');
        
        if (modal && enableBtn) {
            modal.showModal();
            enableBtn.onclick = () => this.requestNotificationPermission();
        } else {
            // Fallback: direct permission request
            this.requestNotificationPermission();
        }
    }
    
    /**
     * Request notification permission
     */
    async requestNotificationPermission() {
        try {
            const permission = await Notification.requestPermission();
            
            if (permission === 'granted') {
                this.notificationsEnabled = true;
                this.setupSmartReminders();
                this.showInAppNotification('🔔 Benachrichtigungen aktiviert!', 'success');
                
                const modal = document.getElementById('notification-permission-modal');
                if (modal) modal.close();
            } else {
                this.showInAppNotification('📵 Benachrichtigungen deaktiviert', 'warning');
            }
        } catch (error) {
            console.error('❌ Notification permission error:', error);
        }
    }
    
    /**
     * Setup smart reminder system
     */
    setupSmartReminders() {
        // Clear existing intervals
        this.reminderIntervals.forEach(interval => clearInterval(interval));
        this.reminderIntervals.clear();
        
        if (!this.notificationsEnabled) return;
        
        // Water reminder: Every 2 hours between 9-21
        const waterInterval = setInterval(() => {
            const hour = new Date().getHours();
            if (hour >= 9 && hour <= 21 && hour % 2 === 1) {
                this.checkWaterIntakeReminder();
            }
        }, 60 * 60 * 1000);
        
        // Steps motivation: 15:00 daily
        const stepsInterval = setInterval(() => {
            const now = new Date();
            if (now.getHours() === 15 && now.getMinutes() === 0) {
                this.checkStepsProgressReminder();
            }
        }, 60 * 1000);
        
        // Sleep reminder: 22:00 daily
        const sleepInterval = setInterval(() => {
            const now = new Date();
            if (now.getHours() === 22 && now.getMinutes() === 0) {
                this.sendSleepReminder();
            }
        }, 60 * 1000);
        
        // Daily tracking reminder: 20:00 if no data today
        const trackingInterval = setInterval(() => {
            const now = new Date();
            if (now.getHours() === 20 && now.getMinutes() === 0) {
                this.checkDailyTrackingReminder();
            }
        }, 60 * 1000);
        
        // Smart motivational checks: Every 3 hours
        const motivationInterval = setInterval(() => {
            this.performSmartChecks();
        }, 3 * 60 * 60 * 1000);
        
        this.reminderIntervals.set('water', waterInterval);
        this.reminderIntervals.set('steps', stepsInterval);
        this.reminderIntervals.set('sleep', sleepInterval);
        this.reminderIntervals.set('tracking', trackingInterval);
        this.reminderIntervals.set('motivation', motivationInterval);
        
        console.log('⏰ Smart Reminders konfiguriert');
    }
    
    /**
     * Check water intake and send reminder if needed
     */
    async checkWaterIntakeReminder() {
        try {
            const todayData = await this.getTodayData();
            const currentWater = todayData?.waterIntake || 0;
            const goal = this.healthTracker.goals.waterGoal;
            
            const progress = goal > 0 ? (currentWater / goal) : 0;
            
            if (progress < 0.7) {
                this.sendNotification(
                    '💧 Wasser-Erinnerung',
                    `Du hast heute erst ${currentWater}L getrunken. Zeit für ein Glas Wasser!`,
                    'water',
                    [{ action: 'drink', title: 'Getrunken!' }]
                );
            }
        } catch (error) {
            console.error('❌ Water reminder error:', error);
        }
    }
    
    /**
     * Check steps progress and send motivational message
     */
    async checkStepsProgressReminder() {
        try {
            const todayData = await this.getTodayData();
            const currentSteps = todayData?.steps || 0;
            const goal = this.healthTracker.goals.stepsGoal;
            
            const progress = goal > 0 ? (currentSteps / goal) : 0;
            
            if (progress < 0.6) {
                this.sendNotification(
                    '🚶‍♂️ Bewegung tut gut!',
                    `${currentSteps.toLocaleString()} Schritte geschafft. Wie wäre es mit einem kurzen Spaziergang?`,
                    'steps'
                );
            } else if (progress >= 0.9 && progress < 1) {
                const remaining = goal - currentSteps;
                this.sendNotification(
                    '🎉 Fast geschafft!',
                    `Nur noch ${remaining.toLocaleString()} Schritte bis zum Tagesziel!`,
                    'steps'
                );
            }
        } catch (error) {
            console.error('❌ Steps reminder error:', error);
        }
    }
    
    /**
     * Send sleep reminder
     */
    sendSleepReminder() {
        this.sendNotification(
            '🌙 Zeit fürs Bett',
            'Um dein Schlafziel zu erreichen, solltest du langsam ans Schlafen denken.',
            'sleep'
        );
    }
    
    /**
     * Check if daily tracking reminder is needed
     */
    async checkDailyTrackingReminder() {
        try {
            const todayData = await this.getTodayData();
            
            // Check if user has entered any data today
            const hasData = todayData && (
                todayData.weight || todayData.steps || 
                todayData.waterIntake || todayData.sleepHours || 
                todayData.mood
            );
            
            if (!hasData) {
                this.sendNotification(
                    '📊 Vergiss nicht zu tracken!',
                    'Du hast heute noch keine Gesundheitsdaten erfasst.',
                    'tracking'
                );
            }
        } catch (error) {
            console.error('❌ Daily tracking reminder error:', error);
        }
    }
    
    /**
     * Perform smart motivational checks
     */
    async performSmartChecks() {
        try {
            const data = await this.healthTracker.getAllHealthData();
            const recentData = data.slice(0, 7); // Last 7 days
            
            // Check for positive trends
            this.checkPositiveTrends(recentData);
            
            // Check for concerning patterns
            this.checkConcerningPatterns(recentData);
            
            // Check for milestones
            this.checkMilestones(data);
            
        } catch (error) {
            console.error('❌ Smart checks error:', error);
        }
    }
    
    /**
     * Check for positive trends and celebrate
     */
    checkPositiveTrends(recentData) {
        if (recentData.length < 3) return;
        
        // Check steps trend
        const stepsData = recentData.filter(d => d.steps).map(d => d.steps);
        if (stepsData.length >= 3) {
            const trend = this.calculateTrend(stepsData);
            if (trend > 0.1) { // 10% upward trend
                this.sendNotification(
                    '📈 Toller Fortschritt!',
                    'Deine Schritte zeigen eine positive Entwicklung. Weiter so!',
                    'achievement'
                );
            }
        }
    }
    
    /**
     * Check for concerning patterns
     */
    checkConcerningPatterns(recentData) {
        const sleepData = recentData.filter(d => d.sleepHours).map(d => d.sleepHours);
        
        if (sleepData.length >= 3) {
            const avgSleep = sleepData.reduce((a, b) => a + b, 0) / sleepData.length;
            
            if (avgSleep < 6) {
                this.sendNotification(
                    '😴 Schlaf ist wichtig',
                    'Du schläfst in letzter Zeit wenig. Ausreichend Schlaf ist für deine Gesundheit wichtig.',
                    'sleep'
                );
            }
        }
    }
    
    /**
     * Check for milestones and achievements
     */
    checkMilestones(allData) {
        // Check total steps milestone
        const totalSteps = allData.reduce((sum, d) => sum + (d.steps || 0), 0);
        const milestones = [10000, 50000, 100000, 250000, 500000, 1000000];
        
        milestones.forEach(milestone => {
            if (totalSteps >= milestone && !this.hasSeenMilestone(`steps_${milestone}`)) {
                this.sendNotification(
                    '🎯 Meilenstein erreicht!',
                    `Du hast insgesamt ${milestone.toLocaleString()} Schritte erreicht! Fantastisch!`,
                    'achievement'
                );
                this.markMilestoneSeen(`steps_${milestone}`);
            }
        });
    }
    
    /**
     * Calculate trend from array of numbers
     */
    calculateTrend(data) {
        if (data.length < 2) return 0;
        
        const first = data[data.length - 1];
        const last = data[0];
        
        return (first - last) / last;
    }
    
    /**
     * Check if milestone has been seen
     */
    hasSeenMilestone(milestoneId) {
        const seen = JSON.parse(localStorage.getItem('seenMilestones') || '[]');
        return seen.includes(milestoneId);
    }
    
    /**
     * Mark milestone as seen
     */
    markMilestoneSeen(milestoneId) {
        const seen = JSON.parse(localStorage.getItem('seenMilestones') || '[]');
        seen.push(milestoneId);
        localStorage.setItem('seenMilestones', JSON.stringify(seen));
    }
    
    /**
     * Get today's data
     */
    async getTodayData() {
        try {
            const today = new Date().toISOString().split('T')[0];
            const allData = await this.healthTracker.getAllHealthData();
            return allData.find(entry => entry.date === today) || null;
        } catch (error) {
            console.error('❌ Error getting today data:', error);
            return null;
        }
    }
    
    /**
     * Send notification (browser + in-app)
     */
    sendNotification(title, body, type = 'info', actions = []) {
        // Browser notification
        if (this.notificationsEnabled && Notification.permission === 'granted') {
            const notification = new Notification(title, {
                body,
                icon: '/icons/icon-192x192.png',
                badge: '/icons/icon-96x96.png',
                tag: type,
                requireInteraction: false,
                actions: actions.map(action => ({
                    action: action.action,
                    title: action.title
                }))
            });
            
            notification.onclick = () => {
                window.focus();
                notification.close();
                this.handleNotificationClick(type);
            };
            
            // Auto-close after 10 seconds
            setTimeout(() => notification.close(), 10000);
            
            // Store active notification
            this.activeNotifications.set(type, notification);
        }
        
        // Always show in-app notification
        this.showInAppNotification(`${title}: ${body}`, this.getNotificationStyle(type));
    }
    
    /**
     * Setup in-app notification system
     */
    setupInAppNotifications() {
        // Create notification center if it doesn't exist
        let notificationCenter = document.getElementById('notification-center');
        if (!notificationCenter) {
            notificationCenter = document.createElement('div');
            notificationCenter.id = 'notification-center';
            notificationCenter.className = 'fixed top-4 right-4 z-50 space-y-2';
            document.body.appendChild(notificationCenter);
        }
    }
    
    /**
     * Show in-app notification
     */
    showInAppNotification(message, type = 'info', duration = 5000) {
        const container = document.getElementById('notification-center');
        if (!container) return;
        
        const notificationId = Date.now();
        const notification = document.createElement('div');
        
        const bgColors = {
            success: 'alert-success',
            error: 'alert-error',
            warning: 'alert-warning',
            info: 'alert-info'
        };
        
        notification.className = `alert ${bgColors[type] || 'alert-info'} shadow-lg transform transition-all duration-300 translate-x-full max-w-sm`;
        notification.innerHTML = `
            <div>
                <span class="text-sm">${message}</span>
                <button class="btn btn-sm btn-circle btn-ghost absolute top-1 right-1" onclick="this.parentElement.parentElement.remove()">
                    <i data-lucide="x" class="w-4 h-4"></i>
                </button>
            </div>
        `;
        
        container.appendChild(notification);
        
        // Animate in
        setTimeout(() => {
            notification.classList.remove('translate-x-full');
        }, 100);
        
        // Re-initialize lucide icons
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
        
        // Auto remove
        if (duration > 0) {
            setTimeout(() => {
                notification.classList.add('translate-x-full');
                setTimeout(() => notification.remove(), 300);
            }, duration);
        }
    }
    
    /**
     * Get notification style for type
     */
    getNotificationStyle(type) {
        const styles = {
            water: 'info',
            steps: 'success',
            sleep: 'warning',
            tracking: 'error',
            achievement: 'success'
        };
        return styles[type] || 'info';
    }
    
    /**
     * Handle notification click actions
     */
    handleNotificationClick(type) {
        switch (type) {
            case 'water':
            case 'steps':
            case 'sleep':
            case 'tracking':
                // Scroll to health form
                document.getElementById('health-form')?.scrollIntoView({ 
                    behavior: 'smooth' 
                });
                break;
            case 'achievement':
                // Show progress hub
                this.healthTracker.progressHub?.showView('achievements');
                break;
        }
    }
    
    /**
     * Cleanup notification system
     */
    cleanup() {
        // Clear all intervals
        this.reminderIntervals.forEach(interval => clearInterval(interval));
        this.reminderIntervals.clear();
        
        // Clear active notifications
        this.activeNotifications.forEach(notification => notification.close());
        this.activeNotifications.clear();
    }
}

// ====================================================================
// ENHANCED PROGRESS HUB CLASS - DaisyUI Version
// ====================================================================

class ProgressHub {
    constructor(healthTracker) {
        this.healthTracker = healthTracker;
        this.currentView = 'today';
        this.todayData = {};
        this.weekData = [];
        this.monthData = [];
        this.refreshTimer = null;
        
        this.setupEventListeners();
        this.loadViewData();
        this.setupAutoRefresh();
    }

    /**
     * Setup event listeners for progress hub
     */
    setupEventListeners() {
        // Listen for health data updates
        document.addEventListener('health-data-saved', (event) => {
            this.handleDataUpdate(event.detail);
        });
        
        document.addEventListener('health-data-saved-offline', (event) => {
            this.handleDataUpdate(event.detail);
        });

        // Listen for goal updates
        document.addEventListener('goals-updated', () => {
            this.loadViewData();
            this.showView(this.currentView);
        });

        // Tab switching
        document.querySelectorAll('[id^="tab-"]').forEach(tab => {
            tab.addEventListener('click', (e) => {
                e.preventDefault();
                const viewName = tab.id.replace('tab-', '');
                this.showView(viewName);
            });
        });
    }

    /**
     * Setup auto-refresh every 30 seconds
     */
    setupAutoRefresh() {
        this.refreshTimer = setInterval(async () => {
            if (this.currentView === 'today') {
                await this.loadViewData();
                this.showTodayView();
            }
        }, 30000); // 30 seconds
    }

    /**
     * Handle new data updates with smart refresh
     */
    async handleDataUpdate(newData) {
        console.log('🔄 Progress Hub: Neue Daten empfangen', newData);
        
        // Clear cache to ensure fresh data
        this.healthTracker.cache.delete('allHealthData');
        
        // Reload data and update current view
        await this.loadViewData();
        this.showView(this.currentView);
        
        // Show update notification with details
        const dataTypes = this.getDataTypesFromEntry(newData);
        this.healthTracker.showToast(
            `📊 Progress Hub aktualisiert (${dataTypes.join(', ')})`, 
            'success', 
            3000
        );
    }

    /**
     * Get data types from entry for notification
     */
    getDataTypesFromEntry(data) {
        const types = [];
        if (data.weight) types.push('Gewicht');
        if (data.steps) types.push('Schritte');
        if (data.waterIntake) types.push('Wasser');
        if (data.sleepHours) types.push('Schlaf');
        if (data.mood) types.push('Stimmung');
        if (data.notes) types.push('Notizen');
        return types.length > 0 ? types : ['Daten'];
    }

    /**
 * Load data for Progress Hub views using existing showTodayView/showWeeklyView methods
 */
async loadViewData() {
  console.log(`📊 Loading view data for: ${this.currentView || 'undefined'}`);
  
  if (!this.currentView) {
    console.log('⚠️ No current view set, defaulting to today');
    this.currentView = 'today';
  }
  
  try {
    
    // Load fresh data from HealthTracker
    this.allData = await this.healthTracker.getAllHealthData();
    this.todayData = this.healthTracker.getTodayData(this.allData);
    this.weekData = this.healthTracker.getWeekData(this.allData);
    
    console.log(`📈 Loaded data - Total: ${this.allData.length}, Today: ${Object.keys(this.todayData).length}, Week: ${this.weekData.length}`);
    
    // Update the current view with fresh data
    switch(this.currentView) {
      case 'today':
        this.showTodayView();
        break;
      case 'week':
        this.showWeeklyView();
        break;
      case 'goals':
        this.showGoalsView();
        break;
      case 'achievements':
        this.showAchievementsView();
        break;
      default:
        console.log(`⚠️ Unknown view: ${this.currentView}, showing today view as fallback`);
        this.currentView = 'today';
        this.showTodayView();
    }
    
  } catch (error) {
    console.error('❌ ProgressHub loadViewData error:', error);
  }
}

    /**
     * Get current month's data
     */
    getMonthData(allData) {
        const now = new Date();
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        
        return allData.filter(entry => {
            const entryDate = new Date(entry.date);
            return entryDate >= firstDayOfMonth && entryDate <= now;
        });
    }

    /**
Show a specific Progress Hub view and toggle tab states
*/
showView(view) {
  console.log(`🎯 ProgressHub showView called with: ${view}`);
  
  // Set current view
  this.currentView = view;
  
  // Hide all view containers
  const containers = [
    'progress-today-view',
    'progress-weekly-view', 
    'progress-goals-view',
    'progress-achievements-view'
  ];
  
  containers.forEach(containerId => {
    const container = document.getElementById(containerId);
    if (container) {
      container.style.display = 'none';
    }
  });
  
  // Show the selected view container and call corresponding method
  switch(view) {
    case 'today':
      const todayContainer = document.getElementById('progress-today-view');
      if (todayContainer) {
        todayContainer.style.display = 'block';
        this.showTodayView();
      }
      break;
      
    case 'week':
      const weekContainer = document.getElementById('progress-weekly-view');
      if (weekContainer) {
        weekContainer.style.display = 'block';
        this.showWeeklyView();
      }
      break;
      
    case 'goals':
      const goalsContainer = document.getElementById('progress-goals-view');
      if (goalsContainer) {
        goalsContainer.style.display = 'block';
        this.showGoalsView();
      }
      break;
      
    case 'achievements':
      const achievementsContainer = document.getElementById('progress-achievements-view');
      if (achievementsContainer) {
        achievementsContainer.style.display = 'block';
        this.showAchievementsView();
      }
      break;
      
    default:
      console.log(`⚠️ Unknown view: ${view}, showing today view as fallback`);
      const defaultContainer = document.getElementById('progress-today-view');
      if (defaultContainer) {
        defaultContainer.style.display = 'block';
        this.currentView = 'today';
        this.showTodayView();
      }
  }
}

/** Show today's overview with modern DaisyUI layout */
async showTodayView() {
  console.log('📊 Showing optimized today view...');
  const progressContent = document.getElementById('progress-content');
  if (!progressContent) return;

  // DaisyUI: Hochmodernes Layout (inject once, IDs beibehalten)
  progressContent.innerHTML = `
    <div class="space-y-6">
      <!-- Header -->
      <div class="card bg-gradient-to-br from-base-100 to-base-200/50 border border-base-300/50 shadow-md">
        <div class="card-body p-5 md:p-6">
          <div class="flex items-center justify-between gap-4">
            <div class="flex items-center gap-3">
              <i data-lucide="sunrise" class="w-5 h-5 text-primary"></i>
              <div>
                <div class="text-sm text-base-content/70">Heute</div>
                <div id="today-date" class="text-lg font-semibold">—</div>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <div class="badge badge-ghost gap-1">
                <i data-lucide="flame" class="w-3.5 h-3.5 text-warning"></i>
                <span>Streak</span>
                <span id="today-streak" class="font-semibold">0</span>
              </div>
              <div class="badge badge-ghost gap-1">
                <i data-lucide="check-circle-2" class="w-3.5 h-3.5 text-success"></i>
                <span>Erreicht</span>
                <span id="today-completion-rate" class="font-semibold">0%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- KPIs -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <!-- Schritte -->
        <div class="card bg-base-100 border border-base-300 shadow-sm hover:shadow transition">
          <div class="card-body p-5">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <i data-lucide="footprints" class="w-4 h-4 text-primary"></i>
                <span class="text-sm text-base-content/70">Schritte</span>
              </div>
              <div id="today-steps-badge" class="badge badge-ghost text-xs">Ziel: —</div>
            </div>
            <div class="text-2xl font-bold text-primary mt-1" id="today-steps-display">0</div>
            <progress id="today-steps-progress" class="progress progress-primary w-full mt-3" value="0" max="100"></progress>
          </div>
        </div>
        <!-- Wasser -->
        <div class="card bg-base-100 border border-base-300 shadow-sm hover:shadow transition">
          <div class="card-body p-5">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <i data-lucide="droplets" class="w-4 h-4 text-info"></i>
                <span class="text-sm text-base-content/70">Wasser</span>
              </div>
              <div id="today-water-badge" class="badge badge-ghost text-xs">Ziel: —</div>
            </div>
            <div class="text-2xl font-bold text-info mt-1" id="today-water-display">0L</div>
            <progress id="today-water-progress" class="progress progress-info w-full mt-3" value="0" max="100"></progress>
          </div>
        </div>
        <!-- Schlaf -->
        <div class="card bg-base-100 border border-base-300 shadow-sm hover:shadow transition">
          <div class="card-body p-5">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <i data-lucide="moon" class="w-4 h-4 text-warning"></i>
                <span class="text-sm text-base-content/70">Schlaf</span>
              </div>
              <div id="today-sleep-badge" class="badge badge-ghost text-xs">Ziel: —</div>
            </div>
            <div class="text-2xl font-bold text-warning mt-1" id="today-sleep-display">0h</div>
            <progress id="today-sleep-progress" class="progress progress-warning w-full mt-3" value="0" max="100"></progress>
          </div>
        </div>
        <!-- Gewicht -->
        <div class="card bg-base-100 border border-base-300 shadow-sm hover:shadow transition">
          <div class="card-body p-5">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <i data-lucide="scale" class="w-4 h-4 text-secondary"></i>
                <span class="text-sm text-base-content/70">Gewicht</span>
              </div>
              <div id="today-weight-badge" class="badge badge-ghost text-xs">Letztes</div>
            </div>
            <div class="text-2xl font-bold text-secondary mt-1 flex items-center gap-2">
              <span id="today-weight-display">—</span>
              <span id="weight-trend" class="text-sm opacity-70"></span>
            </div>
          </div>
        </div>
      </div>

      <!-- Notizen -->
      <div id="today-notes-section" class="card bg-base-100 border border-base-300 hidden">
        <div class="card-body p-5">
          <h4 class="card-title text-base flex items-center gap-2">
            <i data-lucide="file-text" class="w-4 h-4 text-primary"></i>
            Notizen
          </h4>
          <pre id="today-notes-content" class="text-sm whitespace-pre-wrap"></pre>
        </div>
      </div>
    </div>
  `;

  if (typeof lucide !== 'undefined') lucide.createIcons();

  // Daten laden
  const allData = await this.healthTracker.getAllHealthData();
  const todayData = this.healthTracker.getTodayData(allData);
  const weekData = this.healthTracker.getWeekData(allData);

  // Datum
  const todayDateEl = document.getElementById('today-date');
  if (todayDateEl) {
    const today = new Date();
    const opts = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    todayDateEl.textContent = today.toLocaleDateString('de-DE', opts);
  }

  // Ziele/Badges
  const goals = this.healthTracker?.goals || {};
  const setBadge = (id, label, goal) => {
    const el = document.getElementById(id);
    if (el) el.textContent = goal ? `${label}: ${goal}` : `${label}: —`;
  };
  setBadge('today-steps-badge', 'Ziel', goals.stepsGoal || 10000);
  setBadge('today-water-badge', 'Ziel', `${goals.waterGoal || 2}L`);
  setBadge('today-sleep-badge', 'Ziel', `${goals.sleepGoal || 8}h`);

  // Streak & Completion
  const streakEl = document.getElementById('today-streak');
  if (streakEl && typeof this.healthTracker.calculateCurrentStreak === 'function') {
    streakEl.textContent = this.healthTracker.calculateCurrentStreak(allData);
  }
  const completionEl = document.getElementById('today-completion-rate');
  if (completionEl) {
    let completed = 0, total = 0;
    if (goals.stepsGoal) { total++; if ((todayData.steps || 0) >= goals.stepsGoal) completed++; }
    if (goals.waterGoal) { total++; if ((todayData.waterIntake || 0) >= goals.waterGoal) completed++; }
    if (goals.sleepGoal) { total++; if ((todayData.sleepHours || 0) >= goals.sleepGoal) completed++; }
    const rate = total > 0 ? Math.round((completed / total) * 100) : 0;
    completionEl.textContent = `${rate}%`;
    const badge = completionEl.closest('.badge');
    if (badge) {
      badge.classList.remove('badge-success','badge-warning','badge-error');
      if (rate >= 80) badge.classList.add('badge-success');
      else if (rate >= 50) badge.classList.add('badge-warning');
      else badge.classList.add('badge-error');
    }
  }

  // Helper Animations
  const animateProgress = (el, pct) => {
    if (!el) return;
    el.value = 0;
    const target = Math.max(0, Math.min(100, Math.round(pct)));
    const step = () => {
      if (el.value >= target) return;
      el.value += Math.max(1, Math.round((target - el.value) / 8));
      requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };
  const setNumber = (id, value, suffix = '', locale = true) => {
    const el = document.getElementById(id);
    if (!el) return;
    const target = value || 0;
    const start = 0, duration = 600, t0 = performance.now();
    const fmt = (v) => (locale ? v.toLocaleString('de-DE') : v) + suffix;
    const tick = (t) => {
      const p = Math.min(1, (t - t0) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = fmt(Math.round(start + (target - start) * eased));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };

  // Werte + Progress
  setNumber('today-steps-display', todayData.steps || 0, '', true);
  animateProgress(document.getElementById('today-steps-progress'), goals.stepsGoal ? (todayData.steps || 0) / goals.stepsGoal * 100 : 0);

  setNumber('today-water-display', todayData.waterIntake || 0, 'L', false);
  animateProgress(document.getElementById('today-water-progress'), goals.waterGoal ? (todayData.waterIntake || 0) / goals.waterGoal * 100 : 0);

  setNumber('today-sleep-display', todayData.sleepHours || 0, 'h', false);
  animateProgress(document.getElementById('today-sleep-progress'), goals.sleepGoal ? (todayData.sleepHours || 0) / goals.sleepGoal * 100 : 0);

  const weightEl = document.getElementById('today-weight-display');
  if (weightEl) weightEl.textContent = todayData.weight ? `${todayData.weight}kg` : '—';

  // Gewichtstrend
  const weightTrendEl = document.getElementById('weight-trend');
  if (weightTrendEl) {
    const recent = (allData || []).filter(e => e.weight).slice(-7).map(e => e.weight);
    if (recent.length >= 2) {
      const change = recent[recent.length - 1] - recent[0];
      weightTrendEl.textContent = Math.abs(change) < 0.1 ? '→' : change > 0 ? '↗️' : '↘️';
      weightTrendEl.className = `text-sm ${change > 0 ? 'text-warning' : change < 0 ? 'text-success' : 'text-base-content/70'}`;
    }
  }

  // Notizen
  const notesSection = document.getElementById('today-notes-section');
  const notesContent = document.getElementById('today-notes-content');
  if (notesSection && notesContent) {
    const txt = todayData.notes?.trim();
    if (txt) {
      notesContent.textContent = txt;
      notesSection.classList.remove('hidden');
    } else {
      notesSection.classList.add('hidden');
    }
  }

  console.log('✅ Today view updated');
}

/** Show weekly view with modern DaisyUI layout */
showWeeklyView() {
  const content = document.getElementById('progress-content');
  if (!content) return;

  content.innerHTML = `
    <div class="space-y-6">
      <!-- Header -->
      <div class="card bg-gradient-to-br from-base-100 to-base-200/50 border border-base-300/50 shadow-md">
        <div class="card-body p-5 md:p-6">
          <div class="flex items-center justify-between gap-4">
            <div class="flex items-center gap-3">
              <i data-lucide="calendar-days" class="w-5 h-5 text-accent"></i>
              <div>
                <div class="text-sm text-base-content/70">Woche</div>
                <div class="text-lg font-semibold" id="weekly-range-label">Letzte 7 Tage</div>
              </div>
            </div>
            <div class="badge badge-ghost gap-1 text-xs" id="weekly-entries-badge">Einträge: —</div>
          </div>
        </div>
      </div>

      <!-- KPI Grid -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div class="card bg-base-100 border border-base-300">
          <div class="card-body p-5">
            <div class="text-sm text-base-content/70 flex items-center gap-2">
              <i data-lucide="footprints" class="w-4 h-4 text-primary"></i> Ø Schritte
            </div>
            <div class="text-2xl font-bold text-primary" id="weekly-avg-steps">0</div>
          </div>
        </div>
        <div class="card bg-base-100 border border-base-300">
          <div class="card-body p-5">
            <div class="text-sm text-base-content/70 flex items-center gap-2">
              <i data-lucide="droplets" class="w-4 h-4 text-info"></i> Ø Wasser
            </div>
            <div class="text-2xl font-bold text-info" id="weekly-avg-water">0L</div>
          </div>
        </div>
        <div class="card bg-base-100 border border-base-300">
          <div class="card-body p-5">
            <div class="text-sm text-base-content/70 flex items-center gap-2">
              <i data-lucide="moon" class="w-4 h-4 text-warning"></i> Ø Schlaf
            </div>
            <div class="text-2xl font-bold text-warning" id="weekly-avg-sleep">0h</div>
          </div>
        </div>
        <div class="card bg-base-100 border border-base-300">
          <div class="card-body p-5">
            <div class="text-sm text-base-content/70 flex items-center gap-2">
              <i data-lucide="list-checks" class="w-4 h-4 text-secondary"></i> Einträge
            </div>
            <div class="text-2xl font-bold text-secondary" id="weekly-total-entries">0</div>
          </div>
        </div>
      </div>

      <!-- Daily breakdown -->
      <div class="card bg-base-100 border border-base-300">
        <div class="card-body p-5">
          <h4 class="card-title text-base flex items-center gap-2">
            <i data-lucide="bar-chart-3" class="w-4 h-4 text-accent"></i>
            Tägliche Aufschlüsselung
          </h4>
          <div id="weekly-chart-container" class="mt-3 space-y-3"></div>
        </div>
      </div>
    </div>
  `;

  if (typeof lucide !== 'undefined') lucide.createIcons();

  // Daten aus loadViewData oder frisch berechnen
  const allData = this.healthTracker.cache?.get?.('allHealthData')?.data || null;
  let weekData = this.weekData;
  if (!weekData) {
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const data = allData || [];
    weekData = data.filter(e => e.date && new Date(e.date) >= oneWeekAgo && new Date(e.date) <= now);
  }

  // KPIs
  const avg = (arr) => (arr.length ? arr.reduce((a,b)=>a+b,0)/arr.length : 0);
  const byDay = {};
  const days = ['So','Mo','Di','Mi','Do','Fr','Sa'];
  const now = new Date();
  for (let i=6;i>=0;i--) {
    const d = new Date(now.getTime() - i*24*60*60*1000);
    const key = d.toISOString().split('T')[0];
    byDay[key] = { date: d, steps: 0, water: 0, sleep: 0, weight: null, hasAny: false };
  }
  (weekData || []).forEach(e => {
    const key = typeof e.date === 'string' ? e.date.split('T')[0] : new Date(e.date).toISOString().split('T')[0];
    if (!byDay[key]) return;
    byDay[key].steps += e.steps || 0;
    byDay[key].water += e.waterIntake || 0;
    byDay[key].sleep += e.sleepHours || 0;
    if (e.weight) byDay[key].weight = e.weight;
    if (e.steps || e.waterIntake || e.sleepHours || e.weight) byDay[key].hasAny = true;
  });

  const dayEntries = Object.values(byDay);
  const avgSteps = Math.round(avg(dayEntries.map(d=>d.steps)));
  const avgWater = Math.round(avg(dayEntries.map(d=>d.water))*10)/10;
  const avgSleep = Math.round(avg(dayEntries.map(d=>d.sleep))*10)/10;
  const totalEntries = (weekData || []).length;

  const setText = (id, val) => { const el=document.getElementById(id); if (el) el.textContent = val; };
  setText('weekly-avg-steps', avgSteps.toLocaleString('de-DE'));
  setText('weekly-avg-water', `${avgWater}L`);
  setText('weekly-avg-sleep', `${avgSleep}h`);
  setText('weekly-total-entries', totalEntries.toString());
  setText('weekly-entries-badge', `Einträge: ${totalEntries}`);

  // Range Label
  const start = dayEntries[0]?.date, end = dayEntries[dayEntries.length-1]?.date;
  const fmt = (d) => d?.toLocaleDateString('de-DE', { day:'2-digit', month:'2-digit' });
  const rangeEl = document.getElementById('weekly-range-label');
  if (rangeEl && start && end) rangeEl.textContent = `${fmt(start)} – ${fmt(end)}`;

  // Daily breakdown render
  const container = document.getElementById('weekly-chart-container');
  if (!container) return;

  container.innerHTML = dayEntries.map((d, idx) => {
    const dayName = days[d.date.getDay()];
    const goalSteps = this.healthTracker?.goals?.stepsGoal || 10000;
    const stepsPct = Math.min(100, Math.round((d.steps/goalSteps)*100));
    const waterGoal = this.healthTracker?.goals?.waterGoal || 2;
    const waterPct = Math.min(100, Math.round((d.water/waterGoal)*100));
    const sleepGoal = this.healthTracker?.goals?.sleepGoal || 8;
    const sleepPct = Math.min(100, Math.round((d.sleep/sleepGoal)*100));

    const badgeClass =
      stepsPct >= 80 || waterPct >= 80 || sleepPct >= 80 ? 'badge-success' :
      stepsPct >= 50 || waterPct >= 50 || sleepPct >= 50 ? 'badge-warning' : 'badge-ghost';

    return `
      <div class="card bg-base-100 border border-base-300/70">
        <div class="card-body p-4">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <div class="font-medium">${dayName}</div>
              <div class="text-xs text-base-content/60">${d.date.toLocaleDateString('de-DE')}</div>
            </div>
            <div class="badge ${badgeClass} text-xs">${d.hasAny ? 'Aktivität' : 'leer'}</div>
          </div>

          <div class="mt-3 space-y-2">
            <div class="flex items-center gap-2 text-xs text-base-content/70">
              <i data-lucide="footprints" class="w-3.5 h-3.5 text-primary"></i>
              <span class="w-20">Schritte</span>
              <progress class="progress progress-primary flex-1" value="${stepsPct}" max="100"></progress>
              <span class="w-16 text-right">${d.steps.toLocaleString('de-DE')}</span>
            </div>
            <div class="flex items-center gap-2 text-xs text-base-content/70">
              <i data-lucide="droplets" class="w-3.5 h-3.5 text-info"></i>
              <span class="w-20">Wasser</span>
              <progress class="progress progress-info flex-1" value="${waterPct}" max="100"></progress>
              <span class="w-16 text-right">${(Math.round(d.water*10)/10)}L</span>
            </div>
            <div class="flex items-center gap-2 text-xs text-base-content/70">
              <i data-lucide="moon" class="w-3.5 h-3.5 text-warning"></i>
              <span class="w-20">Schlaf</span>
              <progress class="progress progress-warning flex-1" value="${sleepPct}" max="100"></progress>
              <span class="w-16 text-right">${(Math.round(d.sleep*10)/10)}h</span>
            </div>
          </div>
        </div>
      </div>
    `;
  }).join('');

  if (typeof lucide !== 'undefined') lucide.createIcons();
}

/** Show goals view with modern DaisyUI layout and live progress (self-contained) */
showGoalsView() {
  const content = document.getElementById('progress-content');
  if (!content) return;

  // Tabs Zustand
  document.getElementById('tab-today')?.classList.remove('tab-active');
  document.getElementById('tab-week')?.classList.remove('tab-active');
  document.getElementById('tab-goals')?.classList.add('tab-active');
  document.getElementById('tab-achievements')?.classList.remove('tab-active');
  this.currentView = 'goals';

  // Layout
  content.innerHTML = `
    <div class="space-y-6">
      <div class="card bg-gradient-to-br from-base-100 to-base-200/50 border border-base-300/50 shadow-md">
        <div class="card-body p-5 md:p-6">
          <div class="flex items-center justify-between gap-4">
            <div class="flex items-center gap-3">
              <i data-lucide="target" class="w-5 h-5 text-primary"></i>
              <div>
                <div class="text-sm text-base-content/70">Ziele</div>
                <div class="text-lg font-semibold">Aktuelle Zielübersicht</div>
              </div>
            </div>
            <button id="edit-goals-btn" class="btn btn-sm btn-primary">
              <i data-lucide="edit-3" class="w-4 h-4"></i>
              Bearbeiten
            </button>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" id="goals-kpi-grid">
        ${['steps','water','sleep','weight'].map(k => `
          <div class="card bg-base-100 border border-base-300 shadow-sm hover:shadow transition">
            <div class="card-body p-5">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  ${k==='steps'?'<i data-lucide="footprints" class="w-4 h-4 text-primary"></i>':''}
                  ${k==='water'?'<i data-lucide="droplets" class="w-4 h-4 text-info"></i>':''}
                  ${k==='sleep'?'<i data-lucide="moon" class="w-4 h-4 text-warning"></i>':''}
                  ${k==='weight'?'<i data-lucide="scale" class="w-4 h-4 text-secondary"></i>':''}
                  <span class="text-sm text-base-content/70">
                    ${k==='steps'?'Schritte':k==='water'?'Wasser':k==='sleep'?'Schlaf':'Gewicht'}
                  </span>
                </div>
                <div id="goal-${k}-target" class="badge badge-ghost text-xs">Ziel: —</div>
              </div>
              <div class="mt-2">
                <div class="text-2xl font-bold ${k==='steps'?'text-primary':k==='water'?'text-info':k==='sleep'?'text-warning':'text-secondary'}" id="goal-${k}-current">—</div>
                ${k!=='weight' ? `<progress id="goal-${k}-progress" class="progress ${k==='steps'?'progress-primary':k==='water'?'progress-info':'progress-warning'} w-full mt-3" value="0" max="100"></progress>` : ''}
              </div>
            </div>
          </div>
        `).join('')}
      </div>

      <div class="card bg-base-100 border border-base-300">
        <div class="card-body p-5">
          <h4 class="card-title text-base flex items-center gap-2">
            <i data-lucide="lightbulb" class="w-4 h-4 text-accent"></i>
            Empfehlungen
          </h4>
          <ul id="goals-insights" class="text-sm space-y-2"></ul>
        </div>
      </div>
    </div>
  `;

  if (typeof window !== 'undefined' && window.lucide?.createIcons) {
    window.lucide.createIcons();
  }

  // Daten besorgen
  const goals = this.healthTracker?.goals || {};
  const allData = this.healthTracker?.cache?.get?.('allHealthData')?.data || [];
  const today = this.healthTracker?.getTodayData?.(allData) || {};

  // Helpers
  const pct = (val, goal) => (!goal || goal <= 0) ? 0 : Math.max(0, Math.min(100, Math.round((val / goal) * 100)));
  const animateProgress = (el, target) => {
    if (!el) return;
    el.value = 0;
    const t = Math.max(0, Math.min(100, Number.isFinite(target) ? target : 0));
    const step = () => {
      if (el.value >= t) return;
      el.value += Math.max(1, Math.round((t - el.value)/8));
      requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };
  const setText = (id, txt) => {
    const el = document.getElementById(id);
    if (el) el.textContent = String(txt);
  };

  // Badges (Zielwerte)
  setText('goal-steps-target', `Ziel: ${goals.stepsGoal ?? 10000}`);
  setText('goal-water-target', `Ziel: ${goals.waterGoal ?? 2}L`);
  setText('goal-sleep-target', `Ziel: ${goals.sleepGoal ?? 8}h`);
  // Für Gewicht gibt es typischerweise kein "Progress", sondern letzten Wert anzeigen
  setText('goal-weight-target', 'Letztes');

  // Current-Werte
  setText('goal-steps-current', (today.steps ?? 0).toLocaleString('de-DE'));
  setText('goal-water-current', `${Math.round(((today.waterIntake ?? 0)*10))/10}L`);
  setText('goal-sleep-current', `${Math.round(((today.sleepHours ?? 0)*10))/10}h`);
  setText('goal-weight-current', (today.weight ?? null) !== null ? `${today.weight}kg` : '—');

  // Progress
  animateProgress(
    document.getElementById('goal-steps-progress'),
    pct(today.steps ?? 0, goals.stepsGoal ?? 10000)
  );
  animateProgress(
    document.getElementById('goal-water-progress'),
    pct(today.waterIntake ?? 0, goals.waterGoal ?? 2)
  );
  animateProgress(
    document.getElementById('goal-sleep-progress'),
    pct(today.sleepHours ?? 0, goals.sleepGoal ?? 8)
  );

  // Insights
  const insightsEl = document.getElementById('goals-insights');
  if (insightsEl) {
    const items = [];

    if (goals.stepsGoal) {
      const diff = (goals.stepsGoal - (today.steps ?? 0));
      items.push(diff <= 0
        ? '✅ Schrittziel erreicht! Stark.'
        : `👟 Noch ${Math.max(0, diff).toLocaleString('de-DE')} Schritte bis zum Ziel.`);
    }

    if (goals.waterGoal) {
      const diff = Math.max(0, (goals.waterGoal - (today.waterIntake ?? 0)));
      items.push(diff <= 0
        ? '💧 Wasserziel erreicht – gut hydriert!'
        : `💧 Trinke noch ${Math.round(diff*10)/10}L für dein Ziel.`);
    }

    if (goals.sleepGoal) {
      const diff = Math.max(0, (goals.sleepGoal - (today.sleepHours ?? 0)));
      items.push(diff <= 0
        ? '😴 Schlafziel erreicht. Weiter so!'
        : `🌙 Plane noch ${Math.round(diff*10)/10}h Schlaf ein.`);
    }

    insightsEl.innerHTML = items
      .map(i => `<li class="flex items-start gap-2"><span class="opacity-60">–</span><span>${i}</span></li>`)
      .join('');
  }

  // Edit-Ziele Modal Hook (optional)
  document.getElementById('edit-goals-btn')?.addEventListener('click', () => {
    document.getElementById('goals-modal')?.showModal?.();
  });
}

/** Show achievements view with modern DaisyUI layout and milestones (self-contained) */
showAchievementsView() {
  const content = document.getElementById('progress-content');
  if (!content) return;

  // Tabs Zustand
  document.getElementById('tab-today')?.classList.remove('tab-active');
  document.getElementById('tab-week')?.classList.remove('tab-active');
  document.getElementById('tab-goals')?.classList.remove('tab-active');
  document.getElementById('tab-achievements')?.classList.add('tab-active');
  this.currentView = 'achievements';

  // Layout
  content.innerHTML = `
    <div class="space-y-6">
      <div class="card bg-gradient-to-br from-base-100 to-base-200/50 border border-base-300/50 shadow-md">
        <div class="card-body p-5 md:p-6">
          <div class="flex items-center justify-between gap-4">
            <div class="flex items-center gap-3">
              <i data-lucide="trophy" class="w-5 h-5 text-warning"></i>
              <div>
                <div class="text-sm text-base-content/70">Erfolge</div>
                <div class="text-lg font-semibold">Meilensteine & Auszeichnungen</div>
              </div>
            </div>
            <div id="achievements-summary" class="badge badge-ghost text-xs">— Auszeichnungen</div>
          </div>
        </div>
      </div>

      <div id="achievements-grid" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"></div>

      <div class="card bg-base-100 border border-base-300">
        <div class="card-body p-5">
          <h4 class="card-title text-base flex items-center gap-2">
            <i data-lucide="flame" class="w-4 h-4 text-error"></i>
            Aktueller Streak
          </h4>
          <div class="flex items-center gap-3">
            <div class="stat">
              <div class="stat-value text-error" id="achievements-streak">0</div>
              <div class="stat-desc">Tage in Folge</div>
            </div>
            <div class="divider divider-horizontal"></div>
            <div class="space-y-2 text-sm">
              <div class="badge">7 Tage</div>
              <div class="badge">14 Tage</div>
              <div class="badge">30 Tage</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  if (typeof window !== 'undefined' && window.lucide?.createIcons) {
    window.lucide.createIcons();
  }

  // Daten aus generateAchievements nutzen
  const data = this.generateAchievements?.() || {
    unlocked: [],
    locked: [],
    longestStreak: 0,
    totalXP: 0
  };

  // Summary + Streak
  const summary = document.getElementById('achievements-summary');
  if (summary) summary.textContent = `${(data.unlocked || []).length} Auszeichnungen`;

  const streakEl = document.getElementById('achievements-streak');
  if (streakEl) {
    // Falls generateAchievements keinen Streak liefert, aus HealthTracker berechnen
    const allData = this.healthTracker?.cache?.get?.('allHealthData')?.data || [];
    const fallbackStreak = typeof this.healthTracker?.calculateCurrentStreak === 'function'
      ? this.healthTracker.calculateCurrentStreak(allData)
      : 0;
    streakEl.textContent = `${data.longestStreak || fallbackStreak || 0}`;
  }

  // Grid rendern
  const grid = document.getElementById('achievements-grid');
  if (!grid) return;

  const cardUnlocked = (a) => `
    <div class="card bg-gradient-to-br from-success/10 to-primary/10 border border-success/20 shadow-sm">
      <div class="card-body p-4">
        <div class="flex items-start gap-3">
          <div class="text-3xl">${a.icon || '🏆'}</div>
          <div class="flex-1">
            <h5 class="font-bold text-success">${a.title}</h5>
            <p class="text-sm text-base-content/70 mb-2">${a.description || ''}</p>
            <div class="flex items-center gap-2">
              <div class="badge badge-success badge-sm">${a.xp || 0} XP</div>
              ${a.unlockedDate ? `<div class="badge badge-ghost badge-sm">${a.unlockedDate}</div>` : ''}
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  const cardLocked = (a) => `
    <div class="card bg-base-200 border border-base-300 shadow-sm opacity-60">
      <div class="card-body p-4">
        <div class="flex items-start gap-3">
          <div class="text-3xl grayscale">${a.icon || '🔒'}</div>
          <div class="flex-1">
            <h5 class="font-bold">${a.title}</h5>
            <p class="text-sm text-base-content/70 mb-2">${a.description || ''}</p>
            <div class="flex items-center gap-2">
              <div class="badge badge-ghost badge-sm">${a.xp || 0} XP</div>
              <div class="badge badge-outline badge-sm">🔒 Gesperrt</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  const unlockedHTML = (data.unlocked || []).map(cardUnlocked).join('');
  const lockedHTML = (data.locked || []).slice(0, 4).map(cardLocked).join('');

  grid.innerHTML = `
    ${unlockedHTML || '<div class="text-sm text-base-content/70">Noch keine Auszeichnungen freigeschaltet.</div>'}
    ${lockedHTML ? `<div class="sm:col-span-2 lg:col-span-3">${lockedHTML}</div>` : ''}
  `;

  if (typeof window !== 'undefined' && window.lucide?.createIcons) {
    window.lucide.createIcons();
  }
}

/** Generate achievements based on user data */
generateAchievements() {
    // Robuste Datenabfrage mit Fallback
    let allData = [];
    
    try {
        if (this.healthTracker && 
            typeof this.healthTracker.getAllHealthData === 'function') {
            allData = this.healthTracker.getAllHealthData() || [];
        }
    } catch (error) {
        console.warn('❌ Fehler beim Laden der Daten für Achievements:', error);
        allData = [];
    }

    // Ensure allData is always an array
    if (!Array.isArray(allData)) {
        allData = [];
    }

    const currentStreak = this.calculateCurrentStreak(allData);
    const totalEntries = allData.length;
    const todayData = this.todayData || {};

    const achievements = {
        unlocked: [],
        locked: [],
        longestStreak: currentStreak,
        totalXP: 0
    };

    // Define all possible achievements
    const allAchievements = [
        {
            id: 'first_entry',
            title: 'Erste Schritte',
            description: 'Ersten Gesundheitseintrag erstellt',
            icon: '🌱',
            xp: 10,
            condition: () => totalEntries >= 1
        },
        {
            id: 'week_streak',
            title: 'Wochenkrieger',
            description: '7 Tage am Stück getrackt',
            icon: '🔥',
            xp: 50,
            condition: () => currentStreak >= 7
        },
        {
            id: 'month_streak',
            title: 'Monatsmeister',
            description: '30 Tage am Stück getrackt',
            icon: '💪',
            xp: 150,
            condition: () => currentStreak >= 30
        },
        {
            id: 'step_master',
            title: 'Schrittmeister',
            description: '10.000 Schritte an einem Tag erreicht',
            icon: '👟',
            xp: 25,
            condition: () => (todayData.steps || 0) >= 10000
        },
        {
            id: 'step_champion',
            title: 'Schritt-Champion',
            description: '20.000 Schritte an einem Tag erreicht',
            icon: '🏃‍♂️',
            xp: 75,
            condition: () => {
                return allData.some(entry => (entry.steps || 0) >= 20000);
            }
        },
        {
            id: 'hydration_hero',
            title: 'Hydrations-Held',
            description: 'Wasserziel 5 Tage in Folge erreicht',
            icon: '💧',
            xp: 30,
            condition: () => {
                if (!this.healthTracker?.goals?.waterGoal) return false;
                let consecutiveDays = 0;
                let maxConsecutive = 0;
                
                // Sort by date descending
                const sortedData = [...allData]
                    .filter(entry => entry.waterIntake >= this.healthTracker.goals.waterGoal)
                    .sort((a, b) => new Date(b.date) - new Date(a.date));
                
                for (let i = 0; i < sortedData.length - 1; i++) {
                    const currentDate = new Date(sortedData[i].date);
                    const nextDate = new Date(sortedData[i + 1].date);
                    const diffDays = Math.abs((currentDate - nextDate) / (1000 * 60 * 60 * 24));
                    
                    if (diffDays === 1) {
                        consecutiveDays++;
                    } else {
                        maxConsecutive = Math.max(maxConsecutive, consecutiveDays);
                        consecutiveDays = 0;
                    }
                }
                
                return Math.max(maxConsecutive, consecutiveDays) >= 5;
            }
        },
        {
            id: 'sleep_champion',
            title: 'Schlaf-Champion',
            description: 'Optimal geschlafen (8h+) 3 Nächte in Folge',
            icon: '😴',
            xp: 40,
            condition: () => {
                let consecutiveNights = 0;
                const sortedData = [...allData]
                    .filter(entry => (entry.sleepHours || 0) >= 8)
                    .sort((a, b) => new Date(b.date) - new Date(a.date));
                
                for (let i = 0; i < sortedData.length - 1; i++) {
                    const currentDate = new Date(sortedData[i].date);
                    const nextDate = new Date(sortedData[i + 1].date);
                    const diffDays = Math.abs((currentDate - nextDate) / (1000 * 60 * 60 * 24));
                    
                    if (diffDays === 1) {
                        consecutiveNights++;
                        if (consecutiveNights >= 3) return true;
                    } else {
                        consecutiveNights = 0;
                    }
                }
                
                return false;
            }
        },
        {
            id: 'data_collector',
            title: 'Datensammler',
            description: '50 Gesundheitseinträge erfasst',
            icon: '📊',
            xp: 60,
            condition: () => totalEntries >= 50
        },
        {
            id: 'data_master',
            title: 'Datenmeister',
            description: '100 Gesundheitseinträge erfasst',
            icon: '🎯',
            xp: 120,
            condition: () => totalEntries >= 100
        },
        {
            id: 'perfect_day',
            title: 'Perfekter Tag',
            description: 'Alle Ziele an einem Tag erreicht',
            icon: '⭐',
            xp: 100,
            condition: () => {
                return allData.some(entry => {
                    const goals = this.healthTracker?.goals || {};
                    let goalsReached = 0;
                    let totalGoals = 0;
                    
                    if (goals.stepsGoal) {
                        totalGoals++;
                        if ((entry.steps || 0) >= goals.stepsGoal) goalsReached++;
                    }
                    if (goals.waterGoal) {
                        totalGoals++;
                        if ((entry.waterIntake || 0) >= goals.waterGoal) goalsReached++;
                    }
                    if (goals.sleepGoal) {
                        totalGoals++;
                        if ((entry.sleepHours || 0) >= goals.sleepGoal) goalsReached++;
                    }
                    
                    return totalGoals > 0 && goalsReached === totalGoals;
                });
            }
        }
    ];

    // Check which achievements are unlocked
    allAchievements.forEach(achievement => {
        try {
            if (achievement.condition()) {
                achievements.unlocked.push({
                    ...achievement,
                    unlockedDate: this.formatRecentDate()
                });
                achievements.totalXP += achievement.xp;
            } else {
                achievements.locked.push(achievement);
            }
        } catch (error) {
            console.warn(`❌ Fehler bei Achievement ${achievement.id}:`, error);
            // If condition fails, treat as locked
            achievements.locked.push(achievement);
        }
    });

    // Sort unlocked achievements by XP (highest first)
    achievements.unlocked.sort((a, b) => b.xp - a.xp);

    return achievements;
}

/** Helper method to format recent date */
formatRecentDate() {
    const now = new Date();
    const hours = now.getHours();
    
    if (hours < 6) return 'Heute Nacht';
    if (hours < 12) return 'Heute Morgen';
    if (hours < 18) return 'Heute Nachmittag';
    return 'Heute Abend';
}

/** Enhanced loading state with modern animation */
showEnhancedLoadingState() {
    const progressLoading = document.getElementById('progress-loading');
    const progressContent = document.getElementById('progress-content');
    
    if (progressLoading && progressContent) {
        // Add smooth transition
        progressContent.style.opacity = '0.5';
        progressContent.style.transform = 'scale(0.98)';
        progressContent.style.transition = 'all 0.3s ease';
        
        progressLoading.classList.remove('hidden');
        progressLoading.innerHTML = `
            <div class="flex items-center justify-center py-12">
                <div class="flex flex-col items-center gap-4">
                    <div class="loading loading-ring loading-lg text-primary"></div>
                    <div class="text-primary font-medium animate-pulse">Optimiere deine Daten...</div>
                </div>
            </div>
        `;
    }
}

/** Update today's date with enhanced formatting */
updateTodayDate() {
    const todayDateEl = document.getElementById('today-date');
    if (todayDateEl) {
        const today = new Date();
        const options = { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        };
        
        const formattedDate = today.toLocaleDateString('de-DE', options);
        const dayOfYear = Math.floor((today - new Date(today.getFullYear(), 0, 0)) / 1000 / 60 / 60 / 24);
        
        todayDateEl.innerHTML = `
            <div class="flex items-center gap-2">
                <span class="font-medium">${formattedDate}</span>
                <div class="badge badge-ghost badge-sm">Tag ${dayOfYear}</div>
            </div>
        `;
    }
}

/** Update today's stats with smooth animations */
async updateTodayStatsWithAnimations(todayData) {
    const stats = [
        {
            id: 'today-steps-display',
            progressId: 'today-steps-progress',
            value: todayData.steps || 0,
            goal: this.healthTracker.goals.stepsGoal,
            format: (val) => val.toLocaleString(),
            color: 'primary'
        },
        {
            id: 'today-water-display',
            progressId: 'today-water-progress',
            value: todayData.waterIntake || 0,
            goal: this.healthTracker.goals.waterGoal,
            format: (val) => `${val}L`,
            color: 'info'
        },
        {
            id: 'today-sleep-display',
            progressId: 'today-sleep-progress',
            value: todayData.sleepHours || 0,
            goal: this.healthTracker.goals.sleepGoal,
            format: (val) => `${val}h`,
            color: 'accent'
        },
        {
            id: 'today-weight-display',
            progressId: null,
            value: todayData.weight || 0,
            goal: null,
            format: (val) => val ? `${val}kg` : '—',
            color: 'secondary'
        }
    ];
    
    // Animate each stat with staggered timing
    for (let i = 0; i < stats.length; i++) {
        setTimeout(() => {
            this.animateStatUpdate(stats[i]);
        }, i * 150);
    }
}

/** Animate individual stat update */
animateStatUpdate(stat) {
    const element = document.getElementById(stat.id);
    const progressElement = stat.progressId ? document.getElementById(stat.progressId) : null;
    
    if (element) {
        // Add loading animation
        element.style.transform = 'scale(1.1)';
        element.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
        element.classList.add('animate-pulse');
        
        setTimeout(() => {
            // Update value with counter animation
            this.animateCounterTo(element, stat.value, stat.format);
            
            // Remove loading state
            element.classList.remove('animate-pulse');
            element.style.transform = 'scale(1)';
            
            // Update progress bar if exists
            if (progressElement && stat.goal) {
                const progress = Math.min((stat.value / stat.goal) * 100, 100);
                this.animateProgressBar(progressElement, progress);
            }
            
            // Add achievement glow if goal reached
            if (stat.goal && stat.value >= stat.goal) {
                element.parentElement.classList.add('ring-2', 'ring-success', 'ring-opacity-50');
                setTimeout(() => {
                    element.parentElement.classList.remove('ring-2', 'ring-success', 'ring-opacity-50');
                }, 2000);
            }
        }, 300);
    }
}

/** Animate counter to target value */
animateCounterTo(element, targetValue, formatter) {
    const startValue = 0;
    const duration = 800;
    const startTime = performance.now();
    
    const animate = (currentTime) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Easing function for smooth animation
        const easeOut = 1 - Math.pow(1 - progress, 3);
        const currentValue = startValue + (targetValue - startValue) * easeOut;
        
        element.textContent = formatter(Math.round(currentValue * 10) / 10);
        
        if (progress < 1) {
            requestAnimationFrame(animate);
        }
    };
    
    requestAnimationFrame(animate);
}

/** Animate progress bar to target percentage */
animateProgressBar(progressElement, targetProgress) {
    progressElement.style.width = '0%';
    progressElement.style.transition = 'width 1s cubic-bezier(0.4, 0, 0.2, 1)';
    
    setTimeout(() => {
        progressElement.style.width = `${targetProgress}%`;
        
        // Add pulse effect when reaching 100%
        if (targetProgress >= 100) {
            setTimeout(() => {
                progressElement.style.animation = 'pulse 0.5s ease-in-out';
                setTimeout(() => {
                    progressElement.style.animation = '';
                }, 500);
            }, 1000);
        }
    }, 100);
}

/** Update weekly trends with enhanced visuals */
async updateWeeklyTrendsEnhanced(weekData, allData) {
    const weeklyAvg = this.healthTracker.calculateWeeklyAverages(weekData);
    const previousWeekData = this.getPreviousWeekData(allData);
    const previousAvg = this.healthTracker.calculateWeeklyAverages(previousWeekData);
    
    const trends = [
        {
            id: 'week-avg-steps',
            trendId: 'week-steps-trend',
            current: weeklyAvg.steps,
            previous: previousAvg.steps,
            format: (val) => val.toLocaleString()
        },
        {
            id: 'week-avg-water',
            trendId: 'week-water-trend',
            current: weeklyAvg.water,
            previous: previousAvg.water,
            format: (val) => `${val}L`
        },
        {
            id: 'week-avg-sleep',
            trendId: 'week-sleep-trend',
            current: weeklyAvg.sleep,
            previous: previousAvg.sleep,
            format: (val) => `${val}h`
        }
    ];
    
    trends.forEach((trend, index) => {
        setTimeout(() => {
            this.updateTrendWithAnimation(trend);
        }, index * 200);
    });
}

/** Update individual trend with animation and comparison */
updateTrendWithAnimation(trend) {
    const element = document.getElementById(trend.id);
    const trendElement = document.getElementById(trend.trendId);
    
    if (element) {
        // Animate value update
        element.style.transform = 'scale(1.05)';
        element.style.transition = 'all 0.3s ease';
        
        setTimeout(() => {
            this.animateCounterTo(element, trend.current, trend.format);
            element.style.transform = 'scale(1)';
        }, 100);
    }
    
    if (trendElement && trend.previous > 0) {
        const change = ((trend.current - trend.previous) / trend.previous) * 100;
        const changeText = change > 0 ? `+${Math.round(change)}%` : `${Math.round(change)}%`;
        const trendIcon = change > 0 ? '📈' : change < 0 ? '📉' : '➡️';
        const trendColor = change > 0 ? 'text-success' : change < 0 ? 'text-error' : 'text-base-content';
        
        trendElement.innerHTML = `
            <span class="${trendColor} font-medium">${trendIcon} ${changeText}</span>
        `;
        
        // Add animation
        trendElement.style.opacity = '0';
        trendElement.style.transform = 'translateY(10px)';
        trendElement.style.transition = 'all 0.3s ease';
        
        setTimeout(() => {
            trendElement.style.opacity = '1';
            trendElement.style.transform = 'translateY(0)';
        }, 200);
    }
}

/** Update quick stats with enhanced animations */
async updateQuickStatsEnhanced(allData) {
    const currentStreak = this.calculateCurrentStreak(allData);
    const weeklyGoalsAchieved = this.calculateWeeklyGoalsAchieved(allData);
    const totalEntries = allData.length;
    
    const quickStats = [
        { id: 'current-streak', value: currentStreak, format: (val) => val.toString() },
        { id: 'weekly-goals-achieved', value: weeklyGoalsAchieved, format: (val) => val.toString() },
        { id: 'total-entries', value: totalEntries, format: (val) => val.toLocaleString() }
    ];
    
    quickStats.forEach((stat, index) => {
        setTimeout(() => {
            const element = document.getElementById(stat.id);
            if (element) {
                // Add sparkle effect for impressive values
                if ((stat.id === 'current-streak' && stat.value >= 7) ||
                    (stat.id === 'weekly-goals-achieved' && stat.value >= 5) ||
                    (stat.id === 'total-entries' && stat.value >= 50)) {
                    element.parentElement.classList.add('animate-pulse');
                    setTimeout(() => {
                        element.parentElement.classList.remove('animate-pulse');
                    }, 1000);
                }
                
                this.animateCounterTo(element, stat.value, stat.format);
            }
        }, index * 100);
    });
}

/** Enhanced completion rate calculation with visual feedback */
updateCompletionRateEnhanced(todayData) {
    const completionRateEl = document.getElementById('today-completion-rate');
    if (!completionRateEl) return;
    
    let completed = 0;
    let total = 0;
    
    // Check each goal
    if (this.healthTracker.goals.stepsGoal) {
        total++;
        if (todayData.steps >= this.healthTracker.goals.stepsGoal) completed++;
    }
    
    if (this.healthTracker.goals.waterGoal) {
        total++;
        if (todayData.waterIntake >= this.healthTracker.goals.waterGoal) completed++;
    }
    
    if (this.healthTracker.goals.sleepGoal) {
        total++;
        if (todayData.sleepHours >= this.healthTracker.goals.sleepGoal) completed++;
    }
    
    const rate = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    // Animate completion rate
    const startRate = 0;
    const duration = 1000;
    const startTime = performance.now();
    
    const animate = (currentTime) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const currentRate = Math.round(startRate + (rate - startRate) * progress);
        
        completionRateEl.textContent = `${currentRate}%`;
        
        // Update badge color based on completion rate
        const badge = completionRateEl.parentElement;
        badge.className = 'badge badge-lg';
        if (currentRate >= 80) {
            badge.classList.add('badge-success');
        } else if (currentRate >= 50) {
            badge.classList.add('badge-warning');
        } else {
            badge.classList.add('badge-error');
        }
        
        if (progress < 1) {
            requestAnimationFrame(animate);
        } else if (rate === 100) {
            // Celebration effect for 100% completion
            badge.classList.add('animate-bounce');
            setTimeout(() => {
                badge.classList.remove('animate-bounce');
            }, 1000);
        }
    };
    
    requestAnimationFrame(animate);
}

/** Enhanced today's notes display */
updateTodayNotesEnhanced(todayData) {
    const notesSection = document.getElementById('today-notes-section');
    const notesContent = document.getElementById('today-notes-content');
    
    if (todayData.notes && todayData.notes.trim()) {
        if (notesSection && notesContent) {
            notesContent.textContent = todayData.notes;
            notesSection.classList.remove('hidden');
            
            // Add fade-in animation
            notesSection.style.opacity = '0';
            notesSection.style.transform = 'translateY(20px)';
            notesSection.style.transition = 'all 0.5s ease';
            
            setTimeout(() => {
                notesSection.style.opacity = '1';
                notesSection.style.transform = 'translateY(0)';
            }, 300);
        }
    } else if (notesSection) {
        notesSection.classList.add('hidden');
    }
}

/** Add enhanced interactive elements */
enhanceInteractiveElements() {
    // Add hover effects to stat cards
    document.querySelectorAll('.stat').forEach(statCard => {
        statCard.style.cursor = 'pointer';
        
        statCard.addEventListener('mouseenter', () => {
            statCard.style.transform = 'translateY(-2px)';
            statCard.style.transition = 'all 0.2s ease';
            statCard.style.boxShadow = '0 8px 25px rgba(0,0,0,0.1)';
        });
        
        statCard.addEventListener('mouseleave', () => {
            statCard.style.transform = 'translateY(0)';
            statCard.style.boxShadow = '';
        });
        
        // Add click feedback
        statCard.addEventListener('click', () => {
            statCard.style.transform = 'scale(0.98)';
            setTimeout(() => {
                statCard.style.transform = 'translateY(-2px)';
            }, 100);
        });
    });
    
    // Add tooltips to progress bars
    document.querySelectorAll('.progress').forEach(progressBar => {
        const parentStat = progressBar.closest('.stat');
        if (parentStat) {
            const statTitle = parentStat.querySelector('.stat-title')?.textContent;
            const statValue = parentStat.querySelector('.stat-value')?.textContent;
            
            progressBar.setAttribute('title', `${statTitle}: ${statValue}`);
            progressBar.style.cursor = 'help';
        }
    });
}

/** Animate all progress bars in sequence */
animateProgressBars(todayData) {
    const progressBars = [
        { 
            id: 'today-steps-progress', 
            value: todayData.steps || 0, 
            goal: this.healthTracker.goals.stepsGoal 
        },
        { 
            id: 'today-water-progress', 
            value: todayData.waterIntake || 0, 
            goal: this.healthTracker.goals.waterGoal 
        },
        { 
            id: 'today-sleep-progress', 
            value: todayData.sleepHours || 0, 
            goal: this.healthTracker.goals.sleepGoal 
        }
    ];
    
    progressBars.forEach((bar, index) => {
        setTimeout(() => {
            const element = document.getElementById(bar.id);
            if (element && bar.goal) {
                const progress = Math.min((bar.value / bar.goal) * 100, 100);
                this.animateProgressBar(element, progress);
            }
        }, 500 + (index * 200));
    });
}

/** Hide loading state with smooth transition */
hideLoadingState() {
    const progressLoading = document.getElementById('progress-loading');
    const progressContent = document.getElementById('progress-content');
    
    if (progressLoading) {
        progressLoading.classList.add('hidden');
    }
    
    if (progressContent) {
        progressContent.style.opacity = '1';
        progressContent.style.transform = 'scale(1)';
    }
}

/** Show error state with user-friendly message */
showErrorState() {
    const progressContent = document.getElementById('progress-content');
    if (progressContent) {
        progressContent.innerHTML = `
            <div class="alert alert-error">
                <i data-lucide="alert-circle" class="w-5 h-5"></i>
                <div>
                    <h3 class="font-bold">Fehler beim Laden der Daten</h3>
                    <div class="text-xs">Bitte versuche es später erneut oder aktualisiere die Seite.</div>
                </div>
                <button class="btn btn-sm" onclick="this.closest('.alert').remove(); healthTracker.progressHub.showView('overview')">
                    Erneut versuchen
                </button>
            </div>
        `;
    }
}

/** Helper methods */
getPreviousWeekData(allData) {
    const oneWeekAgo = new Date();
    const twoWeeksAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
    
    return allData.filter(entry => {
        const entryDate = new Date(entry.date);
        return entryDate >= twoWeeksAgo && entryDate < oneWeekAgo;
    });
}

calculateCurrentStreak(allData) {
    let streak = 0;
    const today = new Date();
    
    for (let i = 0; i < 365; i++) {
        const checkDate = new Date(today.getTime() - (i * 24 * 60 * 60 * 1000));
        const dateStr = checkDate.toISOString().split('T')[0];
        
        const hasEntry = allData.some(entry => {
            const entryDate = typeof entry.date === 'string' ? entry.date.split('T')[0] : entry.date;
            return entryDate === dateStr;
        });
        
        if (hasEntry) {
            streak++;
        } else {
            break;
        }
    }
    
    return streak;
}

calculateWeeklyGoalsAchieved(allData) {
    const weekData = this.healthTracker.getWeekData(allData);
    let goalsAchieved = 0;
    
    weekData.forEach(entry => {
        let dailyGoals = 0;
        let dailyAchieved = 0;
        
        if (this.healthTracker.goals.stepsGoal) {
            dailyGoals++;
            if (entry.steps >= this.healthTracker.goals.stepsGoal) dailyAchieved++;
        }
        
        if (this.healthTracker.goals.waterGoal) {
            dailyGoals++;
            if (entry.waterIntake >= this.healthTracker.goals.waterGoal) dailyAchieved++;
        }
        
        if (this.healthTracker.goals.sleepGoal) {
            dailyGoals++;
            if (entry.sleepHours >= this.healthTracker.goals.sleepGoal) dailyAchieved++;
        }
        
        if (dailyGoals > 0 && dailyAchieved === dailyGoals) {
            goalsAchieved++;
        }
    });
    
    return goalsAchieved;
}

    /**
     * Calculate overall goal progress
     */
    calculateGoalProgress() {
        const progress = {
            hasGoals: false,
            completedGoals: 0,
            totalGoals: 0,
            details: {}
        };

        // Steps progress
        if (this.healthTracker.goals.stepsGoal && this.healthTracker.goals.stepsGoal > 0) {
            progress.totalGoals++;
            const stepsProgress = Math.min((this.todayData.steps / this.healthTracker.goals.stepsGoal) * 100, 100);
            progress.details.steps = stepsProgress;
            if (stepsProgress >= 100) progress.completedGoals++;
            progress.hasGoals = true;
        }

        // Water progress
        if (this.healthTracker.goals.waterGoal && this.healthTracker.goals.waterGoal > 0) {
            progress.totalGoals++;
            const waterProgress = Math.min((this.todayData.waterIntake / this.healthTracker.goals.waterGoal) * 100, 100);
            progress.details.water = waterProgress;
            if (waterProgress >= 100) progress.completedGoals++;
            progress.hasGoals = true;
        }

        // Sleep progress
        if (this.healthTracker.goals.sleepGoal && this.healthTracker.goals.sleepGoal > 0) {
            progress.totalGoals++;
            const sleepProgress = Math.min((this.todayData.sleepHours / this.healthTracker.goals.sleepGoal) * 100, 100);
            progress.details.sleep = sleepProgress;
            if (sleepProgress >= 100) progress.completedGoals++;
            progress.hasGoals = true;
        }

        // Overall percentage
        progress.overallProgress = progress.totalGoals > 0 ? 
            (progress.completedGoals / progress.totalGoals) * 100 : 0;

        return progress;
    }

    /**
     * Render overall progress ring with DaisyUI
     */
    renderOverallProgressRing(goalProgress) {
        const progress = Math.round(goalProgress.overallProgress);

        return `
            <div class="flex justify-center mb-6">
                <div class="radial-progress text-primary" style="--value:${progress}; --size:8rem; --thickness: 8px;" role="progressbar">
                    <div class="text-center">
                        <div class="text-2xl font-bold text-base-content">${progress}%</div>
                        <div class="text-xs text-base-content/70">Tagesziele</div>
                        <div class="text-xs text-primary">${goalProgress.completedGoals}/${goalProgress.totalGoals} erreicht</div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Render individual metric card with DaisyUI styling
     */
    renderMetricCard(icon, label, value, unit, goal, type) {
        const hasValue = value !== null && value !== undefined && value !== 0;
        const displayValue = hasValue ? (typeof value === 'number' ? value.toLocaleString('de-DE') : value) : '—';
        
        let progressHTML = '';
        let cardClass = 'card bg-base-100 border border-base-300';
        let progressPercentage = 0;

        if (hasValue && goal && goal > 0) {
            if (type === 'weight') {
                // Weight goal is different - closer to goal is better
                const diff = Math.abs(value - goal);
                const tolerance = goal * 0.05; // 5% tolerance
                progressPercentage = Math.max(0, Math.min(100, ((tolerance - diff) / tolerance) * 100));
            } else {
                progressPercentage = Math.min((value / goal) * 100, 100);
            }
            
            // Card classes based on progress
            if (progressPercentage >= 100) {
                cardClass = 'card bg-success/10 border border-success/30';
            } else if (progressPercentage >= 75) {
                cardClass = 'card bg-primary/10 border border-primary/30';
            } else if (progressPercentage >= 25) {
                cardClass = 'card bg-warning/10 border border-warning/30';
            } else {
                cardClass = 'card bg-error/10 border border-error/30';
            }
            
            // DaisyUI progress bar
            const progressClass = progressPercentage >= 100 ? 'progress-success' : 
                                progressPercentage >= 75 ? 'progress-primary' : 
                                progressPercentage >= 25 ? 'progress-warning' : 'progress-error';
            
            progressHTML = `
                <div class="mt-3">
                    <div class="flex justify-between text-xs text-base-content/70 mb-2">
                        <span>Ziel: ${goal}${unit}</span>
                        <span class="font-medium">${Math.round(progressPercentage)}%</span>
                    </div>
                    <progress class="progress ${progressClass} w-full" value="${Math.round(progressPercentage)}" max="100"></progress>
                </div>
            `;
        }

        // Add achievement badge for completed goals
        const achievementBadge = progressPercentage >= 100 ? 
            '<div class="badge badge-success badge-sm absolute -top-2 -right-2">✓</div>' : '';

        return `
            <div class="relative ${cardClass} transition-all duration-300 hover:shadow-md">
                <div class="card-body p-4">
                    ${achievementBadge}
                    <div class="flex items-center justify-between mb-3">
                        <span class="text-3xl">${icon}</span>
                        <span class="text-sm font-medium text-base-content/80">${label}</span>
                    </div>
                    <div class="text-2xl font-bold text-base-content mb-1">
                        ${displayValue}${unit ? ' ' + unit : ''}
                    </div>
                    ${progressHTML}
                </div>
            </div>
        `;
    }

    /**
     * Render mood and notes section with DaisyUI
     */
    renderMoodAndNotes() {
        const hasMood = this.todayData.mood;
        const hasNotes = this.todayData.notes;

        if (!hasMood && !hasNotes) {
            return '';
        }

        const moodEmojis = {
            'excellent': '😄',
            'good': '😊',
            'neutral': '😐',
            'bad': '😞',
            'terrible': '😢'
        };

        const moodBadgeColors = {
            'excellent': 'badge-success',
            'good': 'badge-primary',
            'neutral': 'badge-ghost',
            'bad': 'badge-warning',
            'terrible': 'badge-error'
        };

        return `
            <div class="card bg-base-100 border border-base-300">
                <div class="card-body p-4">
                    <h4 class="card-title text-base flex items-center">
                        <i data-lucide="message-circle" class="w-4 h-4 text-primary"></i>
                        Stimmung & Notizen
                    </h4>
                    
                    ${hasMood ? `
                        <div class="mb-4">
                            <span class="text-sm text-base-content/70 mb-2 block">Stimmung heute:</span>
                            <div class="badge ${moodBadgeColors[this.todayData.mood] || 'badge-ghost'} gap-2">
                                <span class="text-lg">${moodEmojis[this.todayData.mood] || '😐'}</span>
                                <span class="capitalize">${this.todayData.mood}</span>
                            </div>
                        </div>
                    ` : ''}
                    
                    ${hasNotes ? `
                        <div>
                            <span class="text-sm text-base-content/70 mb-2 block">Notizen:</span>
                            <div class="textarea textarea-bordered bg-base-200 min-h-[60px] p-3">
                                <pre class="text-base-content text-sm whitespace-pre-wrap font-sans">${this.todayData.notes}</pre>
                            </div>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }

    /**
     * Enhanced week view with DaisyUI
     */
    showWeekView() {
        const container = document.getElementById('progress-content');
        if (!container) return;

        if (this.weekData.length === 0) {
            container.innerHTML = `
                <div class="text-center py-12">
                    <div class="text-6xl mb-4">📈</div>
                    <h3 class="text-xl font-semibold text-base-content mb-2">Keine Wochendaten</h3>
                    <p class="text-base-content/70">Füge mehr Daten hinzu, um deine Wochenentwicklung zu sehen!</p>
                </div>
            `;
            return;
        }

        const weekStats = this.calculateWeekStats();

        container.innerHTML = `
            <div class="space-y-6">
                <div class="text-center mb-6">
                    <h3 class="text-2xl font-bold text-base-content mb-2">Diese Woche</h3>
                    <p class="text-base-content/70">${this.weekData.length} Einträge in den letzten 7 Tagen</p>
                </div>

                <!-- Week Stats Grid -->
                <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div class="stat bg-base-200 rounded-lg">
                        <div class="stat-figure text-2xl">🚶♂️</div>
                        <div class="stat-title">Ø Schritte/Tag</div>
                        <div class="stat-value text-primary">${weekStats.avgSteps.toLocaleString()}</div>
                    </div>
                    <div class="stat bg-base-200 rounded-lg">
                        <div class="stat-figure text-2xl">💧</div>
                        <div class="stat-title">Ø Wasser/Tag</div>
                        <div class="stat-value text-info">${weekStats.avgWater}L</div>
                    </div>
                    <div class="stat bg-base-200 rounded-lg">
                        <div class="stat-figure text-2xl">😴</div>
                        <div class="stat-title">Ø Schlaf/Tag</div>
                        <div class="stat-value text-warning">${weekStats.avgSleep}h</div>
                    </div>
                    <div class="stat bg-base-200 rounded-lg">
                        <div class="stat-figure text-2xl">📊</div>
                        <div class="stat-title">Einträge</div>
                        <div class="stat-value text-success">${this.weekData.length}</div>
                    </div>
                </div>

                <!-- Recent Entries -->
                <div class="card bg-base-100 border border-base-300">
                    <div class="card-body">
                        <h4 class="card-title">Letzte Einträge</h4>
                        <div class="space-y-3">
                            ${this.weekData.slice(0, 7).map(entry => this.renderWeekEntry(entry)).join('')}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Calculate week statistics
     */
    calculateWeekStats() {
        const validEntries = this.weekData.filter(entry => 
            entry.steps || entry.waterIntake || entry.sleepHours
        );

        if (validEntries.length === 0) {
            return { avgSteps: 0, avgWater: 0, avgSleep: 0 };
        }

        const totals = validEntries.reduce((acc, entry) => {
            acc.steps += entry.steps || 0;
            acc.water += entry.waterIntake || 0;
            acc.sleep += entry.sleepHours || 0;
            return acc;
        }, { steps: 0, water: 0, sleep: 0 });

        return {
            avgSteps: Math.round(totals.steps / validEntries.length),
            avgWater: Math.round((totals.water / validEntries.length) * 10) / 10,
            avgSleep: Math.round((totals.sleep / validEntries.length) * 10) / 10
        };
    }

    /**
     * Render week entry item with DaisyUI
     */
    renderWeekEntry(entry) {
        const entryDate = new Date(entry.date);
        const isToday = entryDate.toISOString().split('T')[0] === new Date().toISOString().split('T')[0];
        
        const dateStr = isToday ? 'Heute' : entryDate.toLocaleDateString('de-DE', {
            weekday: 'short',
            day: '2-digit',
            month: '2-digit'
        });

        const data = [];
        if (entry.steps) data.push(`🚶♂️ ${entry.steps.toLocaleString()}`);
        if (entry.waterIntake) data.push(`💧 ${entry.waterIntake}L`);
        if (entry.sleepHours) data.push(`😴 ${entry.sleepHours}h`);
        if (entry.weight) data.push(`⚖️ ${entry.weight}kg`);

        return `
            <div class="alert ${isToday ? 'alert-info' : ''} flex justify-between items-center">
                <div class="font-medium">${dateStr}</div>
                <div class="flex flex-wrap gap-1">
                    ${data.map(item => `<div class="badge badge-outline badge-sm">${item}</div>`).join('')}
                </div>
            </div>
        `;
    }

    /**
     * Enhanced analytics view with DaisyUI
     */
    showAnalyticsView() {
        const container = document.getElementById('progress-content');
        if (!container) return;

        container.innerHTML = `
            <div class="space-y-6">
                <div class="text-center mb-6">
                    <h3 class="text-2xl font-bold text-base-content mb-2">Analytics & Trends</h3>
                    <p class="text-base-content/70">Deine Gesundheitsdaten im Detail</p>
                </div>

                <!-- Analytics will be handled by AnalyticsEngine -->
                <div id="analytics-container">
                    <div class="flex flex-col items-center py-8">
                        <span class="loading loading-spinner loading-lg text-primary"></span>
                        <p class="text-base-content/70 mt-4">Analytics werden geladen...</p>
                    </div>
                </div>
            </div>
        `;

        // Trigger analytics update
        if (this.healthTracker.analyticsEngine) {
            this.healthTracker.analyticsEngine.updateAllAnalytics();
        }
    }

    /**
     * Render data summary section with DaisyUI
     */
    renderDataSummary() {
        if (!this.todayData || Object.keys(this.todayData).length <= 1) return '';

        const dataPoints = [];
        if (this.todayData.weight) dataPoints.push(`⚖️ ${this.todayData.weight}kg`);
        if (this.todayData.steps) dataPoints.push(`🚶♂️ ${this.todayData.steps.toLocaleString()}`);
        if (this.todayData.waterIntake) dataPoints.push(`💧 ${this.todayData.waterIntake}L`);
        if (this.todayData.sleepHours) dataPoints.push(`😴 ${this.todayData.sleepHours}h`);
        if (this.todayData.mood) dataPoints.push(`😊 ${this.todayData.mood}`);

        return `
            <div class="card bg-base-100 border border-base-300">
                <div class="card-body p-4">
                    <h4 class="card-title text-base flex items-center">
                        <i data-lucide="clipboard-list" class="w-4 h-4 text-primary"></i>
                        Zusammenfassung
                    </h4>
                    <div class="flex flex-wrap gap-2">
                        ${dataPoints.map(point => `
                            <div class="badge badge-outline badge-lg">${point}</div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Get empty state HTML with DaisyUI
     */
    getEmptyStateHTML() {
        return `
            <div class="text-center py-12">
                <div class="text-6xl mb-4">📊</div>
                <h3 class="text-xl font-semibold text-base-content mb-2">Noch keine Daten für heute</h3>
                <p class="text-base-content/70 mb-6">Füge deine ersten Gesundheitsdaten hinzu, um deinen Fortschritt zu sehen!</p>
                <button onclick="document.getElementById('health-form').scrollIntoView({ behavior: 'smooth' })" 
                        class="btn btn-primary gap-2">
                    <i data-lucide="plus" class="w-4 h-4"></i>
                    Erste Daten hinzufügen
                </button>
            </div>
        `;
    }

    /**
     * Cleanup method
     */
    destroy() {
        if (this.refreshTimer) {
            clearInterval(this.refreshTimer);
        }
        
        // Remove event listeners
        document.removeEventListener('health-data-saved', this.handleDataUpdate.bind(this));
        document.removeEventListener('health-data-saved-offline', this.handleDataUpdate.bind(this));
    }
}

// ====================================================================
// ACTIVITY FEED - Timeline-based Activity Display
// ====================================================================

class ActivityFeed {
    constructor(healthTracker) {
        this.healthTracker = healthTracker;
        this.rootEl = document.getElementById('recent-activities');
        this.emptyEl = document.getElementById('activities-empty');
        
        if (!this.rootEl) {
            console.warn('Recent activities container not found');
            return;
        }
        
        this.initRefreshButton();
        this.load();
    }
    
    /**
     * Initialize refresh button functionality
     */
    initRefreshButton() {
        const refreshBtn = document.getElementById('refresh-activities-btn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                this.load();
                this.showRefreshAnimation(refreshBtn);
            });
        }
    }
    
    /**
     * Show refresh animation
     */
    showRefreshAnimation(btn) {
        const icon = btn.querySelector('i[data-lucide]');
        if (icon) {
            icon.style.animation = 'spin 0.5s linear';
            setTimeout(() => {
                icon.style.animation = '';
            }, 500);
        }
    }
    
    /**
     * Load and display activities
     */
    async load() {
        try {
            const data = await this.healthTracker.getAllHealthData();
            const activities = this.parseActivities(data);
            
            // Show only the most recent 15 activities
            this.render(activities.slice(0, 15));
            
        } catch (error) {
            console.error('❌ Error loading activities:', error);
            this.render([]);
        }
    }
    
    /**
 * Parse activities from health data
 */
parseActivities(data) {
    const activities = [];

    data.forEach(entry => {
        // Erstelle Activity-Objekte für jede Art von Daten
        if (entry.steps) {
            activities.push({
                type: 'steps',
                value: entry.steps,
                unit: 'Schritte',
                date: entry.date,
                icon: '🚶♂️',
                createdAt: entry.createdAt || entry.date
            });
        }

        if (entry.waterIntake) {
            activities.push({
                type: 'water',
                value: entry.waterIntake,
                unit: 'L',
                date: entry.date,
                icon: '💧',
                createdAt: entry.createdAt || entry.date
            });
        }

        if (entry.sleepHours) {
            activities.push({
                type: 'sleep',
                value: entry.sleepHours,
                unit: 'h',
                date: entry.date,
                icon: '😴',
                createdAt: entry.createdAt || entry.date
            });
        }

        if (entry.weight) {
            activities.push({
                type: 'weight',
                value: entry.weight,
                unit: 'kg',
                date: entry.date,
                icon: '⚖️',
                createdAt: entry.createdAt || entry.date
            });
        }

        if (entry.mood) {
            const moodEmojis = {
                'excellent': '😄',
                'good': '😊',
                'neutral': '😐',
                'bad': '😞',
                'terrible': '😢'
            };

            activities.push({
                type: 'mood',
                value: entry.mood,
                unit: '',
                date: entry.date,
                icon: moodEmojis[entry.mood] || '😐',
                createdAt: entry.createdAt || entry.date
            });
        }

        if (entry.notes) {
            activities.push({
                type: 'note',
                value: entry.notes,
                unit: '',
                date: entry.date,
                icon: '📝',
                createdAt: entry.createdAt || entry.date
            });
        }
    });

    // Sortiere nach Erstellungsdatum (neueste zuerst)
    return activities.sort((a, b) => {
        const dateA = new Date(a.createdAt).getTime();
        const dateB = new Date(b.createdAt).getTime();
        return dateB - dateA;
    });
}

/**
 * Format time ago for activity display
 */
formatTimeAgo(dateInput) {
    try {
        let date;
        
        if (typeof dateInput === 'string') {
            date = new Date(dateInput);
        } else if (dateInput instanceof Date) {
            date = dateInput;
        } else {
            return 'Unbekannt';
        }
        
        if (isNaN(date.getTime())) {
            return 'Ungültiges Datum';
        }
        
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        
        // Negative Zeiten abfangen
        if (diffMs < 0) {
            return 'In der Zukunft';
        }
        
        const diffSeconds = Math.floor(diffMs / 1000);
        const diffMinutes = Math.floor(diffMs / (1000 * 60));
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        
        // Gleicher Tag check
        const nowDate = now.toDateString();
        const entryDate = date.toDateString();
        
        if (nowDate === entryDate) {
            if (diffSeconds < 30) return 'Gerade eben';
            if (diffMinutes < 1) return 'vor wenigen Sekunden';
            if (diffMinutes < 60) return `vor ${diffMinutes} Min.`;
            return `vor ${diffHours}h`;
        }
        
        // Gestern
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        if (yesterday.toDateString() === entryDate) {
            return 'Gestern';
        }
        
        if (diffDays < 7) return `vor ${diffDays} Tagen`;
        if (diffDays < 30) return `vor ${Math.floor(diffDays / 7)} Wochen`;
        return `vor ${Math.floor(diffDays / 30)} Monaten`;
        
    } catch (error) {
        console.error('❌ formatTimeAgo Fehler:', error);
        return 'Zeitfehler';
    }
}
    
    /**
     * Render activities in the UI
     */
    render(activities = []) {
        if (!this.rootEl) return;
        
        // Clear container
        this.rootEl.innerHTML = '';
        
        if (!activities.length) {
            this.showEmpty();
            return;
        }
        
        this.hideEmpty();
        
        // Create timeline container
        const timelineContainer = document.createElement('div');
        timelineContainer.className = 'relative';
        
        // Add timeline line
        const timeline = document.createElement('div');
        timeline.className = 'absolute left-6 top-0 bottom-0 w-px bg-base-300';
        timelineContainer.appendChild(timeline);
        
        // Add activities
        activities.forEach((activity, index) => {
            const item = this.createActivityItem(activity, index === 0);
            timelineContainer.appendChild(item);
        });
        
        this.rootEl.appendChild(timelineContainer);
    }
    
    /**
     * Create individual activity item
     */
    createActivityItem(activity, isLatest = false) {
        const item = document.createElement('div');
        item.className = 'relative flex items-start gap-4 pb-6 pl-2';
        
        const colorMap = {
            steps: 'success',
            water: 'info',
            sleep: 'warning',
            weight: 'secondary',
            mood: 'accent',
            note: 'primary'
        };
        
        const iconMap = {
            steps: 'footprints',
            water: 'droplets',
            sleep: 'moon',
            weight: 'scale',
            mood: 'smile',
            note: 'file-text'
        };
        
        const color = colorMap[activity.type] || 'primary';
        const icon = iconMap[activity.type] || 'circle';
        
        // Check if goal was reached
        const goalReached = activity.goal && activity.value >= activity.goal;
        const goalBadge = goalReached ? '<div class="badge badge-success badge-sm">Ziel erreicht!</div>' : '';
        
        // Progress indicator for measurable activities
        let progressIndicator = '';
        if (activity.goal && activity.type !== 'mood' && activity.type !== 'note') {
            const progress = Math.min((activity.value / activity.goal) * 100, 100);
            progressIndicator = `
                <div class="progress progress-${color} progress-xs w-32 mt-1">
                    <div class="progress-bar" style="width: ${progress}%"></div>
                </div>
            `;
        }
        
        item.innerHTML = `
            <div class="flex-shrink-0 relative">
                <div class="w-12 h-12 rounded-full bg-${color} bg-opacity-10 flex items-center justify-center border-2 border-${color} border-opacity-30">
                    <i data-lucide="${icon}" class="w-5 h-5 text-${color}"></i>
                </div>
                ${isLatest ? `
                    <div class="absolute -top-1 -right-1 w-4 h-4 bg-${color} rounded-full animate-ping"></div>
                    <div class="absolute -top-1 -right-1 w-4 h-4 bg-${color} rounded-full"></div>
                ` : ''}
            </div>
            <div class="flex-1 min-w-0">
                <div class="flex items-start justify-between">
                    <div class="flex-1">
                        <h4 class="text-sm font-medium text-base-content">
                            ${activity.label}
                            ${goalBadge}
                        </h4>
                        <p class="text-xs text-base-content text-opacity-60 mt-1">
                            ${activity.time}
                        </p>
                        ${progressIndicator}
                        ${activity.type === 'note' ? `
                            <p class="text-sm text-base-content text-opacity-80 mt-2 italic">
                                "${activity.value}${activity.value.length >= 100 ? '...' : ''}"
                            </p>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
        
        return item;
    }
    
    /**
     * Show empty state
     */
    showEmpty() {
        if (this.emptyEl) {
            this.emptyEl.classList.remove('hidden');
        }
    }
    
    /**
     * Hide empty state
     */
    hideEmpty() {
        if (this.emptyEl) {
            this.emptyEl.classList.add('hidden');
        }
    }
}

// ==================================================================== 
// ANALYTICS ENGINE - Vollständig neue, optimierte Implementation
// ====================================================================
class AnalyticsEngine {
    constructor(healthTracker) {
        this.healthTracker = healthTracker;
        this.currentPeriod = 7;
        this.currentMetric = 'steps';
        this.charts = {};
        this.isInitialized = false;
        this.analyticsData = null;
        // Chart-Instanzen zur Verwaltung
        this.currentTrendsChart = null;
        this.currentHeatmapChart = null;
        this.currentComparisonChart = null;
        this.initialize();
    }

    /** Initialize analytics engine */
    async initialize() {
        console.log('📊 Analytics Engine wird vollständig neu initialisiert...');
        
        // Wait for DOM and dependencies
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setup());
        } else {
            await this.setup();
        }

        // Default-View direkt nach Initialisierung anzeigen
if (typeof this.showView === 'function') {
    this.showView('overview');
}

// Cleanup bei Window-Unload
window.addEventListener('beforeunload', () => {
    if (this.analyticsEngine) {
        this.analyticsEngine.destroyAllCharts();
    }
});
    }

    /** Setup analytics engine completely */
    async setup() {
        try {
            console.log('📊 Setting up Analytics Engine...');
            
            // Setup event listeners first
            this.setupCompleteEventListeners();
            
            // Load initial data
            setTimeout(async () => {
                await this.loadCompleteAnalyticsData();
                this.isInitialized = true;
                console.log('✅ Analytics Engine vollständig initialisiert');
            }, 1000);
            
        } catch (error) {
            console.error('❌ Analytics Engine Setup Fehler:', error);
            this.showAnalyticsError(error);
        }
    }

    /** Setup all event listeners for the specific HTML structure */
    setupCompleteEventListeners() {
        console.log('📊 Setting up complete event listeners...');
        
        // Period filter buttons (data-period attributes)
        document.querySelectorAll('[data-period]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const period = parseInt(e.target.dataset.period);
                console.log('📊 Period clicked:', period);
                this.handlePeriodChange(period);
            });
        });

        // Metric tabs (data-metric attributes)
        document.querySelectorAll('[data-metric]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const metric = e.target.dataset.metric;
                console.log('📈 Metric clicked:', metric);
                this.handleMetricChange(metric);
            });
        });

        // Refresh button
        const refreshBtn = document.querySelector('button[onclick*="analyticsEngine"]');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                console.log('🔄 Refresh clicked');
                this.loadCompleteAnalyticsData();
            });
        }

        console.log('✅ Event listeners setup complete');
    }

    /** Handle period change */
    async handlePeriodChange(period) {
        this.currentPeriod = period;
        console.log(`📊 Changing period to ${period} days`);
        
        // Update button states
        document.querySelectorAll('[data-period]').forEach(btn => {
            btn.classList.remove('btn-primary');
            btn.classList.add('btn-ghost');
        });
        
        const activeBtn = document.querySelector(`[data-period="${period}"]`);
        if (activeBtn) {
            activeBtn.classList.remove('btn-ghost');
            activeBtn.classList.add('btn-primary');
        }
        
        await this.loadCompleteAnalyticsData();
    }

    /** Handle metric change */
    handleMetricChange(metric) {
    console.log('📈 Changing metric to', metric);
    
    try {
        // Aktive Metrik-Buttons aktualisieren
        const buttons = document.querySelectorAll('.metric-btn');
        buttons.forEach(btn => {
            btn.classList.remove('btn-primary');
            btn.classList.add('btn-ghost');
        });
        
        const activeButton = document.querySelector(`[onclick*="'${metric}'"]`);
        if (activeButton) {
            activeButton.classList.remove('btn-ghost');
            activeButton.classList.add('btn-primary');
        }

        // Charts mit Verzögerung aktualisieren um Race-Conditions zu vermeiden
        setTimeout(() => {
            this.updateTrendsChart(metric);
        }, 100);
        
        setTimeout(() => {
            this.updateHeatmapChart(metric);
        }, 200);

    } catch (error) {
        console.error('❌ Error changing metric:', error);
    }
}

    // Cleanup-Methode für alle Charts
destroyAllCharts() {
    console.log('🧹 Cleaning up all chart instances');
    
    if (this.currentTrendsChart) {
        this.currentTrendsChart.destroy();
        this.currentTrendsChart = null;
    }
    
    if (this.currentHeatmapChart) {
        this.currentHeatmapChart.destroy();
        this.currentHeatmapChart = null;
    }
    
    if (this.currentComparisonChart) {
        this.currentComparisonChart.destroy();
        this.currentComparisonChart = null;
    }
}

    /** Load complete analytics data */
async loadCompleteAnalyticsData() {
    try {
        console.log('📊 Loading complete analytics data...');
        this.showAllLoadingStates();

        // Get health data
        const allData = await this.healthTracker.getAllHealthData();
        console.log(`📊 Loaded ${allData.length} health entries`);
        
        if (!Array.isArray(allData)) {
            throw new Error('Health data is not an array');
        }

        // Filter data for current period
        const periodData = this.filterDataForPeriod(allData, this.currentPeriod);
        console.log(`📊 Filtered to ${periodData.length} entries for ${this.currentPeriod} days`);

        this.analyticsData = {
            all: allData,
            period: periodData
        };

        // **UPDATED: Entferne Korrelation und Wochenzusammenfassung**
        await Promise.all([
            this.updateQuickStats(allData, periodData),
            this.updateTrendsChart(),
            this.updateHeatmapChart(),
            this.updateAnalyticsInsights(periodData)
        ]);

        this.hideAllLoadingStates();
        console.log('✅ Analytics data loaded successfully');

    } catch (error) {
        console.error('❌ Analytics data loading error:', error);
        this.hideAllLoadingStates();
        this.showAnalyticsError(error);
    }
}

    /** Filter data for specific period */
    filterDataForPeriod(allData, days) {
        if (!Array.isArray(allData) || allData.length === 0) {
            return [];
        }

        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);
        
        return allData.filter(entry => {
            if (!entry || !entry.date) return false;
            
            const entryDate = new Date(entry.date);
            return entryDate >= cutoffDate && !isNaN(entryDate.getTime());
        }).sort((a, b) => new Date(a.date) - new Date(b.date));
    }

    /** Update quick stats */
    async updateQuickStats(allData, periodData) {
        console.log('📊 Updating quick stats...');
        
        try {
            // Total entries
            this.updateStatElement('analytics-total-entries', allData.length);
            
            // Weekly improvement
            const improvement = this.calculateWeeklyImprovement(allData);
            this.updateStatElement('analytics-improvement', `${improvement >= 0 ? '+' : ''}${improvement}%`);
            
            // Goal achievement rate
            const goalRate = this.calculateGoalAchievementRate(periodData);
            this.updateStatElement('analytics-goal-rate', `${goalRate}%`);
            
            // Current streak
            const streak = this.calculateCurrentStreak(allData);
            this.updateStatElement('analytics-streak', streak);

            console.log('✅ Quick stats updated');
        } catch (error) {
            console.error('❌ Quick stats update error:', error);
        }
    }

    // updateTrendsChart-Methode mit besserer Datenübergabe
async updateTrendsChart(data) {
    try {
        console.log('📊 updateTrendsChart aufgerufen mit:', typeof data, data?.length);
        
        const trendsCanvas = document.getElementById('trends-chart');
        if (!trendsCanvas) {
            console.warn('⚠️ Trends Chart Canvas nicht gefunden');
            this.showTrendsError('Canvas nicht verfügbar');
            return;
        }

        // BESSERE DATENBEHANDLUNG
        let chartData;
        
        // Falls keine Daten übergeben wurden, verwende Analytics-Daten
        if (!data || (Array.isArray(data) && data.length === 0)) {
            console.log('📊 Keine Daten übergeben, verwende Analytics-Daten');
            
            // Versuche Daten aus verschiedenen Quellen zu laden
            const sources = [
                () => this.analyticsData?.period,
                () => this.analyticsData?.all,
                () => this.healthTracker.cache?.get?.('allHealthData')?.data,
                () => this.healthTracker.getAllHealthData?.()
            ];
            
            for (const source of sources) {
                try {
                    const sourceData = await source();
                    if (sourceData && Array.isArray(sourceData) && sourceData.length > 0) {
                        console.log(`📊 Daten gefunden in Quelle:`, sourceData.length, 'Einträge');
                        data = sourceData;
                        break;
                    }
                } catch (error) {
                    console.log('📊 Quelle fehlgeschlagen:', error.message);
                }
            }
        }

        // Prüfe ob prepareTrendsData verfügbar ist
        if (typeof this.prepareTrendsData !== 'function') {
            console.error('❌ prepareTrendsData Methode nicht verfügbar');
            this.showTrendsError('Trends-Funktion nicht verfügbar');
            return;
        }

        // Bereite Daten vor
        chartData = this.prepareTrendsData(data || []);
        
        if (chartData.isEmpty) {
            console.log('📊 Chart-Daten sind leer, zeige Placeholder');
            this.showTrendsPlaceholder();
            return;
        }

        // Zerstöre existierenden Chart
        if (this.trendsChart) {
            this.trendsChart.destroy();
            this.trendsChart = null;
        }

        // VERBESSERTE CHART-KONFIGURATION
        const ctx = trendsCanvas.getContext('2d');
        this.trendsChart = new Chart(ctx, {
            type: 'line',
            data: chartData,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Gesundheitstrends',
                        font: { size: 16, weight: 'bold' }
                    },
                    legend: {
                        display: true,
                        position: 'top'
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        callbacks: {
                            label: function(context) {
                                const label = context.dataset.label || '';
                                const value = context.parsed.y;
                                
                                // Spezielle Formatierung für Schritte
                                if (label.includes('Schritte')) {
                                    return `${label}: ${Math.round(value * 1000).toLocaleString()}`;
                                }
                                return `${label}: ${value}`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        display: true,
                        title: {
                            display: true,
                            text: 'Datum'
                        }
                    },
                    y: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        title: {
                            display: true,
                            text: 'Schritte (in Tausend)'
                        }
                    },
                    y1: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        title: {
                            display: true,
                            text: 'Wasser (L) / Schlaf (h)'
                        },
                        grid: {
                            drawOnChartArea: false,
                        },
                    },
                    y2: {
                        type: 'linear',
                        display: false,
                        position: 'right'
                    }
                },
                interaction: {
                    intersect: false,
                    mode: 'index'
                }
            }
        });

        // Update UI-Elemente
        this.updateTrendsDataCount();
        this.updateTrendsLastUpdate();

        console.log('✅ Trends Chart erfolgreich erstellt');

    } catch (error) {
        console.error('❌ Fehler beim Aktualisieren des Trends Charts:', error);
        this.showTrendsError(`Fehler: ${error.message}`);
    }
}

/**
 * NEUE HILFSMETHODEN
 */
updateTrendsDataCount() {
    const dataCountElement = document.getElementById('trends-data-count');
    if (dataCountElement && this.analyticsData?.period) {
        const count = this.analyticsData.period.length;
        dataCountElement.textContent = `${count} Tage`;
    }
}

updateTrendsLastUpdate() {
    const lastUpdateElement = document.getElementById('trends-last-update');
    if (lastUpdateElement) {
        const now = new Date();
        const timeStr = now.toLocaleTimeString('de-DE', {
            hour: '2-digit',
            minute: '2-digit'
        });
        lastUpdateElement.innerHTML = `
            <i data-lucide="clock" class="w-3 h-3 inline mr-1"></i>
            ${timeStr}
        `;
        
        // Icons neu initialisieren
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }
}

// Trends Error anzeigen
showTrendsError(message = 'Fehler beim Laden der Trends') {
    const trendsContainer = document.querySelector('.trends-container');
    if (trendsContainer) {
        trendsContainer.innerHTML = `
            <div class="alert alert-warning">
                <span class="text-warning">⚠️</span>
                <div>
                    <h3 class="font-bold">Trends temporär nicht verfügbar</h3>
                    <div class="text-sm">${message}</div>
                </div>
            </div>
        `;
    }
}

// Trends Placeholder anzeigen
showTrendsPlaceholder() {
    const trendsContainer = document.querySelector('.trends-container');
    if (trendsContainer) {
        trendsContainer.innerHTML = `
            <div class="text-center p-8">
                <div class="text-6xl mb-4">📊</div>
                <h3 class="text-lg font-semibold mb-2">Noch keine Trends verfügbar</h3>
                <p class="text-gray-600">Füge mehr Gesundheitsdaten hinzu, um Trends zu sehen!</p>
            </div>
        `;
    }
}

/**
 * prepareTrendsData Methode mit lockereren Kriterien
 * @param {Array} data - Rohe Gesundheitsdaten
 * @returns {Object} Formatierte Chart-Daten
 */
prepareTrendsData(data) {
    try {
        console.log('🔄 Bereite Trends-Daten vor...', data?.length || 0, 'Einträge');
        console.log('📊 Rohdaten:', data);
        
        if (!data || !Array.isArray(data) || data.length === 0) {
            console.log('❌ Keine Daten array verfügbar');
            return {
                labels: [],
                datasets: [],
                isEmpty: true
            };
        }

        // VERBESSERTE DATENVALIDIERUNG - weniger strikt
        const validEntries = data.filter(item => {
            // Prüfe ob mindestens EIN Wert vorhanden ist
            const hasAnyData = item.steps || item.waterIntake || item.sleepHours || item.weight;
            const hasValidDate = item.date && !isNaN(new Date(item.date).getTime());
            
            console.log(`📊 Entry check:`, {
                date: item.date,
                hasAnyData,
                hasValidDate,
                steps: item.steps,
                water: item.waterIntake,
                sleep: item.sleepHours,
                weight: item.weight
            });
            
            return hasValidDate && hasAnyData;
        });

        console.log(`✅ Gefilterte gültige Einträge: ${validEntries.length} von ${data.length}`);

        // LOCKERERE MINIMUM-ANFORDERUNG
        if (validEntries.length === 0) {
            console.log('❌ Keine gültigen Einträge nach Filterung');
            return {
                labels: [],
                datasets: [],
                isEmpty: true
            };
        }

        // Daten nach Datum sortieren (älteste zuerst)
        const sortedData = [...validEntries].sort((a, b) => new Date(a.date) - new Date(b.date));
        
        // Labels (Datumsangaben) extrahieren
        const labels = sortedData.map(item => {
            const date = new Date(item.date);
            return date.toLocaleDateString('de-DE', { 
                month: 'short', 
                day: 'numeric' 
            });
        });

        console.log('📅 Labels erstellt:', labels);

        // VERBESSERTE Dataset-Erstellung - flexiblere Metriken
        const datasets = [];
        const metrics = [
            { 
                key: 'steps', 
                label: 'Schritte', 
                color: 'rgb(99, 102, 241)', 
                scale: 0.001,  // Skalierung für bessere Darstellung
                yAxisID: 'y'
            },
            { 
                key: 'waterIntake', 
                label: 'Wasser (L)', 
                color: 'rgb(59, 130, 246)', 
                scale: 1,
                yAxisID: 'y1' 
            },
            { 
                key: 'sleepHours', 
                label: 'Schlaf (h)', 
                color: 'rgb(16, 185, 129)', 
                scale: 1,
                yAxisID: 'y1' 
            },
            { 
                key: 'weight', 
                label: 'Gewicht (kg)', 
                color: 'rgb(245, 101, 101)', 
                scale: 1,
                yAxisID: 'y2' 
            }
        ];

        metrics.forEach(metric => {
            const values = sortedData.map(item => {
                const value = item[metric.key];
                // WENIGER STRIKT: Akzeptiere auch 0-Werte
                return (value !== null && value !== undefined) ? (value * metric.scale) : null;
            });

            // LOCKERERE BEDINGUNG: Mindestens 1 Nicht-Null-Wert
            const validValues = values.filter(v => v !== null && v !== undefined);
            console.log(`📊 Metric ${metric.key}:`, {
                totalValues: values.length,
                validValues: validValues.length,
                values: values
            });

            if (validValues.length > 0) {
                datasets.push({
                    label: metric.label,
                    data: values,
                    borderColor: metric.color,
                    backgroundColor: metric.color + '20', // 20% Transparenz
                    borderWidth: 2,
                    fill: false,
                    tension: 0.1,
                    pointRadius: 4,
                    pointHoverRadius: 6,
                    yAxisID: metric.yAxisID || 'y',
                    spanGaps: true  // Verbindet Punkte auch bei null-Werten
                });
            }
        });

        const result = {
            labels,
            datasets,
            isEmpty: datasets.length === 0
        };

        console.log('✅ Trends-Daten erfolgreich vorbereitet:', {
            labels: labels.length,
            datasets: datasets.length,
            metrics: datasets.map(d => d.label),
            isEmpty: result.isEmpty
        });

        return result;

    } catch (error) {
        console.error('❌ Fehler beim Vorbereiten der Trends-Daten:', error);
        return {
            labels: [],
            datasets: [],
            isEmpty: true,
            error: error.message
        };
    }
}

    /** Update heatmap chart */
    async updateHeatmapChart() {
        console.log('🔥 Updating heatmap chart...');
        
        const container = document.getElementById('heatmap-chart');
        if (!container) {
            console.warn('⚠️ Heatmap container not found');
            return;
        }

        try {
            const data = this.analyticsData?.period || [];
            const heatmapData = this.generateHeatmapData(data);
            
            container.innerHTML = `
                <div class="heatmap-grid">
                    <div class="text-center mb-4">
                        <h4 class="font-semibold text-lg mb-2">🔥 Aktivitäts-Heatmap</h4>
                        <p class="text-sm text-base-content/70">Letzten ${this.currentPeriod} Tage</p>
                    </div>
                    
                    <div class="grid grid-cols-7 gap-1 mb-4">
                        ${['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].map(day => `
                            <div class="text-xs text-center font-medium opacity-70 p-1">${day}</div>
                        `).join('')}
                    </div>
                    
                    <div class="grid grid-cols-7 gap-1 mb-4">
                        ${heatmapData.map(day => `
                            <div class="heatmap-cell ${this.getHeatmapColor(day.intensity)} 
                                 tooltip tooltip-top cursor-pointer"
                                 data-tip="${day.date}: ${day.steps} Schritte">
                                ${day.dayOfMonth}
                            </div>
                        `).join('')}
                    </div>
                    
                    <div class="flex justify-between items-center text-xs opacity-70">
                        <span>Weniger</span>
                        <div class="flex gap-1">
                            <div class="w-3 h-3 rounded bg-base-300"></div>
                            <div class="w-3 h-3 rounded bg-primary/20"></div>
                            <div class="w-3 h-3 rounded bg-primary/50"></div>
                            <div class="w-3 h-3 rounded bg-primary/80"></div>
                            <div class="w-3 h-3 rounded bg-primary"></div>
                        </div>
                        <span>Mehr</span>
                    </div>
                </div>
            `;

            // Hide placeholder
            const placeholder = document.getElementById('heatmap-placeholder');
            if (placeholder) {
                placeholder.style.display = 'none';
            }

            console.log('✅ Heatmap updated successfully');

        } catch (error) {
            console.error('❌ Heatmap error:', error);
            container.innerHTML = `
                <div class="alert alert-error">
                    <span>❌ Heatmap-Fehler: ${error.message}</span>
                </div>
            `;
        }
    }

    /** Generate heatmap data */
    generateHeatmapData(data) {
        const days = [];
        const today = new Date();
        
        // Generate data for the period
        for (let i = this.currentPeriod - 1; i >= 0; i--) {
            const date = new Date(today.getTime() - (i * 24 * 60 * 60 * 1000));
            const dateStr = date.toISOString().split('T')[0];
            
            const dayData = data.find(entry => {
                const entryDate = new Date(entry.date).toISOString().split('T')[0];
                return entryDate === dateStr;
            });
            
            const steps = dayData?.steps || 0;
            
            days.push({
                date: date.toLocaleDateString('de-DE'),
                dayOfMonth: date.getDate(),
                steps: steps,
                intensity: this.calculateHeatmapIntensity(steps)
            });
        }
        
        return days;
    }

    /** Calculate heatmap intensity */
    calculateHeatmapIntensity(steps) {
        if (steps === 0) return 0;
        if (steps < 3000) return 1;
        if (steps < 6000) return 2;
        if (steps < 10000) return 3;
        return 4;
    }

    /** Get heatmap color */
    getHeatmapColor(intensity) {
        const colors = [
            'bg-base-300',
            'bg-primary/20',
            'bg-primary/50',
            'bg-primary/80',
            'bg-primary'
        ];
        return colors[intensity] || colors[0];
    }

/** Get goal comparison text */
getGoalComparison(metric, value) {
    const goals = {
        steps: this.healthTracker.goals?.stepsGoal,
        water: this.healthTracker.goals?.waterGoal,
        sleep: this.healthTracker.goals?.sleepGoal
    };
    
    const goal = goals[metric];
    if (!goal) return '';
    
    const percentage = Math.round((value / goal) * 100);
    if (percentage >= 100) return '🎯';
    if (percentage >= 80) return '📈';
    return `${percentage}%`;
}

    /** Update analytics insights */
    async updateAnalyticsInsights(data) {
        console.log('🧠 Updating analytics insights...');
        
        const container = document.getElementById('analytics-insights');
        if (!container) {
            console.warn('⚠️ Analytics insights container not found');
            return;
        }

        try {
            const insights = this.generateInsights(data);
            
            container.innerHTML = insights.map(insight => `
                <div class="alert ${insight.type} shadow-sm">
                    <i data-lucide="${insight.icon}" class="w-5 h-5"></i>
                    <div>
                        <h4 class="font-semibold">${insight.title}</h4>
                        <p class="text-sm opacity-80">${insight.description}</p>
                    </div>
                </div>
            `).join('');

            // Reinitialize icons
            if (typeof lucide !== 'undefined') {
                lucide.createIcons();
            }

            console.log('✅ Analytics insights updated');

        } catch (error) {
            console.error('❌ Analytics insights error:', error);
            container.innerHTML = `
                <div class="alert alert-error">
                    <span>❌ Insights-Fehler: ${error.message}</span>
                </div>
            `;
        }
    }

    /** Update correlation insights */
    async updateCorrelationInsights(data) {
        console.log('🔗 Updating correlation insights...');
        
        const container = document.getElementById('correlation-insights');
        if (!container) {
            console.warn('⚠️ Correlation insights container not found');
            return;
        }

        try {
            const correlations = this.calculateCorrelations(data);
            
            container.innerHTML = correlations.map(corr => `
                <div class="bg-base-100 rounded-lg p-4 shadow-sm border border-base-300/50">
                    <div class="flex justify-between items-center mb-2">
                        <span class="font-medium flex items-center gap-2">
                            <span class="text-lg">${corr.icon}</span>
                            ${corr.title}
                        </span>
                        <div class="badge ${this.getCorrelationBadge(corr.strength)}">
                            ${this.getCorrelationLabel(corr.strength)}
                        </div>
                    </div>
                    <div class="w-full bg-base-300 rounded-full h-2 mb-2">
                        <div class="${this.getCorrelationColor(corr.strength)} h-2 rounded-full transition-all duration-500" 
                             style="width: ${Math.round(corr.strength * 100)}%"></div>
                    </div>
                    <p class="text-xs text-base-content/70">${corr.description}</p>
                </div>
            `).join('');

            console.log('✅ Correlation insights updated');

        } catch (error) {
            console.error('❌ Correlation insights error:', error);
            container.innerHTML = `
                <div class="alert alert-error">
                    <span>❌ Korrelations-Fehler: ${error.message}</span>
                </div>
            `;
        }
    }

    /** Generate insights */
    generateInsights(data) {
        const insights = [];
        
        if (!Array.isArray(data) || data.length < 2) {
            insights.push({
                type: 'alert-info',
                icon: 'info',
                title: 'Mehr Daten benötigt',
                description: 'Sammle mehr Gesundheitsdaten für aussagekräftige Insights.'
            });
            return insights;
        }

        // Trend analysis
        const stepsData = data.filter(d => d.steps && d.steps > 0).map(d => d.steps);
        if (stepsData.length >= 3) {
            const trend = this.calculateTrend(stepsData);
            if (trend > 0.1) {
                insights.push({
                    type: 'alert-success',
                    icon: 'trending-up',
                    title: 'Positive Entwicklung!',
                    description: `Deine Aktivität ist um ${Math.round(trend * 100)}% gestiegen.`
                });
            } else if (trend < -0.1) {
                insights.push({
                    type: 'alert-warning',
                    icon: 'trending-down',
                    title: 'Aktivität gesunken',
                    description: 'Zeit für mehr Bewegung! Wie wäre ein Spaziergang?'
                });
            }
        }

        // Sleep analysis
        const sleepData = data.filter(d => d.sleepHours && d.sleepHours > 0);
        if (sleepData.length >= 3) {
            const avgSleep = sleepData.reduce((sum, d) => sum + d.sleepHours, 0) / sleepData.length;
            if (avgSleep >= 8) {
                insights.push({
                    type: 'alert-success',
                    icon: 'moon',
                    title: 'Hervorragender Schlaf!',
                    description: `${Math.round(avgSleep * 10) / 10}h sind optimal für deine Erholung.`
                });
            } else if (avgSleep < 6) {
                insights.push({
                    type: 'alert-warning',
                    icon: 'moon',
                    title: 'Zu wenig Schlaf',
                    description: 'Versuche früher ins Bett zu gehen für bessere Gesundheit.'
                });
            }
        }

        // Data consistency
        if (data.length >= this.currentPeriod * 0.8) {
            insights.push({
                type: 'alert-success',
                icon: 'check-circle',
                title: 'Konsistentes Tracking!',
                description: 'Du trackst regelmäßig - das ist der Schlüssel zum Erfolg!'
            });
        }

        return insights.slice(0, 4); // Max 4 insights
    }

    /** Calculate correlations */
    calculateCorrelations(data) {
        if (!Array.isArray(data) || data.length < 5) {
            return [{
                icon: '📊',
                title: 'Mehr Daten benötigt',
                description: 'Mindestens 5 Einträge für Korrelationsanalyse erforderlich',
                strength: 0
            }];
        }

        const correlations = [];
        
        // Steps vs Sleep correlation
        const stepsData = data.filter(d => d.steps && d.sleepHours);
        if (stepsData.length >= 5) {
            const correlation = this.calculatePearsonCorrelation(
                stepsData.map(d => d.steps),
                stepsData.map(d => d.sleepHours)
            );
            
            correlations.push({
                icon: '🚶‍♂️💤',
                title: 'Schritte ↔ Schlaf',
                description: 'Mehr Bewegung führt zu besserem Schlaf',
                strength: Math.abs(correlation)
            });
        }

        // Add more correlations as needed
        correlations.push({
            icon: '💧📊',
            title: 'Hydration ↔ Energie',
            description: 'Ausreichend Trinken steigert das Wohlbefinden',
            strength: 0.65 // Placeholder
        });

        return correlations.sort((a, b) => b.strength - a.strength);
    }

    /** Calculate Pearson correlation */
    calculatePearsonCorrelation(x, y) {
        if (x.length !== y.length || x.length < 2) return 0;
        
        const n = x.length;
        const sumX = x.reduce((a, b) => a + b, 0);
        const sumY = y.reduce((a, b) => a + b, 0);
        const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
        const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);
        const sumYY = y.reduce((sum, yi) => sum + yi * yi, 0);
        
        const numerator = n * sumXY - sumX * sumY;
        const denominator = Math.sqrt((n * sumXX - sumX * sumX) * (n * sumYY - sumY * sumY));
        
        return denominator === 0 ? 0 : numerator / denominator;
    }

    /** Calculate trend */
    calculateTrend(data) {
        if (data.length < 2) return 0;
        const first = data[0];
        const last = data[data.length - 1];
        return first > 0 ? (last - first) / first : 0;
    }

    /** Calculate weekly improvement */
    calculateWeeklyImprovement(allData) {
        if (!Array.isArray(allData) || allData.length < 7) return 0;
        
        const now = new Date();
        const thisWeekStart = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));
        const lastWeekStart = new Date(now.getTime() - (14 * 24 * 60 * 60 * 1000));
        
        const thisWeek = allData.filter(entry => {
            const date = new Date(entry.date);
            return date >= thisWeekStart;
        });
        
        const lastWeek = allData.filter(entry => {
            const date = new Date(entry.date);
            return date >= lastWeekStart && date < thisWeekStart;
        });
        
        if (thisWeek.length === 0 || lastWeek.length === 0) return 0;
        
        const thisWeekSteps = thisWeek.reduce((sum, d) => sum + (d.steps || 0), 0);
        const lastWeekSteps = lastWeek.reduce((sum, d) => sum + (d.steps || 0), 0);
        
        return lastWeekSteps > 0 ? Math.round(((thisWeekSteps - lastWeekSteps) / lastWeekSteps) * 100) : 0;
    }

    /** Calculate goal achievement rate */
    calculateGoalAchievementRate(data) {
        if (!Array.isArray(data) || data.length === 0) return 0;
        
        let totalGoals = 0;
        let achievedGoals = 0;
        
        data.forEach(entry => {
            if (entry.steps !== undefined) {
                totalGoals++;
                if (entry.steps >= (this.healthTracker.goals?.stepsGoal || 10000)) {
                    achievedGoals++;
                }
            }
            if (entry.waterIntake !== undefined) {
                totalGoals++;
                if (entry.waterIntake >= (this.healthTracker.goals?.waterGoal || 2)) {
                    achievedGoals++;
                }
            }
            if (entry.sleepHours !== undefined) {
                totalGoals++;
                if (entry.sleepHours >= (this.healthTracker.goals?.sleepGoal || 8)) {
                    achievedGoals++;
                }
            }
        });
        
        return totalGoals > 0 ? Math.round((achievedGoals / totalGoals) * 100) : 0;
    }

    /** Calculate current streak */
    calculateCurrentStreak(allData) {
        if (!Array.isArray(allData) || allData.length === 0) return 0;
        
        let streak = 0;
        const today = new Date();
        
        for (let i = 0; i < 365; i++) {
            const checkDate = new Date(today.getTime() - (i * 24 * 60 * 60 * 1000));
            const dateStr = checkDate.toISOString().split('T')[0];
            
            const hasEntry = allData.some(entry => {
                const entryDate = new Date(entry.date).toISOString().split('T')[0];
                return entryDate === dateStr;
            });
            
            if (hasEntry) {
                streak++;
            } else {
                break;
            }
        }
        
        return streak;
    }

    /** Utility methods */
    getYAxisLabel() {
        const labels = {
            steps: 'Schritte',
            water: 'Liter',
            sleep: 'Stunden',
            weight: 'Kilogramm',
            all: 'Schritte'
        };
        return labels[this.currentMetric] || 'Wert';
    }

    getMetricTitle() {
        const titles = {
            steps: 'Schritte-Trends',
            water: 'Wasserzufuhr-Trends',
            sleep: 'Schlaf-Trends',
            weight: 'Gewichts-Trends',
            all: 'Alle Metriken'
        };
        return titles[this.currentMetric] || 'Gesundheitstrends';
    }

    getCorrelationBadge(strength) {
        if (strength >= 0.7) return 'badge-success';
        if (strength >= 0.4) return 'badge-warning';
        return 'badge-error';
    }

    getCorrelationLabel(strength) {
        if (strength >= 0.7) return 'Stark';
        if (strength >= 0.4) return 'Mittel';
        return 'Schwach';
    }

    getCorrelationColor(strength) {
        if (strength >= 0.7) return 'bg-success';
        if (strength >= 0.4) return 'bg-warning';
        return 'bg-error';
    }

    updateStatElement(id, value) {
        const element = document.getElementById(id);
        if (element) {
            element.style.transform = 'scale(1.1)';
            element.textContent = value;
            setTimeout(() => {
                element.style.transform = 'scale(1)';
            }, 200);
        }
    }

    showAllLoadingStates() {
        ['trends-loading', 'correlation-loading', 'weekly-loading', 'ai-insights-loading'].forEach(id => {
            const element = document.getElementById(id);
            if (element) element.classList.remove('hidden');
        });
    }

    hideAllLoadingStates() {
        ['trends-loading', 'correlation-loading', 'weekly-loading', 'ai-insights-loading'].forEach(id => {
            const element = document.getElementById(id);
            if (element) element.classList.add('hidden');
        });
    }

    showChartError(canvas, message) {
        const container = canvas.parentElement;
        container.innerHTML = `
            <div class="flex items-center justify-center h-64 bg-base-200 rounded-lg">
                <div class="text-center">
                    <div class="text-4xl mb-2">📊</div>
                    <div class="font-semibold text-error">Chart-Fehler</div>
                    <div class="text-sm opacity-70">${message}</div>
                </div>
            </div>
        `;
    }

    showAnalyticsError(error) {
        const container = document.getElementById('analytics-total-entries')?.closest('.stats');
        if (container) {
            const errorDiv = document.createElement('div');
            errorDiv.className = 'alert alert-error mb-4';
            errorDiv.innerHTML = `
                <span>⚠️</span>
                <span>Analytics Fehler: ${error.message}</span>
                <button class="btn btn-sm" onclick="this.parentElement.remove()">OK</button>
            `;
            container.parentElement.insertBefore(errorDiv, container);
        }
    }

    /** Public method to force refresh analytics */
    async updateAllAnalytics() {
        await this.loadCompleteAnalyticsData();
    }
}

// === PWA INSTALL PROMPT (Globale Funktion) ===
let deferredPrompt;

window.addEventListener('beforeinstallprompt', (e) => {
    console.log('📱 PWA Install Prompt verfügbar');
    e.preventDefault();
    deferredPrompt = e;
    
    // Install-Button in der UI anzeigen falls gewünscht
    const installHint = document.querySelector('.install-available');
    if (installHint) installHint.classList.remove('hidden');
});

function showInstallPrompt() {
    console.log('📱 PWA Installation wird angezeigt');
    
    if (deferredPrompt) {
        deferredPrompt.prompt();
        deferredPrompt.userChoice.then((choiceResult) => {
            if (choiceResult.outcome === 'accepted') {
                console.log('✅ PWA Installation akzeptiert');
                healthTracker.showToast('📱 App wird installiert...', 'success');
            } else {
                console.log('❌ PWA Installation abgelehnt');
            }
            deferredPrompt = null;
        });
    } else {
        // Detaillierte Installationsanleitung für verschiedene Browser
        const userAgent = navigator.userAgent.toLowerCase();
        let instructions = '';
        
        if (userAgent.includes('chrome') && !userAgent.includes('edge')) {
            instructions = `
                <h4>Google Chrome:</h4>
                <ul>
                    <li>Klicke auf das <strong>⋮</strong> Menü (oben rechts)</li>
                    <li>Wähle <strong>"App installieren..."</strong> oder <strong>"Zu Startbildschirm hinzufügen"</strong></li>
                    <li>Alternativ: <strong>Strg+Shift+A</strong> (Windows) oder <strong>Cmd+Shift+A</strong> (Mac)</li>
                </ul>
            `;
        } else if (userAgent.includes('edge')) {
            instructions = `
                <h4>Microsoft Edge:</h4>
                <ul>
                    <li>Klicke auf das <strong>⋯</strong> Menü (oben rechts)</li>
                    <li>Wähle <strong>"Apps" → "Diese Seite als App installieren"</strong></li>
                    <li>Oder verwende <strong>Strg+Shift+I</strong></li>
                </ul>
            `;
        } else if (userAgent.includes('safari')) {
            instructions = `
                <h4>Safari (iPhone/iPad):</h4>
                <ul>
                    <li>Tippe auf das <strong>Teilen</strong>-Symbol 📤</li>
                    <li>Scrolle nach unten und wähle <strong>"Zum Home-Bildschirm"</strong></li>
                    <li>Tippe auf <strong>"Hinzufügen"</strong></li>
                </ul>
            `;
        } else if (userAgent.includes('firefox')) {
            instructions = `
                <h4>Firefox:</h4>
                <ul>
                    <li>Klicke auf das <strong>≡</strong> Menü (oben rechts)</li>
                    <li>Wähle <strong>"Diese Seite installieren"</strong></li>
                    <li>Oder suche nach dem <strong>➕</strong> Symbol in der Adressleiste</li>
                </ul>
            `;
        } else {
            instructions = `
                <h4>Allgemeine Anleitung:</h4>
                <ul>
                    <li>Suche in den <strong>Browser-Einstellungen</strong> nach "App installieren" oder "Startbildschirm"</li>
                    <li>Oder erstelle ein <strong>Lesezeichen</strong> für schnellen Zugriff</li>
                </ul>
            `;
        }
        
        const modal = document.createElement('div');
        modal.className = 'modal modal-open';
        modal.innerHTML = `
            <div class="modal-box max-w-2xl">
                <h3 class="font-bold text-lg mb-4">📱 App Installation</h3>
                <div class="alert alert-info mb-4">
                    <i data-lucide="info" class="w-5 h-5"></i>
                    <span>Der automatische Install-Button ist in diesem Browser nicht verfügbar.</span>
                </div>
                
                <div class="prose max-w-none">
                    <p>Du kannst diese Health Tracker App trotzdem installieren:</p>
                    ${instructions}
                    
                    <div class="bg-base-200 p-4 rounded-lg mt-4">
                        <h4>🚀 Vorteile der Installation:</h4>
                        <ul>
                            <li>✅ Funktioniert komplett offline</li>
                            <li>⚡ Schnellere Ladezeiten</li>
                            <li>🏠 Eigenes App-Icon auf dem Startbildschirm</li>
                            <li>🔔 Push-Benachrichtigungen</li>
                            <li>📱 Native App-Erfahrung</li>
                        </ul>
                    </div>
                </div>

                <div class="modal-action">
                    <button class="btn btn-primary" onclick="window.open(window.location.href, '_blank')">
                        🔗 In neuem Tab öffnen
                    </button>
                    <button class="btn" onclick="this.closest('.modal').remove()">Schließen</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        
        // Lucide Icons neu laden für das Modal
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }

    // Auto-Initialisierung des Install Hints
function initializeInstallHint() {
    // Warte bis DOM vollständig geladen ist
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(addInstallHintToNav, 1000);
        });
    } else {
        setTimeout(addInstallHintToNav, 1000);
    }

    // Auch nach beforeinstallprompt Event
    window.addEventListener('beforeinstallprompt', () => {
        setTimeout(addInstallHintToNav, 500);
    });
}

// CSS Animation Styles dynamisch hinzufügen
function addInstallHintStyles() {
    if (!document.getElementById('install-hint-styles')) {
        const style = document.createElement('style');
        style.id = 'install-hint-styles';
        style.textContent = `
            #nav-install-hint {
                animation: subtle-pulse 3s ease-in-out infinite;
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            }
            
            @keyframes subtle-pulse {
                0%, 100% { 
                    opacity: 1; 
                    transform: scale(1);
                }
                50% { 
                    opacity: 0.8; 
                    transform: scale(1.02);
                }
            }
            
            #nav-install-hint:hover {
                animation: none;
            }
            
            @media (max-width: 640px) {
                #nav-install-hint {
                    padding: 0.25rem 0.75rem;
                }
            }
        `;
        document.head.appendChild(style);
    }
}

// Initialisierung starten
initializeInstallHint();
addInstallHintStyles();
}

// === PWA INSTALL VERBESSERUNGEN ===

// Install Button Status Tracking
let installButtonVisible = false;

// Verbesserte Install Prompt Verfügbarkeit
window.addEventListener('beforeinstallprompt', (e) => {
    console.log('📱 PWA Install Prompt verfügbar');
    e.preventDefault();
    deferredPrompt = e;
    
    // Install-Button in der UI anzeigen
    const installHint = document.querySelector('.install-available');
    if (installHint) {
        installHint.classList.remove('hidden');
        installButtonVisible = true;
    }
    
    // Custom Install Button aktivieren falls vorhanden
    const customInstallBtn = document.getElementById('custom-install-btn');
    if (customInstallBtn) {
        customInstallBtn.style.display = 'block';
        customInstallBtn.onclick = showInstallPrompt;
    }
    
    // Install Hint in Navigation hinzufügen
    addInstallHintToNav();
});

// Enhanced Install Hint für Navigation mit verbesserter Darstellung
function addInstallHintToNav() {
    const navbar = document.querySelector('.navbar');
    const navbarEnd = document.querySelector('.navbar-end');
    
    if (!navbar || document.getElementById('nav-install-hint')) {
        return; // Bereits vorhanden oder keine Navbar
    }

    // Prüfe ob bereits installiert
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const isInstalled = navigator.standalone || isStandalone;
    
    if (isInstalled) {
        console.log('📱 App bereits installiert - Install Hint wird nicht angezeigt');
        return;
    }

    // Erstelle Install Hint mit verbessertem Design
    const installHint = document.createElement('div');
    installHint.id = 'nav-install-hint';
    installHint.className = 'flex items-center gap-2 px-3 py-1 bg-primary/10 hover:bg-primary/20 rounded-full border border-primary/30 transition-all duration-300 cursor-pointer group';
    
    installHint.innerHTML = `
        <div class="flex items-center gap-2 text-primary">
            <svg class="w-4 h-4 group-hover:scale-110 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
            </svg>
            <span class="text-sm font-medium hidden sm:inline">App installieren</span>
            <span class="text-sm font-medium sm:hidden">Install</span>
        </div>
    `;

    // Tooltip für bessere UX
    installHint.setAttribute('title', 'Health Tracker Pro als App installieren');
    
    // Click Handler mit Feedback
    installHint.addEventListener('click', (e) => {
        e.preventDefault();
        
        // Visual Feedback
        installHint.style.transform = 'scale(0.95)';
        setTimeout(() => {
            installHint.style.transform = 'scale(1)';
        }, 150);
        
        showInstallPrompt();
    });

    // Hover Effekte
    installHint.addEventListener('mouseenter', () => {
        installHint.style.transform = 'translateY(-1px)';
        installHint.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.15)';
    });

    installHint.addEventListener('mouseleave', () => {
        installHint.style.transform = 'translateY(0)';
        installHint.style.boxShadow = 'none';
    });

    // Positionierung in der Navbar
    if (navbarEnd) {
        // Füge vor dem Theme-Toggle ein
        const themeToggle = navbarEnd.querySelector('#theme-toggle') || navbarEnd.querySelector('[data-theme-toggle]');
        if (themeToggle) {
            navbarEnd.insertBefore(installHint, themeToggle);
        } else {
            navbarEnd.appendChild(installHint);
        }
    } else {
        // Fallback: Direkt zur Navbar hinzufügen
        navbar.appendChild(installHint);
    }

    console.log('📱 Enhanced Install Hint zur Navigation hinzugefügt');

    // Auto-hide nach 10 Sekunden wenn nicht verwendet
    setTimeout(() => {
        if (installHint && !installHint.dataset.clicked) {
            installHint.style.opacity = '0.7';
            installHint.style.transform = 'scale(0.9)';
        }
    }, 10000);

    // Entfernen nach App-Installation
    window.addEventListener('appinstalled', () => {
        installHint?.remove();
    });
}

// Erweiterte Install Prompt Funktion
function showInstallPrompt() {
    const installHint = document.getElementById('nav-install-hint');
    if (installHint) {
        installHint.dataset.clicked = 'true';
    }

    if (deferredPrompt) {
        console.log('✅ Zeige nativen Install Prompt');
        
        // Visual Feedback
        if (installHint) {
            installHint.style.display = 'none';
        }
        
        deferredPrompt.prompt();
        
        deferredPrompt.userChoice.then((choiceResult) => {
            console.log('👤 Install Choice:', choiceResult.outcome);
            
            if (choiceResult.outcome === 'accepted') {
                showToast('✅ App wird installiert...', 'success');
            } else {
                // Hint wieder anzeigen falls abgelehnt
                if (installHint) {
                    installHint.style.display = 'flex';
                }
                showToast('ℹ️ Installation abgebrochen', 'info');
            }
            
            deferredPrompt = null;
        });
    } else {
        console.log('⚠️ Kein deferredPrompt - zeige manuelle Anweisungen');
        showManualInstallInstructions();
    }
}

// PWA Install Check beim App-Start
function checkPWAInstallability() {
    // Prüfe ob bereits installiert
    if (window.matchMedia('(display-mode: standalone)').matches) {
        console.log('✅ PWA bereits installiert (Standalone Mode)');
        return;
    }
    
    // Prüfe Browser-Support
    if ('serviceWorker' in navigator && 'BeforeInstallPromptEvent' in window) {
        console.log('🔧 Browser unterstützt PWA Installation');
        
        // Zeige Install-Hinweis nach 30 Sekunden falls kein Prompt erschien
        setTimeout(() => {
            if (!deferredPrompt && !installButtonVisible) {
                showManualInstallGuide();
            }
        }, 30000);
    }
}

// Manuelle Installationsanleitung anzeigen
function showManualInstallGuide() {
    const toast = document.createElement('div');
    toast.className = 'toast toast-end z-50';
    toast.innerHTML = `
        <div class="alert alert-info cursor-pointer" onclick="showInstallPrompt()">
            <div>
                <span class="text-sm font-medium">📱 App installieren?</span>
                <div class="text-xs opacity-75">Für bessere Performance</div>
            </div>
        </div>
    `;
    
    document.body.appendChild(toast);
    
    // Auto-remove nach 10 Sekunden
    setTimeout(() => {
        toast.remove();
    }, 10000);
}

// PWA Installation Tracking
window.addEventListener('appinstalled', (evt) => {
    console.log('✅ PWA erfolgreich installiert');
    
    // Alle Install-Hints entfernen
    const installHints = document.querySelectorAll('.install-available, #nav-install-hint, #custom-install-btn');
    installHints.forEach(hint => hint.remove());
    
    // Success Toast
    if (typeof healthTracker !== 'undefined' && healthTracker.showToast) {
        healthTracker.showToast('🎉 App erfolgreich installiert!', 'success');
    }
    
    // Analytics Event (falls verfügbar)
    if (typeof gtag !== 'undefined') {
        gtag('event', 'pwa_installed');
    }
});

// Initialisierung beim App-Start
document.addEventListener('DOMContentLoaded', () => {
    checkPWAInstallability();
});
