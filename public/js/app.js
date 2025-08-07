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
    
    /**
 * Setup Progress Hub tab navigation
 */
setupProgressHubTabs() {
    const tabs = document.querySelectorAll('[id^="tab-"]');
    console.log('🔧 Setting up progress hub tabs:', tabs.length);
    
    tabs.forEach(tab => {
        // Remove existing listeners to prevent duplicates
        const newTab = tab.cloneNode(true);
        tab.parentNode.replaceChild(newTab, tab);
        
        newTab.addEventListener('click', (e) => {
            e.preventDefault();
            const viewName = newTab.id.replace('tab-', '');
            console.log('📊 Tab clicked:', viewName);
            
            if (this.progressHub && typeof this.progressHub.showView === 'function') {
                this.progressHub.showView(viewName);
            } else {
                console.error('❌ ProgressHub nicht verfügbar oder showView Methode fehlt');
            }
        });
    });
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
        }
        else {
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
    aggregatedData.notes = aggregatedData.notes.length > 0 ? aggregatedData.notes.join(' | ') : null;
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
     * Get current week's health data
     */
    getWeekData(allData) {
        const now = new Date();
        const oneWeekAgo = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));
        
        return allData.filter(entry => {
            const entryDate = new Date(entry.date);
            return entryDate >= oneWeekAgo && entryDate <= now;
        });
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
    
    /**
 * Refresh all components with new data
 */
async refreshAllComponents() {
    try {
        // Clear cache to force fresh data
        this.cache.delete('allHealthData');
        
        // Update dashboard
        await this.updateDashboardStats();
        
        // Refresh activity feed
        if (this.activityFeed && typeof this.activityFeed.load === 'function') {
            await this.activityFeed.load();
        }
        
        // **FIX: ProgressHub korrekt refreshen**
        if (this.progressHub && typeof this.progressHub.loadViewData === 'function') {
            await this.progressHub.loadViewData();
            // Aktueller View wird automatisch durch handleDataUpdate aktualisiert
        }
        
        // Refresh analytics
        if (this.analyticsEngine && typeof this.analyticsEngine.updateAllAnalytics === 'function') {
            await this.analyticsEngine.updateAllAnalytics();
        }
        
    } catch (error) {
        console.error('❌ Fehler beim Aktualisieren der Komponenten:', error);
    }
}

/**
 * Update dashboard statistics
 */
async updateDashboardStats() {
    try {
        const data = await this.getAllHealthData();
        const todayData = this.getTodayData(data);
        const weekData = this.getWeekData(data);

        // Update today's stats
        this.updateStatCard('today-weight', todayData.weight, 'kg', '⚖️');
        this.updateStatCard('today-steps', todayData.steps, '', '🚶♂️');
        this.updateStatCard('today-water', todayData.waterIntake, 'L', '💧');
        this.updateStatCard('today-sleep', todayData.sleepHours, 'h', '😴');

        // Update weekly averages
        const weeklyAvg = this.calculateWeeklyAverages(weekData);
        this.updateStatCard('week-steps', weeklyAvg.steps, '', '📊');
        this.updateStatCard('week-water', weeklyAvg.water, 'L', '📈');
        this.updateStatCard('week-sleep', weeklyAvg.sleep, 'h', '🌙');

        // Update goal progress
        this.updateGoalProgress(todayData);

        console.log('📊 Dashboard Stats aktualisiert');
    } catch (error) {
        console.error('❌ Fehler beim Aktualisieren der Statistiken:', error);
    }
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
     * Make API call with error handling and retries
     */
    async makeAPICall(endpoint, options = {}) {
        const defaultOptions = {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
            timeout: 10000
        };
        
        const finalOptions = { ...defaultOptions, ...options };
        
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), finalOptions.timeout);
            
            const response = await fetch(endpoint, {
                ...finalOptions,
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            return await response.json();
            
        } catch (error) {
            if (error.name === 'AbortError') {
                throw new Error('Request timeout');
            }
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
    showToast(message, type = 'info', duration = 4000) {
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
        
        // Auto remove
        setTimeout(() => {
            toast.style.transform = 'translateY(-100%)';
            setTimeout(() => toast.remove(), 300);
        }, duration);
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
     * Initialize footer functionality
     */
    initializeFooter() {
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

            /** Initialize Analytics Event Listeners through HealthTracker */
    initializeAnalyticsEventListeners() {
        console.log('📊 Initializing analytics event listeners...');
        
        // Check if analytics engine exists
        if (!this.analyticsEngine) {
            console.log('⚠️ Analytics engine not available yet, retrying...');
            setTimeout(() => this.initializeAnalyticsEventListeners(), 1000);
            return;
        }
        
        // Period filter buttons
        document.querySelectorAll('[data-period]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                // Update active state
                document.querySelectorAll('[data-period]').forEach(b => {
                    b.classList.remove('btn-primary');
                    b.classList.add('btn-ghost');
                });
                e.target.classList.remove('btn-ghost');
                e.target.classList.add('btn-primary');
                
                // Trigger analytics update through AnalyticsEngine
                const period = parseInt(e.target.dataset.period);
                console.log('📊 Updating analytics period to:', period);
                this.analyticsEngine.updateAnalyticsPeriod(period);
            });
        });

        // Metric selection buttons
        document.querySelectorAll('[data-metric]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                // Update tab states
                document.querySelectorAll('[data-metric]').forEach(b => b.classList.remove('tab-active'));
                e.target.classList.add('tab-active');
                
                // Update chart through AnalyticsEngine
                const metric = e.target.dataset.metric;
                console.log('📈 Updating trends chart for metric:', metric);
                this.analyticsEngine.updateTrendsChart(metric);
            });
        });
        
        console.log('✅ Analytics event listeners initialized successfully');
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
 * Load data for all views
 */
async loadViewData() {
    try {
        const allData = await this.healthTracker.getAllHealthData();
        
        // Verwende die funktionierende HealthTracker Methode
        this.todayData = this.healthTracker.getTodayData(allData);
        
        // Debug-Ausgabe zur Überprüfung
        console.log('🔍 Rohdaten vom HealthTracker:', allData);
        console.log('🔍 Aggregierte Today-Daten:', this.todayData);
        
        // Get week data
        this.weekData = this.healthTracker.getWeekData(allData);
        
        // Get month data  
        this.monthData = this.getMonthData(allData);
        
        console.log('📊 Progress Hub Daten geladen:', {
            today: this.todayData,
            weekEntries: this.weekData.length,
            monthEntries: this.monthData.length
        });
        
    } catch (error) {
        console.error('❌ Fehler beim Laden der Progress Hub Daten:', error);
        this.healthTracker.showToast('⚠️ Fehler beim Laden der Daten', 'error');
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
 * Show specific view in progress hub
 */
showView(viewName) {
    console.log('🔄 ProgressHub showView called:', viewName);
    
    this.currentView = viewName;
    
    // Update tab states (DaisyUI tabs)
    const tabs = document.querySelectorAll('[id^="tab-"]');
    console.log('📊 Found tabs:', tabs.length);
    
    tabs.forEach(tab => {
        tab.classList.remove('tab-active');
    });
    
    const activeTab = document.getElementById(`tab-${viewName}`);
    console.log('🎯 Active tab element:', activeTab);
    
    if (activeTab) {
        activeTab.classList.add('tab-active');
    }

    // Show appropriate content
    const container = document.getElementById('progress-content');
    console.log('📦 Progress content container:', container);
    
    if (!container) {
        console.error('❌ progress-content Container nicht gefunden!');
        return;
    }

    // Analytics view - trigger analytics engine
        if (viewName === 'analytics') {
            console.log('📊 Switching to analytics view - triggering analytics engine...');
            setTimeout(() => {
                if (this.healthTracker.analyticsEngine) {
                    this.healthTracker.analyticsEngine.updateAllAnalytics();
                }
            }, 100);
        }

    switch (viewName) {
        case 'today':
            console.log('📅 Showing today view');
            this.showTodayView();
            break;
        case 'week':
            console.log('📊 Showing week view');
            this.showWeekView();
            break;
        case 'analytics':
            console.log('📈 Showing analytics view');
            this.showAnalyticsView();
            break;
        default:
            console.log('📅 Default to today view');
            this.showTodayView();
    }
}

    /**
 * Enhanced today view with robust data handling
 */
showTodayView() {
    const container = document.getElementById('progress-content');
    if (!container) return;

    // Verbesserte Datenprüfung - prüft auf echte Gesundheitsdaten
    const hasHealthData = this.todayData && (
        (this.todayData.weight !== null && this.todayData.weight !== undefined) ||
        (this.todayData.steps && this.todayData.steps > 0) ||
        (this.todayData.waterIntake && this.todayData.waterIntake > 0) ||
        (this.todayData.sleepHours && this.todayData.sleepHours > 0) ||
        this.todayData.mood ||
        this.todayData.notes
    );

    console.log('🔍 Today View Datenprüfung:', {
        todayData: this.todayData,
        hasHealthData: hasHealthData,
        dataKeys: Object.keys(this.todayData || {})
    });

    if (!hasHealthData) {
        container.innerHTML = this.getEmptyStateHTML();
        return;
    }

    // Berechne Zielfortschritt
    const goalProgress = this.calculateGoalProgress();

    // Stimmungs-Mapping
    const moodEmojis = {
        'excellent': '😄',
        'good': '😊', 
        'neutral': '😐',
        'bad': '😞',
        'terrible': '😢'
    };

    const moodColors = {
        'excellent': 'badge-success',
        'good': 'badge-primary',
        'neutral': 'badge-ghost', 
        'bad': 'badge-warning',
        'terrible': 'badge-error'
    };

    container.innerHTML = `
        <div class="space-y-8">
            <!-- Enhanced Header Section -->
            <div class="text-center">
                <div class="flex flex-col items-center gap-3">
                    <div class="avatar placeholder">
                        <div class="bg-gradient-to-br from-primary to-secondary text-primary-content rounded-full w-16 h-16">
                            <i data-lucide="calendar-check" class="w-8 h-8"></i>
                        </div>
                    </div>
                    <div>
                        <h3 class="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                            Heute's Fortschritt
                        </h3>
                        <p class="text-lg text-base-content/70 mt-2">
                            ${new Date(this.todayData.date).toLocaleDateString('de-DE', { 
                                weekday: 'long', 
                                year: 'numeric', 
                                month: 'long', 
                                day: 'numeric' 
                            })}
                        </p>
                    </div>
                </div>

                <!-- Status Badges -->
                <div class="flex flex-wrap justify-center gap-2 mt-4">
                    ${this.todayData.entryCount > 1 ? `
                        <div class="badge badge-primary gap-2">
                            <i data-lucide="database" class="w-3 h-3"></i>
                            ${this.todayData.entryCount} Einträge heute
                        </div>
                    ` : ''}
                    ${this.todayData.lastUpdatedFormatted ? `
                        <div class="badge badge-ghost gap-2">
                            <i data-lucide="clock" class="w-3 h-3"></i>
                            Zuletzt: ${this.todayData.lastUpdatedFormatted}
                        </div>
                    ` : ''}
                    ${goalProgress.hasGoals ? `
                        <div class="badge badge-success gap-2">
                            <i data-lucide="target" class="w-3 h-3"></i>
                            ${goalProgress.completedGoals}/${goalProgress.totalGoals} Ziele erreicht
                        </div>
                    ` : ''}
                </div>
            </div>

            <!-- Overall Progress Ring -->
            ${goalProgress.hasGoals ? `
                <div class="flex justify-center">
                    <div class="relative">
                        <div class="radial-progress text-primary border-4 border-primary/20" 
                             style="--value:${Math.round(goalProgress.overallProgress)}; --size:10rem; --thickness: 8px;" 
                             role="progressbar">
                            <div class="text-center">
                                <div class="text-3xl font-bold text-primary">${Math.round(goalProgress.overallProgress)}%</div>
                                <div class="text-xs text-base-content/70">Tagesziele</div>
                            </div>
                        </div>
                        ${goalProgress.overallProgress >= 100 ? `
                            <div class="absolute -top-2 -right-2">
                                <div class="badge badge-success gap-1">
                                    <i data-lucide="trophy" class="w-3 h-3"></i>
                                    Perfekt!
                                </div>
                            </div>
                        ` : ''}
                    </div>
                </div>
            ` : ''}

            <!-- Enhanced Metrics Grid -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                ${this.renderMetricCard('⚖️', 'Gewicht', this.todayData.weight, 'kg', this.healthTracker.goals.weightGoal, 'weight')}
                ${this.renderMetricCard('🚶♂️', 'Schritte', this.todayData.steps, '', this.healthTracker.goals.stepsGoal, 'steps')}
                ${this.renderMetricCard('💧', 'Wasser', this.todayData.waterIntake, 'L', this.healthTracker.goals.waterGoal, 'water')}
                ${this.renderMetricCard('😴', 'Schlaf', this.todayData.sleepHours, 'h', this.healthTracker.goals.sleepGoal, 'sleep')}
            </div>

            <!-- Enhanced Mood and Notes Section -->
            ${(this.todayData.mood || this.todayData.notes) ? `
                <div class="card bg-gradient-to-br from-base-100 to-base-200/50 border border-base-300/50 shadow-xl">
                    <div class="card-body">
                        <h4 class="card-title text-xl flex items-center gap-3">
                            <i data-lucide="heart" class="w-5 h-5 text-accent"></i>
                            Stimmung & Notizen
                        </h4>
                        
                        ${this.todayData.mood ? `
                            <div class="mb-4">
                                <div class="flex items-center gap-3 mb-2">
                                    <span class="text-3xl">${moodEmojis[this.todayData.mood] || '😐'}</span>
                                    <div>
                                        <div class="text-sm text-base-content/70">Heutige Stimmung:</div>
                                        <div class="badge ${moodColors[this.todayData.mood] || 'badge-ghost'} badge-lg">
                                            ${this.todayData.mood.charAt(0).toUpperCase() + this.todayData.mood.slice(1)}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ` : ''}
                        
                        ${this.todayData.notes ? `
                            <div>
                                <div class="text-sm text-base-content/70 mb-2 flex items-center gap-2">
                                    <i data-lucide="file-text" class="w-4 h-4"></i>
                                    Notizen:
                                </div>
                                <div class="bg-base-200/50 rounded-lg p-4 border border-base-300/30">
                                    <pre class="whitespace-pre-wrap font-sans text-base-content/90 text-sm leading-relaxed">${this.todayData.notes}</pre>
                                </div>
                            </div>
                        ` : ''}
                    </div>
                </div>
            ` : ''}

            <!-- Quick Actions Section -->
            <div class="card bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5 border border-primary/20 shadow-lg">
                <div class="card-body p-6">
                    <h4 class="card-title text-lg flex items-center gap-2 mb-4">
                        <i data-lucide="zap" class="w-5 h-5 text-primary"></i>
                        Schnellaktionen
                    </h4>
                    
                    <div class="flex flex-col sm:flex-row gap-3 justify-center">
                        <button onclick="document.getElementById('health-form').scrollIntoView({ behavior: 'smooth' })" 
                                class="btn btn-primary btn-lg gap-3 shadow-lg hover:shadow-xl transition-all duration-300 group">
                            <i data-lucide="plus-circle" class="w-5 h-5 group-hover:rotate-90 transition-transform duration-300"></i>
                            Weitere Daten hinzufügen
                        </button>
                        
                        <button onclick="healthTracker.progressHub.showView('week')" 
                                class="btn btn-success btn-lg gap-3 shadow-lg hover:shadow-xl transition-all duration-300">
                            <i data-lucide="trending-up" class="w-5 h-5"></i>
                            Wochenübersicht
                        </button>
                        
                        <button onclick="healthTracker.progressHub.showView('analytics')" 
                                class="btn btn-accent btn-lg gap-3 shadow-lg hover:shadow-xl transition-all duration-300">
                            <i data-lucide="bar-chart-3" class="w-5 h-5"></i>
                            Analytics
                        </button>
                    </div>
                </div>
            </div>

            <!-- Achievement Celebration -->
            ${goalProgress.overallProgress >= 100 ? `
                <div class="alert alert-success shadow-lg">
                    <div class="flex items-center gap-3">
                        <i data-lucide="trophy" class="w-8 h-8"></i>
                        <div>
                            <h3 class="font-bold text-lg">🎉 Fantastisch!</h3>
                            <div class="text-sm">Du hast alle deine Tagesziele erreicht! Weiter so!</div>
                        </div>
                    </div>
                </div>
            ` : goalProgress.overallProgress >= 75 ? `
                <div class="alert alert-info shadow-lg">
                    <div class="flex items-center gap-3">
                        <i data-lucide="star" class="w-8 h-8"></i>
                        <div>
                            <h3 class="font-bold">💪 Großartig!</h3>
                            <div class="text-sm">Du bist auf einem sehr guten Weg - nur noch ein kleiner Schritt zu 100%!</div>
                        </div>
                    </div>
                </div>
            ` : ''}
    `;

    // Re-initialize Lucide icons
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }

    console.log('✅ Today View erfolgreich gerendert');
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
// ANALYTICS ENGINE - Vollständige Neuimplementierung
// ====================================================================
class AnalyticsEngine {
    constructor(healthTracker) {
        this.healthTracker = healthTracker;
        this.currentPeriod = 7;
        this.currentMetric = 'steps';
        this.charts = {};
        this.isInitialized = false;
        this.analyticsData = {};
        this.initialize();
    }

    /** Initialize analytics engine */
    async initialize() {
        console.log('📊 Analytics Engine wird initialisiert...');
        
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setup());
        } else {
            await this.setup();
        }
    }

    /** Setup analytics engine after DOM is ready */
    async setup() {
        try {
            // Setup event listeners for existing HTML elements
            this.setupEventListeners();
            
            // Initial data load
            setTimeout(async () => {
                await this.loadAndDisplayAnalytics();
                this.isInitialized = true;
                console.log('✅ Analytics Engine erfolgreich initialisiert');
            }, 1000);
        } catch (error) {
            console.error('❌ Analytics Engine Setup-Fehler:', error);
        }
    }

    /** Setup all event listeners for existing HTML elements */
    setupEventListeners() {
        console.log('📊 Setting up analytics event listeners...');
        
        // Period filter buttons (data-period)
        document.querySelectorAll('[data-period]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const period = parseInt(e.target.dataset.period);
                console.log('📊 Period filter clicked:', period);
                this.updatePeriod(period);
            });
        });

        // Metric tabs (data-metric)
        document.querySelectorAll('[data-metric]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const metric = e.target.dataset.metric;
                console.log('📈 Metric tab clicked:', metric);
                this.updateMetric(metric);
            });
        });

        // Refresh button
        const refreshBtn = document.querySelector('[onclick*="analyticsEngine"]');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                console.log('🔄 Manual analytics refresh');
                this.loadAndDisplayAnalytics();
            });
        }
        
        console.log('✅ Analytics event listeners setup complete');
    }

    /** Update period and refresh data */
    async updatePeriod(period) {
        this.currentPeriod = period;
        console.log(`📊 Updating analytics period to ${period} days`);
        
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
        
        await this.loadAndDisplayAnalytics();
    }

    /** Update metric and refresh chart */
    async updateMetric(metric) {
        this.currentMetric = metric;
        console.log(`📈 Updating analytics metric to ${metric}`);
        
        // Update tab states
        document.querySelectorAll('[data-metric]').forEach(btn => {
            btn.classList.remove('tab-active');
        });
        const activeTab = document.querySelector(`[data-metric="${metric}"]`);
        if (activeTab) {
            activeTab.classList.add('tab-active');
        }
        
        // Refresh trends chart with new metric
        await this.updateTrendsChart();
    }

    /** Load and display all analytics data */
    async loadAndDisplayAnalytics() {
        try {
            console.log('📊 Loading analytics data...');
            this.showLoadingStates();

            const allData = await this.healthTracker.getAllHealthData();
            const periodData = this.getDataForPeriod(allData, this.currentPeriod);
            
            console.log(`📊 Analytics data: ${allData.length} total entries, ${periodData.length} for ${this.currentPeriod} days`);
            
            // Update all analytics components
            await Promise.all([
                this.updateQuickStats(allData, periodData),
                this.updateTrendsChart(periodData),
                this.updateHeatmap(periodData),
                this.updateCorrelationAnalysis(periodData),
                this.updateWeeklySummary(allData),
                this.updateAIInsights(periodData)
            ]);

            this.hideLoadingStates();
            console.log('✅ Analytics data loaded successfully');
        } catch (error) {
            console.error('❌ Analytics data loading error:', error);
            this.hideLoadingStates();
            this.showErrorState();
        }
    }

    /** Get data for specific period */
    getDataForPeriod(allData, days) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);
        
        return allData.filter(entry => {
            const entryDate = new Date(entry.date);
            return entryDate >= cutoffDate;
        }).sort((a, b) => new Date(a.date) - new Date(b.date));
    }

    /** Update quick statistics */
    async updateQuickStats(allData, periodData) {
        // Total entries
        this.updateStatElement('analytics-total-entries', allData.length);
        
        // Weekly improvement
        const improvement = this.calculateWeeklyImprovement(allData);
        this.updateStatElement('analytics-improvement', `${improvement > 0 ? '+' : ''}${improvement}%`);
        
        // Goal achievement rate
        const goalRate = this.calculateGoalAchievementRate(periodData);
        this.updateStatElement('analytics-goal-rate', `${goalRate}%`);
        
        // Current streak
        const streak = this.calculateCurrentStreak(allData);
        this.updateStatElement('analytics-streak', streak);

        console.log('📊 Quick stats updated');
    }

    /** Update trends chart with Chart.js */
    async updateTrendsChart(data = null) {
        const chartCanvas = document.getElementById('trends-chart');
        if (!chartCanvas) {
            console.warn('⚠️ Trends chart canvas not found');
            return;
        }

        if (!data) {
            const allData = await this.healthTracker.getAllHealthData();
            data = this.getDataForPeriod(allData, this.currentPeriod);
        }

        // Destroy existing chart
        if (this.charts.trends) {
            this.charts.trends.destroy();
        }

        // Check if Chart.js is loaded
        if (typeof Chart === 'undefined') {
            chartCanvas.parentElement.innerHTML = `
                <div class="flex items-center justify-center h-64 bg-base-200 rounded-lg">
                    <div class="text-center">
                        <div class="text-4xl mb-2">📊</div>
                        <div class="font-semibold">Chart.js nicht verfügbar</div>
                        <div class="text-sm opacity-70">Bitte Chart.js einbinden</div>
                    </div>
                </div>
            `;
            return;
        }

        // Prepare chart data
        const chartData = this.prepareChartData(data);
        
        if (chartData.labels.length === 0) {
            chartCanvas.parentElement.innerHTML = `
                <div class="flex items-center justify-center h-64 bg-base-200 rounded-lg">
                    <div class="text-center">
                        <div class="text-4xl mb-2">📈</div>
                        <div class="font-semibold">Keine Daten für ${this.currentPeriod} Tage</div>
                        <div class="text-sm opacity-70">Erfasse Gesundheitsdaten um Trends zu sehen</div>
                    </div>
                </div>
            `;
            return;
        }
        
        // Create Chart.js chart
        const ctx = chartCanvas.getContext('2d');
        this.charts.trends = new Chart(ctx, {
            type: 'line',
            data: {
                labels: chartData.labels,
                datasets: this.createDatasets(chartData)
            },
            options: this.getChartOptions()
        });

        console.log(`📈 Trends chart updated for metric: ${this.currentMetric}`);
    }

    /** Prepare chart data from health data */
    prepareChartData(data) {
        if (!data || data.length === 0) {
            return { labels: [], steps: [], water: [], sleep: [], weight: [] };
        }

        const grouped = {};
        
        // Group data by date
        data.forEach(entry => {
            const date = new Date(entry.date).toLocaleDateString('de-DE', { 
                month: 'short', 
                day: 'numeric' 
            });
            
            if (!grouped[date]) {
                grouped[date] = { steps: 0, water: 0, sleep: 0, weight: null };
            }
            
            // Aggregate data for the same date
            grouped[date].steps += entry.steps || 0;
            grouped[date].water += entry.waterIntake || 0;
            grouped[date].sleep += entry.sleepHours || 0;
            if (entry.weight) grouped[date].weight = entry.weight;
        });

        // Convert to arrays
        const labels = Object.keys(grouped);
        const steps = labels.map(date => grouped[date].steps);
        const water = labels.map(date => Math.round(grouped[date].water * 10) / 10);
        const sleep = labels.map(date => Math.round(grouped[date].sleep * 10) / 10);
        const weight = labels.map(date => grouped[date].weight);

        return { labels, steps, water, sleep, weight };
    }

    /** Create chart datasets based on current metric */
    createDatasets(chartData) {
        const datasets = [];
        
        if (this.currentMetric === 'steps' || this.currentMetric === 'all') {
            datasets.push({
                label: 'Schritte',
                data: chartData.steps,
                borderColor: '#3B82F6',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                tension: 0.4,
                fill: this.currentMetric === 'steps',
                pointBackgroundColor: '#3B82F6',
                pointBorderColor: '#FFFFFF',
                pointBorderWidth: 2,
                pointRadius: 4
            });
        }
        
        if (this.currentMetric === 'water' || this.currentMetric === 'all') {
            datasets.push({
                label: 'Wasser (L)',
                data: chartData.water,
                borderColor: '#06B6D4',
                backgroundColor: 'rgba(6, 182, 212, 0.1)',
                tension: 0.4,
                fill: this.currentMetric === 'water',
                yAxisID: this.currentMetric === 'all' ? 'y1' : 'y',
                pointBackgroundColor: '#06B6D4',
                pointBorderColor: '#FFFFFF',
                pointBorderWidth: 2,
                pointRadius: 4
            });
        }
        
        if (this.currentMetric === 'sleep' || this.currentMetric === 'all') {
            datasets.push({
                label: 'Schlaf (h)',
                data: chartData.sleep,
                borderColor: '#8B5CF6',
                backgroundColor: 'rgba(139, 92, 246, 0.1)',
                tension: 0.4,
                fill: this.currentMetric === 'sleep',
                yAxisID: this.currentMetric === 'all' ? 'y1' : 'y',
                pointBackgroundColor: '#8B5CF6',
                pointBorderColor: '#FFFFFF',
                pointBorderWidth: 2,
                pointRadius: 4
            });
        }
        
        if (this.currentMetric === 'weight') {
            datasets.push({
                label: 'Gewicht (kg)',
                data: chartData.weight,
                borderColor: '#EF4444',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                tension: 0.4,
                fill: false,
                pointBackgroundColor: '#EF4444',
                pointBorderColor: '#FFFFFF',
                pointBorderWidth: 2,
                pointRadius: 4
            });
        }
        
        return datasets;
    }

    /** Get chart options configuration */
    getChartOptions() {
        const scales = {
            x: {
                display: true,
                title: { 
                    display: true, 
                    text: 'Datum',
                    color: '#374151',
                    font: { size: 12, weight: 'bold' }
                },
                grid: { color: 'rgba(156, 163, 175, 0.2)' },
                ticks: { color: '#6B7280' }
            },
            y: {
                display: true,
                title: { 
                    display: true, 
                    text: this.getYAxisLabel(),
                    color: '#374151',
                    font: { size: 12, weight: 'bold' }
                },
                grid: { color: 'rgba(156, 163, 175, 0.2)' },
                ticks: { color: '#6B7280' },
                beginAtZero: true
            }
        };

        // Add second y-axis for mixed charts
        if (this.currentMetric === 'all') {
            scales.y1 = {
                type: 'linear',
                display: true,
                position: 'right',
                title: { 
                    display: true, 
                    text: 'Liter / Stunden',
                    color: '#374151',
                    font: { size: 12, weight: 'bold' }
                },
                grid: { drawOnChartArea: false },
                ticks: { color: '#6B7280' },
                beginAtZero: true
            };
        }

        return {
            responsive: true,
            maintainAspectRatio: false,
            interaction: { 
                mode: 'index', 
                intersect: false 
            },
            plugins: {
                legend: { 
                    position: 'top',
                    labels: {
                        usePointStyle: true,
                        pointStyle: 'circle',
                        color: '#374151',
                        font: { size: 12 }
                    }
                },
                title: {
                    display: true,
                    text: `${this.getMetricTitle()} (${this.currentPeriod} Tage)`,
                    color: '#1F2937',
                    font: { size: 16, weight: 'bold' }
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleColor: '#FFFFFF',
                    bodyColor: '#FFFFFF',
                    borderColor: '#3B82F6',
                    borderWidth: 1
                }
            },
            scales,
            elements: {
                line: { tension: 0.4 },
                point: { hoverRadius: 6 }
            }
        };
    }

    /** Get Y-axis label based on current metric */
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

    /** Get metric title for chart */
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

    /** Update activity heatmap */
    async updateHeatmap(data) {
        const heatmapContainer = document.getElementById('heatmap-chart');
        if (!heatmapContainer) return;

        const heatmapData = this.generateHeatmapData(data);
        
        heatmapContainer.innerHTML = `
            <div class="space-y-4">
                <div class="flex items-center justify-between mb-4">
                    <h4 class="font-semibold text-lg">🔥 Aktivitäts-Heatmap</h4>
                    <div class="badge badge-info">Letzte 6 Wochen</div>
                </div>
                
                <!-- Days of week header -->
                <div class="grid grid-cols-7 gap-1 text-xs text-center font-medium opacity-70 mb-2">
                    ${['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].map(day => `
                        <div class="p-1">${day}</div>
                    `).join('')}
                </div>
                
                <!-- Heatmap grid -->
                <div class="grid grid-cols-7 gap-1">
                    ${heatmapData.map(day => `
                        <div class="aspect-square rounded-sm ${this.getHeatmapColor(day.intensity)} 
                             flex items-center justify-center text-xs font-medium relative group cursor-pointer
                             hover:scale-110 transition-transform"
                             title="${day.date}: ${day.value} Schritte">
                            ${day.day}
                        </div>
                    `).join('')}
                </div>
                
                <!-- Legend -->
                <div class="flex items-center justify-between text-xs opacity-70 mt-4">
                    <span>Weniger</span>
                    <div class="flex gap-1">
                        <div class="w-3 h-3 rounded-sm bg-base-300"></div>
                        <div class="w-3 h-3 rounded-sm bg-primary/20"></div>
                        <div class="w-3 h-3 rounded-sm bg-primary/50"></div>
                        <div class="w-3 h-3 rounded-sm bg-primary/80"></div>
                        <div class="w-3 h-3 rounded-sm bg-primary"></div>
                    </div>
                    <span>Mehr</span>
                </div>
            </div>
        `;

        // Remove placeholder
        const placeholder = document.getElementById('heatmap-placeholder');
        if (placeholder) placeholder.style.display = 'none';
    }

    /** Generate heatmap data */
    generateHeatmapData(data) {
        const today = new Date();
        const days = [];
        
        // Generate last 42 days (6 weeks)
        for (let i = 41; i >= 0; i--) {
            const date = new Date(today.getTime() - (i * 24 * 60 * 60 * 1000));
            const dateStr = date.toISOString().split('T')[0];
            
            const dayData = data.find(entry => {
                const entryDate = typeof entry.date === 'string' ? entry.date.split('T')[0] : entry.date;
                return entryDate === dateStr;
            });
            
            const steps = dayData ? dayData.steps || 0 : 0;
            const intensity = this.calculateIntensity(steps);
            
            days.push({
                date: date.toLocaleDateString('de-DE'),
                day: date.getDate(),
                value: steps,
                intensity
            });
        }
        
        return days;
    }

    /** Calculate intensity for heatmap */
    calculateIntensity(steps) {
        if (steps === 0) return 0;
        if (steps < 3000) return 1;
        if (steps < 6000) return 2;
        if (steps < 10000) return 3;
        return 4;
    }

    /** Get heatmap color based on intensity */
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

    /** Update correlation analysis */
    async updateCorrelationAnalysis(data) {
        const container = document.getElementById('correlation-insights');
        if (!container) return;

        const correlations = this.calculateCorrelations(data);
        
        container.innerHTML = `
            <div class="space-y-4">
                ${correlations.length > 0 ? correlations.map(corr => `
                    <div class="bg-base-100 rounded-lg p-4 shadow-sm border border-base-300/50">
                        <div class="flex justify-between items-center mb-2">
                            <span class="font-medium flex items-center gap-2">
                                <span class="text-lg">${corr.icon}</span>
                                ${corr.title}
                            </span>
                            <div class="badge ${corr.strength >= 0.5 ? 'badge-success' : corr.strength >= 0.3 ? 'badge-warning' : 'badge-error'}">
                                ${corr.strength >= 0.5 ? 'Stark' : corr.strength >= 0.3 ? 'Mittel' : 'Schwach'}
                            </div>
                        </div>
                        <div class="w-full bg-base-300 rounded-full h-2 mb-2">
                            <div class="${corr.strength >= 0.5 ? 'bg-success' : corr.strength >= 0.3 ? 'bg-warning' : 'bg-error'} h-2 rounded-full transition-all duration-500" 
                                 style="width: ${Math.round(corr.strength * 100)}%"></div>
                        </div>
                        <p class="text-xs text-base-content/70">${corr.description}</p>
                    </div>
                `).join('') : `
                    <div class="alert alert-info">
                        <span>📊</span>
                        <span>Sammle mehr Daten für Korrelationsanalyse (mindestens 5 Einträge)</span>
                    </div>
                `}
            </div>
        `;
    }

    /** Calculate correlations between metrics */
    calculateCorrelations(data) {
        if (data.length < 5) return [];

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

        // Water vs consistency
        const waterData = data.filter(d => d.waterIntake && d.waterIntake > 0);
        if (waterData.length >= 3) {
            const consistency = waterData.length / data.length;
            correlations.push({
                icon: '💧📊',
                title: 'Wasser ↔ Konsistenz',
                description: 'Regelmäßige Wasserzufuhr und Tracking',
                strength: consistency
            });
        }

        // Sleep vs Weight correlation
        const sleepWeightData = data.filter(d => d.sleepHours && d.weight);
        if (sleepWeightData.length >= 5) {
            const correlation = this.calculatePearsonCorrelation(
                sleepWeightData.map(d => d.sleepHours),
                sleepWeightData.map(d => d.weight)
            );
            
            correlations.push({
                icon: '😴⚖️',
                title: 'Schlaf ↔ Gewicht',
                description: 'Zusammenhang zwischen Schlaf und Gewichtsmanagement',
                strength: Math.abs(correlation)
            });
        }

        return correlations.sort((a, b) => b.strength - a.strength);
    }

    /** Calculate Pearson correlation coefficient */
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

    /** Update weekly summary */
    async updateWeeklySummary(allData) {
        const chartCanvas = document.getElementById('weekly-summary-chart');
        if (!chartCanvas) return;

        const weekData = this.healthTracker.getWeekData(allData);
        
        // Destroy existing chart
        if (this.charts.weekly) {
            this.charts.weekly.destroy();
        }

        // Prepare weekly data
        const weeklyChartData = this.prepareWeeklyChartData(weekData);
        
        if (weeklyChartData.labels.length === 0) {
            chartCanvas.parentElement.innerHTML = `
                <div class="flex items-center justify-center h-64 bg-base-200 rounded-lg">
                    <div class="text-center">
                        <div class="text-4xl mb-2">📅</div>
                        <div class="font-semibold">Keine Wochendaten</div>
                        <div class="text-sm opacity-70">Erfasse mehr Daten für Wochenvergleich</div>
                    </div>
                </div>
            `;
            return;
        }

        // Create weekly chart
        const ctx = chartCanvas.getContext('2d');
        this.charts.weekly = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: weeklyChartData.labels,
                datasets: [{
                    label: 'Schritte',
                    data: weeklyChartData.steps,
                    backgroundColor: 'rgba(59, 130, 246, 0.6)',
                    borderColor: '#3B82F6',
                    borderWidth: 2
                }, {
                    label: 'Wasser (L)',
                    data: weeklyChartData.water,
                    backgroundColor: 'rgba(6, 182, 212, 0.6)',
                    borderColor: '#06B6D4',
                    borderWidth: 2,
                    yAxisID: 'y1'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Wöchentliche Zusammenfassung'
                    }
                },
                scales: {
                    y: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        title: { display: true, text: 'Schritte' }
                    },
                    y1: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        title: { display: true, text: 'Wasser (L)' },
                        grid: { drawOnChartArea: false }
                    }
                }
            }
        });
    }

    /** Prepare weekly chart data */
    prepareWeeklyChartData(weekData) {
        const labels = [];
        const steps = [];
        const water = [];
        
        // Group by day of week
        const dayNames = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
        const grouped = {};
        
        weekData.forEach(entry => {
            const dayOfWeek = new Date(entry.date).getDay();
            const dayName = dayNames[dayOfWeek];
            
            if (!grouped[dayName]) {
                grouped[dayName] = { steps: 0, water: 0, count: 0 };
            }
            
            grouped[dayName].steps += entry.steps || 0;
            grouped[dayName].water += entry.waterIntake || 0;
            grouped[dayName].count++;
        });
        
        Object.entries(grouped).forEach(([day, data]) => {
            labels.push(day);
            steps.push(data.steps);
            water.push(Math.round(data.water * 10) / 10);
        });
        
        return { labels, steps, water };
    }

    /** Update AI insights */
    async updateAIInsights(data) {
        const container = document.getElementById('analytics-insights');
        if (!container) return;

        const insights = this.generateAIInsights(data);
        
        container.innerHTML = `
            <div class="space-y-4">
                ${insights.map(insight => `
                    <div class="alert ${insight.type} shadow-sm">
                        <i data-lucide="${insight.iconName}" class="w-5 h-5"></i>
                        <div>
                            <h4 class="font-semibold">${insight.title}</h4>
                            <p class="text-sm opacity-80">${insight.description}</p>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;

        // Reinitialize lucide icons
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }

    /** Generate AI-powered insights */
    generateAIInsights(data) {
        if (data.length < 3) {
            return [{
                type: 'alert-info',
                iconName: 'info',
                title: 'Mehr Daten für bessere Insights',
                description: 'Sammle täglich Gesundheitsdaten für personalisierte Erkenntnisse.'
            }];
        }

        const insights = [];
        
        // Steps trend analysis
        const stepsData = data.filter(d => d.steps && d.steps > 0).map(d => d.steps);
        if (stepsData.length >= 5) {
            const trend = this.calculateTrend(stepsData);
            if (trend > 0.1) {
                insights.push({
                    type: 'alert-success',
                    iconName: 'trending-up',
                    title: 'Positive Entwicklung',
                    description: `Deine Schrittanzahl ist um ${Math.round(trend * 100)}% gestiegen - weiter so!`
                });
            } else if (trend < -0.1) {
                insights.push({
                    type: 'alert-warning',
                    iconName: 'trending-down',
                    title: 'Aktivität gesunken',
                    description: `Deine Schritte sind um ${Math.round(Math.abs(trend) * 100)}% zurückgegangen. Zeit für mehr Bewegung!`
                });
            }
        }
        
        // Sleep analysis
        const sleepData = data.filter(d => d.sleepHours && d.sleepHours > 0);
        if (sleepData.length >= 3) {
            const avgSleep = sleepData.reduce((sum, d) => sum + d.sleepHours, 0) / sleepData.length;
            if (avgSleep < 6) {
                insights.push({
                    type: 'alert-warning',
                    iconName: 'moon',
                    title: 'Zu wenig Schlaf',
                    description: `${Math.round(avgSleep * 10) / 10}h ist unter dem Minimum. Schlaf ist wichtig für deine Gesundheit!`
                });
            } else if (avgSleep >= 7.5) {
                insights.push({
                    type: 'alert-success',
                    iconName: 'moon',
                    title: 'Hervorragende Schlafgewohnheiten!',
                    description: `${Math.round(avgSleep * 10) / 10}h Schlaf sind optimal für Erholung und Gesundheit.`
                });
            }
        }
        
        // Water analysis
        const waterData = data.filter(d => d.waterIntake && d.waterIntake > 0);
        if (waterData.length >= 3) {
            const avgWater = waterData.reduce((sum, d) => sum + d.waterIntake, 0) / waterData.length;
            const goalRate = (avgWater / this.healthTracker.goals.waterGoal) * 100;
            
            if (goalRate >= 85) {
                insights.push({
                    type: 'alert-success',
                    iconName: 'droplets',
                    title: 'Perfekte Hydration!',
                    description: `Du erreichst ${Math.round(goalRate)}% deines Wasserziels - großartig!`
                });
            } else if (goalRate < 60) {
                insights.push({
                    type: 'alert-info',
                    iconName: 'droplets',
                    title: 'Mehr Wasser trinken',
                    description: `Nur ${Math.round(goalRate)}% des Ziels erreicht. Dein Körper braucht mehr Flüssigkeit.`
                });
            }
        }
        
        // Data consistency
        const consistencyRate = data.length / this.currentPeriod;
        if (consistencyRate >= 0.8) {
            insights.push({
                type: 'alert-success',
                iconName: 'check-circle',
                title: 'Konsistente Datenerfassung!',
                description: `${Math.round(consistencyRate * 100)}% deiner Tage getrackt - das ist vorbildlich!`
            });
        }
        
        return insights.slice(0, 4); // Maximal 4 Insights
    }

    /** Calculate trend from array of numbers */
    calculateTrend(data) {
        if (data.length < 2) return 0;
        const first = data[0];
        const last = data[data.length - 1];
        return first > 0 ? (last - first) / first : 0;
    }

    /** Calculate weekly improvement */
    calculateWeeklyImprovement(allData) {
        const thisWeek = this.healthTracker.getWeekData(allData);
        const lastWeekStart = new Date();
        lastWeekStart.setDate(lastWeekStart.getDate() - 14);
        const lastWeekEnd = new Date();
        lastWeekEnd.setDate(lastWeekEnd.getDate() - 7);
        
        const lastWeek = allData.filter(entry => {
            const date = new Date(entry.date);
            return date >= lastWeekStart && date < lastWeekEnd;
        });
        
        if (thisWeek.length === 0 || lastWeek.length === 0) return 0;
        
        const thisWeekSteps = thisWeek.reduce((sum, d) => sum + (d.steps || 0), 0);
        const lastWeekSteps = lastWeek.reduce((sum, d) => sum + (d.steps || 0), 0);
        
        return lastWeekSteps > 0 ? Math.round(((thisWeekSteps - lastWeekSteps) / lastWeekSteps) * 100) : 0;
    }

    /** Calculate goal achievement rate */
    calculateGoalAchievementRate(data) {
        if (data.length === 0) return 0;
        
        let achievedGoals = 0;
        let totalGoals = 0;
        
        data.forEach(entry => {
            if (entry.steps !== undefined) {
                totalGoals++;
                if (entry.steps >= this.healthTracker.goals.stepsGoal) achievedGoals++;
            }
            if (entry.waterIntake !== undefined) {
                totalGoals++;
                if (entry.waterIntake >= this.healthTracker.goals.waterGoal) achievedGoals++;
            }
            if (entry.sleepHours !== undefined) {
                totalGoals++;
                if (entry.sleepHours >= this.healthTracker.goals.sleepGoal) achievedGoals++;
            }
        });
        
        return totalGoals > 0 ? Math.round((achievedGoals / totalGoals) * 100) : 0;
    }

    /** Calculate current streak */
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

    /** Update stat element with animation */
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

    /** Show loading states */
    showLoadingStates() {
        const loadingElements = [
            'trends-loading', 'correlation-loading', 
            'weekly-loading', 'ai-insights-loading'
        ];
        
        loadingElements.forEach(id => {
            const element = document.getElementById(id);
            if (element) element.classList.remove('hidden');
        });
    }

    /** Hide loading states */
    hideLoadingStates() {
        const loadingElements = [
            'trends-loading', 'correlation-loading', 
            'weekly-loading', 'ai-insights-loading'
        ];
        
        loadingElements.forEach(id => {
            const element = document.getElementById(id);
            if (element) element.classList.add('hidden');
        });
    }

    /** Show error state */
    showErrorState() {
        const container = document.getElementById('analytics-total-entries')?.closest('.stats');
        if (container) {
            const errorDiv = document.createElement('div');
            errorDiv.className = 'alert alert-error mb-4';
            errorDiv.innerHTML = `
                <span>⚠️</span>
                <span>Fehler beim Laden der Analytics. Bitte später erneut versuchen.</span>
                <button class="btn btn-sm" onclick="this.parentElement.remove()">OK</button>
            `;
            container.parentElement.insertBefore(errorDiv, container);
        }
    }

    /** Public method to force refresh analytics */
    async updateAllAnalytics() {
        await this.loadAndDisplayAnalytics();
    }
}
