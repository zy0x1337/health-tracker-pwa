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
 * Show specific view in progress hub with proper content switching
 */
showView(viewName) {
    console.log('🔄 ProgressHub showView called:', viewName);
    
    this.currentView = viewName;
    
    // Update tab states (DaisyUI tabs)
    const tabs = document.querySelectorAll('[id^="tab-"]');
    tabs.forEach(tab => {
        tab.classList.remove('tab-active');
    });
    
    const activeTab = document.getElementById(`tab-${viewName}`);
    if (activeTab) {
        activeTab.classList.add('tab-active');
    }

    // Hide all views first
    const allViews = ['overview-view', 'weekly-view', 'goals-view', 'achievements-view'];
    allViews.forEach(viewId => {
        const viewElement = document.getElementById(viewId);
        if (viewElement) {
            viewElement.classList.add('hidden');
        }
    });

    // Show the selected view and populate with appropriate content
    switch (viewName) {
        case 'overview':
            this.showOverviewView();
            break;
        case 'weekly':
            this.showWeeklyView();
            break;
        case 'goals':
            this.showGoalsView();
            break;
        case 'achievements':
            this.showAchievementsView();
            break;
        default:
            this.showOverviewView();
    }
}

/** Show overview view (existing today view functionality) */
showOverviewView() {
    const overviewView = document.getElementById('overview-view');
    if (overviewView) {
        overviewView.classList.remove('hidden');
        // The existing showTodayView functionality is already implemented
        this.showTodayView();
    }
}

/** Show today's overview with comprehensive inline optimizations */
async showTodayView() {
    console.log('📊 Showing optimized today view...');
    
    try {
        // Enhanced loading state with animation
        const progressLoading = document.getElementById('progress-loading');
        const progressContent = document.getElementById('progress-content');
        
        if (progressLoading && progressContent) {
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
        
        // Get comprehensive health data
        const allData = await this.healthTracker.getAllHealthData();
        const todayData = this.healthTracker.getTodayData(allData);
        const weekData = this.healthTracker.getWeekData(allData);
        
        console.log('📊 Today data:', todayData);
        console.log('📊 Week data length:', weekData.length);
        
        // Update today's date with enhanced formatting
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
        
        // Enhanced stats with smooth counter animations
        const stats = [
            {
                id: 'today-steps-display',
                progressId: 'today-steps-progress',
                value: todayData.steps || 0,
                goal: this.healthTracker.goals.stepsGoal,
                format: (val) => val.toLocaleString(),
                color: 'primary',
                icon: 'footprints'
            },
            {
                id: 'today-water-display',
                progressId: 'today-water-progress',
                value: todayData.waterIntake || 0,
                goal: this.healthTracker.goals.waterGoal,
                format: (val) => `${val}L`,
                color: 'info',
                icon: 'droplets'
            },
            {
                id: 'today-sleep-display',
                progressId: 'today-sleep-progress',
                value: todayData.sleepHours || 0,
                goal: this.healthTracker.goals.sleepGoal,
                format: (val) => `${val}h`,
                color: 'accent',
                icon: 'moon'
            },
            {
                id: 'today-weight-display',
                progressId: null,
                value: todayData.weight || 0,
                goal: null,
                format: (val) => val ? `${val}kg` : '—',
                color: 'secondary',
                icon: 'scale'
            }
        ];
        
        // Animate stats with staggered timing and enhanced effects
        for (let i = 0; i < stats.length; i++) {
            setTimeout(() => {
                const stat = stats[i];
                const element = document.getElementById(stat.id);
                const progressElement = stat.progressId ? document.getElementById(stat.progressId) : null;
                
                if (element) {
                    // Add loading animation
                    element.style.transform = 'scale(1.1)';
                    element.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
                    element.classList.add('animate-pulse');
                    
                    setTimeout(() => {
                        // Counter animation
                        const startValue = 0;
                        const targetValue = stat.value;
                        const duration = 800;
                        const startTime = performance.now();
                        
                        const animateCounter = (currentTime) => {
                            const elapsed = currentTime - startTime;
                            const progress = Math.min(elapsed / duration, 1);
                            const easeOut = 1 - Math.pow(1 - progress, 3);
                            const currentValue = startValue + (targetValue - startValue) * easeOut;
                            
                            element.textContent = stat.format(Math.round(currentValue * 10) / 10);
                            
                            if (progress < 1) {
                                requestAnimationFrame(animateCounter);
                            }
                        };
                        
                        requestAnimationFrame(animateCounter);
                        
                        // Remove loading state
                        element.classList.remove('animate-pulse');
                        element.style.transform = 'scale(1)';
                        
                        // Update progress bar with animation
                        if (progressElement && stat.goal) {
                            const progress = Math.min((stat.value / stat.goal) * 100, 100);
                            progressElement.style.width = '0%';
                            progressElement.style.transition = 'width 1s cubic-bezier(0.4, 0, 0.2, 1)';
                            
                            setTimeout(() => {
                                progressElement.style.width = `${progress}%`;
                                
                                // Achievement glow effect
                                if (progress >= 100) {
                                    setTimeout(() => {
                                        progressElement.style.animation = 'pulse 0.5s ease-in-out';
                                        element.parentElement.classList.add('ring-2', 'ring-success', 'ring-opacity-50');
                                        setTimeout(() => {
                                            progressElement.style.animation = '';
                                            element.parentElement.classList.remove('ring-2', 'ring-success', 'ring-opacity-50');
                                        }, 2000);
                                    }, 1000);
                                }
                            }, 100);
                        }
                    }, 300);
                }
            }, i * 150);
        }
        
        // Enhanced weekly trends with comparison analytics
        const weeklyAvg = this.healthTracker.calculateWeeklyAverages(weekData);
        
        // Calculate previous week data for comparison
        const lastWeekStart = new Date();
        lastWeekStart.setDate(lastWeekStart.getDate() - 14);
        const lastWeekEnd = new Date();
        lastWeekEnd.setDate(lastWeekEnd.getDate() - 7);
        
        const previousWeekData = allData.filter(entry => {
            const date = new Date(entry.date);
            return date >= lastWeekStart && date < lastWeekEnd;
        });
        const previousAvg = this.healthTracker.calculateWeeklyAverages(previousWeekData);
        
        const trends = [
            {
                id: 'week-avg-steps',
                trendId: 'week-steps-trend',
                current: weeklyAvg.steps,
                previous: previousAvg.steps,
                format: (val) => val.toLocaleString(),
                icon: 'footprints'
            },
            {
                id: 'week-avg-water',
                trendId: 'week-water-trend',
                current: weeklyAvg.water,
                previous: previousAvg.water,
                format: (val) => `${val}L`,
                icon: 'droplets'
            },
            {
                id: 'week-avg-sleep',
                trendId: 'week-sleep-trend',
                current: weeklyAvg.sleep,
                previous: previousAvg.sleep,
                format: (val) => `${val}h`,
                icon: 'moon'
            }
        ];
        
        // Animate trends with enhanced comparisons
        trends.forEach((trend, index) => {
            setTimeout(() => {
                const element = document.getElementById(trend.id);
                const trendElement = document.getElementById(trend.trendId);
                
                if (element) {
                    element.style.transform = 'scale(1.05)';
                    element.style.transition = 'all 0.3s ease';
                    
                    setTimeout(() => {
                        // Counter animation for trends
                        const startValue = 0;
                        const duration = 600;
                        const startTime = performance.now();
                        
                        const animateTrend = (currentTime) => {
                            const elapsed = currentTime - startTime;
                            const progress = Math.min(elapsed / duration, 1);
                            const currentValue = startValue + (trend.current - startValue) * progress;
                            
                            element.textContent = trend.format(Math.round(currentValue * 10) / 10);
                            
                            if (progress < 1) {
                                requestAnimationFrame(animateTrend);
                            }
                        };
                        
                        requestAnimationFrame(animateTrend);
                        element.style.transform = 'scale(1)';
                    }, 100);
                }
                
                // Enhanced trend comparison
                if (trendElement && trend.previous > 0) {
                    const change = ((trend.current - trend.previous) / trend.previous) * 100;
                    const changeText = change > 0 ? `+${Math.round(change)}%` : `${Math.round(change)}%`;
                    const trendIcon = change > 0 ? '📈' : change < 0 ? '📉' : '➡️';
                    const trendColor = change > 0 ? 'text-success' : change < 0 ? 'text-error' : 'text-base-content';
                    
                    trendElement.innerHTML = `
                        <span class="${trendColor} font-medium">${trendIcon} ${changeText}</span>
                    `;
                    
                    trendElement.style.opacity = '0';
                    trendElement.style.transform = 'translateY(10px)';
                    trendElement.style.transition = 'all 0.3s ease';
                    
                    setTimeout(() => {
                        trendElement.style.opacity = '1';
                        trendElement.style.transform = 'translateY(0)';
                    }, 200);
                }
            }, index * 200);
        });
        
        // Enhanced quick stats with streak calculation and achievements
        let currentStreak = 0;
        const today = new Date();
        
        // Calculate current streak
        for (let i = 0; i < 365; i++) {
            const checkDate = new Date(today.getTime() - (i * 24 * 60 * 60 * 1000));
            const dateStr = checkDate.toISOString().split('T')[0];
            
            const hasEntry = allData.some(entry => {
                const entryDate = typeof entry.date === 'string' ? entry.date.split('T')[0] : entry.date;
                return entryDate === dateStr;
            });
            
            if (hasEntry) {
                currentStreak++;
            } else {
                break;
            }
        }
        
        // Calculate weekly goals achieved
        let weeklyGoalsAchieved = 0;
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
                weeklyGoalsAchieved++;
            }
        });
        
        const quickStats = [
            { 
                id: 'current-streak', 
                value: currentStreak, 
                format: (val) => val.toString(),
                isSpecial: currentStreak >= 7
            },
            { 
                id: 'weekly-goals-achieved', 
                value: weeklyGoalsAchieved, 
                format: (val) => val.toString(),
                isSpecial: weeklyGoalsAchieved >= 5
            },
            { 
                id: 'total-entries', 
                value: allData.length, 
                format: (val) => val.toLocaleString(),
                isSpecial: allData.length >= 50
            }
        ];
        
        // Animate quick stats with special effects
        quickStats.forEach((stat, index) => {
            setTimeout(() => {
                const element = document.getElementById(stat.id);
                if (element) {
                    // Special sparkle effect for impressive values
                    if (stat.isSpecial) {
                        element.parentElement.classList.add('animate-pulse');
                        setTimeout(() => {
                            element.parentElement.classList.remove('animate-pulse');
                        }, 1000);
                    }
                    
                    // Counter animation
                    const startValue = 0;
                    const duration = 700;
                    const startTime = performance.now();
                    
                    const animateQuickStat = (currentTime) => {
                        const elapsed = currentTime - startTime;
                        const progress = Math.min(elapsed / duration, 1);
                        const currentValue = startValue + (stat.value - startValue) * progress;
                        
                        element.textContent = stat.format(Math.round(currentValue));
                        
                        if (progress < 1) {
                            requestAnimationFrame(animateQuickStat);
                        }
                    };
                    
                    requestAnimationFrame(animateQuickStat);
                }
            }, index * 100);
        });
        
        // Enhanced completion rate with visual feedback
        const completionRateEl = document.getElementById('today-completion-rate');
        if (completionRateEl) {
            let completed = 0;
            let total = 0;
            
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
            
            const animateRate = (currentTime) => {
                const elapsed = currentTime - startTime;
                const progress = Math.min(elapsed / duration, 1);
                const currentRate = Math.round(startRate + (rate - startRate) * progress);
                
                completionRateEl.textContent = `${currentRate}%`;
                
                // Dynamic badge color
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
                    requestAnimationFrame(animateRate);
                } else if (rate === 100) {
                    // Celebration effect
                    badge.classList.add('animate-bounce');
                    setTimeout(() => {
                        badge.classList.remove('animate-bounce');
                    }, 1000);
                }
            };
            
            requestAnimationFrame(animateRate);
        }
        
        // Enhanced notes display with fade animation
        const notesSection = document.getElementById('today-notes-section');
        const notesContent = document.getElementById('today-notes-content');
        
        if (todayData.notes && todayData.notes.trim()) {
            if (notesSection && notesContent) {
                notesContent.textContent = todayData.notes;
                notesSection.classList.remove('hidden');
                
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
        
        // Weight trend calculation and display
        const weightTrendEl = document.getElementById('weight-trend');
        if (weightTrendEl && todayData.weight) {
            const recentWeightData = allData
                .filter(entry => entry.weight && entry.weight > 0)
                .slice(-7)
                .map(entry => entry.weight);
            
            if (recentWeightData.length >= 2) {
                const oldestWeight = recentWeightData[0];
                const latestWeight = recentWeightData[recentWeightData.length - 1];
                const weightChange = latestWeight - oldestWeight;
                
                if (Math.abs(weightChange) < 0.1) {
                    weightTrendEl.textContent = '→';
                    weightTrendEl.className = 'text-base-content';
                } else if (weightChange > 0) {
                    weightTrendEl.textContent = '↗️';
                    weightTrendEl.className = 'text-warning';
                } else {
                    weightTrendEl.textContent = '↘️';
                    weightTrendEl.className = 'text-success';
                }
            }
        }
        
        // Enhanced interactive elements
        document.querySelectorAll('.stat').forEach(statCard => {
            if (!statCard.dataset.interactiveAdded) {
                statCard.style.cursor = 'pointer';
                statCard.dataset.interactiveAdded = 'true';
                
                statCard.addEventListener('mouseenter', () => {
                    statCard.style.transform = 'translateY(-2px)';
                    statCard.style.transition = 'all 0.2s ease';
                    statCard.style.boxShadow = '0 8px 25px rgba(0,0,0,0.1)';
                });
                
                statCard.addEventListener('mouseleave', () => {
                    statCard.style.transform = 'translateY(0)';
                    statCard.style.boxShadow = '';
                });
                
                statCard.addEventListener('click', () => {
                    statCard.style.transform = 'scale(0.98)';
                    setTimeout(() => {
                        statCard.style.transform = 'translateY(-2px)';
                    }, 100);
                });
            }
        });
        
        // Enhanced progress bar tooltips
        document.querySelectorAll('.progress').forEach(progressBar => {
            const parentStat = progressBar.closest('.stat');
            if (parentStat && !progressBar.dataset.tooltipAdded) {
                const statTitle = parentStat.querySelector('.stat-title')?.textContent;
                const statValue = parentStat.querySelector('.stat-value')?.textContent;
                
                progressBar.setAttribute('title', `${statTitle}: ${statValue}`);
                progressBar.style.cursor = 'help';
                progressBar.dataset.tooltipAdded = 'true';
            }
        });
        
        // Hide loading state with smooth transition
        setTimeout(() => {
            if (progressLoading) {
                progressLoading.classList.add('hidden');
            }
            
            if (progressContent) {
                progressContent.style.opacity = '1';
                progressContent.style.transform = 'scale(1)';
            }
        }, 1500);
        
        console.log('✅ Today view optimized and displayed successfully');
        
    } catch (error) {
        console.error('❌ Error showing optimized today view:', error);
        
        // Enhanced error state
        const progressContent = document.getElementById('progress-content');
        if (progressContent) {
            progressContent.innerHTML = `
                <div class="alert alert-error shadow-lg">
                    <div class="flex items-start gap-3">
                        <i data-lucide="alert-circle" class="w-6 h-6 flex-shrink-0"></i>
                        <div class="flex-1">
                            <h3 class="font-bold">Fehler beim Laden der Daten</h3>
                            <div class="text-sm mt-1 opacity-80">
                                Bitte versuche es später erneut oder aktualisiere die Seite.
                                <br><small class="opacity-60">Fehler: ${error.message}</small>
                            </div>
                        </div>
                        <button class="btn btn-sm btn-ghost" onclick="this.closest('.alert').remove(); healthTracker.progressHub.showView('overview')">
                            <i data-lucide="refresh-cw" class="w-4 h-4"></i>
                            Erneut versuchen
                        </button>
                    </div>
                </div>
            `;
            
            // Reinitialize lucide icons for error state
            if (typeof lucide !== 'undefined') {
                lucide.createIcons();
            }
        }
    }
}

/** Show weekly view with weekly data */
showWeeklyView() {
    const weeklyView = document.getElementById('weekly-view');
    if (weeklyView) {
        weeklyView.classList.remove('hidden');
        this.populateWeeklyView();
    }
}

/** Show goals view with goal progress */
showGoalsView() {
    const goalsView = document.getElementById('goals-view');
    if (goalsView) {
        goalsView.classList.remove('hidden');
        this.populateGoalsView();
    }
}

/** Show achievements view with milestones */
showAchievementsView() {
    const achievementsView = document.getElementById('achievements-view');
    if (achievementsView) {
        achievementsView.classList.remove('hidden');
        this.populateAchievementsView();
    }
}

/** Populate weekly view with actual weekly data */
populateWeeklyView() {
    const container = document.getElementById('weekly-chart-container');
    if (!container) return;

    if (this.weekData.length === 0) {
        container.innerHTML = `
            <div class="text-center py-12">
                <i data-lucide="calendar-x" class="w-16 h-16 mx-auto text-base-content/30 mb-4"></i>
                <h3 class="text-xl font-semibold text-base-content mb-2">Keine Wochendaten</h3>
                <p class="text-base-content/70">Füge mehr Daten hinzu, um deine Wochenentwicklung zu sehen!</p>
            </div>
        `;
        return;
    }

    const weekStats = this.calculateWeekStats();
    
    container.innerHTML = `
        <div class="space-y-6">
            <!-- Weekly Stats Overview -->
            <div class="stats stats-vertical lg:stats-horizontal shadow bg-base-200 w-full">
                <div class="stat">
                    <div class="stat-figure text-primary">
                        <i data-lucide="footprints" class="w-8 h-8"></i>
                    </div>
                    <div class="stat-title">Ø Schritte/Tag</div>
                    <div class="stat-value text-primary">${weekStats.avgSteps.toLocaleString()}</div>
                    <div class="stat-desc">Diese Woche</div>
                </div>
                
                <div class="stat">
                    <div class="stat-figure text-info">
                        <i data-lucide="droplets" class="w-8 h-8"></i>
                    </div>
                    <div class="stat-title">Ø Wasser/Tag</div>
                    <div class="stat-value text-info">${weekStats.avgWater}L</div>
                    <div class="stat-desc">Diese Woche</div>
                </div>
                
                <div class="stat">
                    <div class="stat-figure text-accent">
                        <i data-lucide="moon" class="w-8 h-8"></i>
                    </div>
                    <div class="stat-title">Ø Schlaf/Nacht</div>
                    <div class="stat-value text-accent">${weekStats.avgSleep}h</div>
                    <div class="stat-desc">Diese Woche</div>
                </div>
            </div>

            <!-- Daily Breakdown -->
            <div class="card bg-base-100 shadow-sm">
                <div class="card-body">
                    <h4 class="card-title mb-4">Tägliche Aufschlüsselung</h4>
                    <div class="space-y-3">
                        ${this.weekData.slice(0, 7).map((entry, index) => {
                            const entryDate = new Date(entry.date);
                            const isToday = entryDate.toDateString() === new Date().toDateString();
                            const dayName = entryDate.toLocaleDateString('de-DE', { weekday: 'long', day: '2-digit', month: '2-digit' });
                            
                            return `
                                <div class="alert ${isToday ? 'alert-info' : 'alert-ghost'} flex justify-between">
                                    <div class="flex items-center gap-3">
                                        <div class="font-medium">${dayName}</div>
                                        ${isToday ? '<div class="badge badge-primary">Heute</div>' : ''}
                                    </div>
                                    <div class="flex gap-2 text-sm">
                                        ${entry.steps ? `<div class="badge badge-success">${entry.steps.toLocaleString()} Schritte</div>` : ''}
                                        ${entry.waterIntake ? `<div class="badge badge-info">${entry.waterIntake}L</div>` : ''}
                                        ${entry.sleepHours ? `<div class="badge badge-warning">${entry.sleepHours}h</div>` : ''}
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Reinitialize lucide icons
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}

/** Populate goals view with goal progress */
populateGoalsView() {
    const container = document.getElementById('goals-progress-container');
    if (!container) return;

    const goalProgress = this.calculateGoalProgress();
    
    container.innerHTML = `
        <div class="space-y-6">
            <!-- Overall Progress -->
            <div class="card bg-gradient-to-br from-primary/10 to-secondary/10 shadow-sm">
                <div class="card-body text-center">
                    <div class="radial-progress text-primary mb-4" style="--value:${goalProgress.overallProgress}; --size:120px;">
                        <div class="text-center">
                            <div class="text-2xl font-bold">${Math.round(goalProgress.overallProgress)}%</div>
                            <div class="text-xs opacity-70">Gesamt</div>
                        </div>
                    </div>
                    <h3 class="text-lg font-bold mb-2">Zielfortschritt Heute</h3>
                    <p class="text-base-content/70">${goalProgress.completedGoals} von ${goalProgress.totalGoals} Zielen erreicht</p>
                </div>
            </div>

            <!-- Individual Goal Progress -->
            <div class="grid md:grid-cols-2 gap-4">
                ${Object.entries(goalProgress.details).map(([metric, progress]) => {
                    const icons = {
                        steps: 'footprints',
                        water: 'droplets',
                        sleep: 'moon',
                        weight: 'scale'
                    };
                    const colors = {
                        steps: 'primary',
                        water: 'info',
                        sleep: 'warning',
                        weight: 'secondary'
                    };
                    const labels = {
                        steps: 'Schritte',
                        water: 'Wasser',
                        sleep: 'Schlaf',
                        weight: 'Gewicht'
                    };
                    
                    return `
                        <div class="card bg-base-100 shadow-sm">
                            <div class="card-body">
                                <div class="flex items-center gap-3 mb-3">
                                    <i data-lucide="${icons[metric]}" class="w-6 h-6 text-${colors[metric]}"></i>
                                    <h4 class="font-bold">${labels[metric]}</h4>
                                </div>
                                <div class="flex items-center justify-between mb-2">
                                    <span class="text-sm opacity-70">Fortschritt</span>
                                    <span class="font-bold">${Math.round(progress)}%</span>
                                </div>
                                <progress class="progress progress-${colors[metric]} w-full" value="${progress}" max="100"></progress>
                                ${progress >= 100 ? '<div class="badge badge-success mt-2">🎯 Ziel erreicht!</div>' : ''}
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        </div>
    `;
    
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}

/** Populate achievements view with milestones */
populateAchievementsView() {
    const container = document.getElementById('achievements-container');
    if (!container) return;

    const achievements = this.generateAchievements();
    
    container.innerHTML = `
        <div class="space-y-6">
            <!-- Achievement Stats -->
            <div class="stats stats-vertical lg:stats-horizontal shadow bg-base-200 w-full">
                <div class="stat">
                    <div class="stat-figure text-success">
                        <i data-lucide="trophy" class="w-8 h-8"></i>
                    </div>
                    <div class="stat-title">Errungenschaften</div>
                    <div class="stat-value text-success">${achievements.unlocked.length}</div>
                    <div class="stat-desc">Freigeschaltet</div>
                </div>
                
                <div class="stat">
                    <div class="stat-figure text-primary">
                        <i data-lucide="flame" class="w-8 h-8"></i>
                    </div>
                    <div class="stat-title">Längste Serie</div>
                    <div class="stat-value text-primary">${achievements.longestStreak}</div>
                    <div class="stat-desc">Tage am Stück</div>
                </div>
                
                <div class="stat">
                    <div class="stat-figure text-accent">
                        <i data-lucide="star" class="w-8 h-8"></i>
                    </div>
                    <div class="stat-title">Erfahrungspunkte</div>
                    <div class="stat-value text-accent">${achievements.totalXP}</div>
                    <div class="stat-desc">Gesammelt</div>
                </div>
            </div>

            <!-- Unlocked Achievements -->
            <div class="space-y-4">
                <h4 class="text-lg font-bold flex items-center gap-2">
                    <i data-lucide="award" class="w-5 h-5 text-success"></i>
                    Freigeschaltete Errungenschaften
                </h4>
                
                <div class="grid md:grid-cols-2 gap-4">
                    ${achievements.unlocked.map(achievement => `
                        <div class="card bg-gradient-to-br from-success/10 to-primary/10 border border-success/20 shadow-sm">
                            <div class="card-body p-4">
                                <div class="flex items-start gap-3">
                                    <div class="text-3xl">${achievement.icon}</div>
                                    <div class="flex-1">
                                        <h5 class="font-bold text-success">${achievement.title}</h5>
                                        <p class="text-sm text-base-content/70 mb-2">${achievement.description}</p>
                                        <div class="flex items-center gap-2">
                                            <div class="badge badge-success badge-sm">${achievement.xp} XP</div>
                                            <div class="badge badge-ghost badge-sm">${achievement.unlockedDate}</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>

            <!-- Locked Achievements -->
            ${achievements.locked.length > 0 ? `
                <div class="space-y-4">
                    <h4 class="text-lg font-bold flex items-center gap-2">
                        <i data-lucide="lock" class="w-5 h-5 text-base-content/50"></i>
                        Noch zu erreichen
                    </h4>
                    
                    <div class="grid md:grid-cols-2 gap-4">
                        ${achievements.locked.slice(0, 4).map(achievement => `
                            <div class="card bg-base-200 border border-base-300 shadow-sm opacity-60">
                                <div class="card-body p-4">
                                    <div class="flex items-start gap-3">
                                        <div class="text-3xl grayscale">${achievement.icon}</div>
                                        <div class="flex-1">
                                            <h5 class="font-bold">${achievement.title}</h5>
                                            <p class="text-sm text-base-content/70 mb-2">${achievement.description}</p>
                                            <div class="flex items-center gap-2">
                                                <div class="badge badge-ghost badge-sm">${achievement.xp} XP</div>
                                                <div class="badge badge-outline badge-sm">🔒 Gesperrt</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            ` : ''}
        </div>
    `;
    
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
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
    async handleMetricChange(metric) {
        this.currentMetric = metric;
        console.log(`📈 Changing metric to ${metric}`);
        
        // Update tab states
        document.querySelectorAll('[data-metric]').forEach(btn => {
            btn.classList.remove('tab-active');
        });
        
        const activeTab = document.querySelector(`[data-metric="${metric}"]`);
        if (activeTab) {
            activeTab.classList.add('tab-active');
        }
        
        await this.updateTrendsChart();
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

    /** Update trends chart */
async updateTrendsChart() {
    console.log('📈 Updating trends chart...');
    
    // Flexible Canvas-Suche - verschiedene mögliche IDs
    let canvas = document.getElementById('trends-chart') ||
                document.getElementById('trends-chart-canvas') ||
                document.querySelector('#trends-chart-container canvas') ||
                document.querySelector('[id*="trends"] canvas') ||
                document.querySelector('[id*="chart"] canvas');
    
    // Falls kein Canvas gefunden, versuche Container zu finden und Canvas zu erstellen
    if (!canvas) {
        const container = document.getElementById('trends-chart-container') ||
                         document.getElementById('analytics-chart-container') ||
                         document.querySelector('[id*="trends"]') ||
                         document.querySelector('[id*="chart"]');
        
        if (container) {
            // Canvas erstellen
            canvas = document.createElement('canvas');
            canvas.id = 'trends-chart';
            canvas.style.maxHeight = '400px';
            container.innerHTML = '';
            container.appendChild(canvas);
            console.log('📈 Canvas created in container:', container.id);
        } else {
            console.warn('⚠️ No chart container found - creating fallback visualization');
            this.createFallbackTrendsVisualization();
            return;
        }
    }

    try {
        // Destroy existing chart
        if (this.charts.trends) {
            this.charts.trends.destroy();
            this.charts.trends = null;
        }

        // Check if Chart.js is available
        if (typeof Chart === 'undefined') {
            this.showChartError(canvas, 'Chart.js nicht geladen');
            return;
        }

        // Get data
        const data = this.analyticsData?.period || [];
        if (data.length === 0) {
            this.showChartError(canvas, 'Keine Daten verfügbar');
            return;
        }

        // Prepare chart data
        const chartData = this.prepareChartData(data);
        if (chartData.labels.length === 0) {
            this.showChartError(canvas, 'Keine Daten für diesen Zeitraum');
            return;
        }

        // Create chart
        const ctx = canvas.getContext('2d');
        this.charts.trends = new Chart(ctx, {
            type: 'line',
            data: {
                labels: chartData.labels,
                datasets: this.createChartDatasets(chartData)
            },
            options: this.getChartOptions()
        });

        console.log('✅ Trends chart updated successfully');

    } catch (error) {
        console.error('❌ Trends chart error:', error);
        this.showChartError(canvas, 'Chart-Fehler: ' + error.message);
    }
}

/** Create fallback trends visualization without Chart.js */
createFallbackTrendsVisualization() {
    // Suche nach einem Analytics-Container für Fallback
    const fallbackContainer = document.getElementById('analytics-insights') ||
                             document.getElementById('analytics-container') ||
                             document.querySelector('[id*="analytics"]') ||
                             document.querySelector('.analytics-content');
    
    if (!fallbackContainer) {
        console.warn('⚠️ No fallback container found for trends visualization');
        return;
    }

    const data = this.analyticsData?.period || [];
    if (data.length === 0) {
        fallbackContainer.innerHTML = `
            <div class="card bg-base-100 shadow-sm">
                <div class="card-body text-center">
                    <h4 class="card-title">📈 Trends-Analyse</h4>
                    <div class="text-center py-8">
                        <div class="text-4xl mb-2">📊</div>
                        <p class="font-semibold">Keine Daten verfügbar</p>
                        <p class="text-sm opacity-70">Erfasse Gesundheitsdaten um Trends zu sehen</p>
                    </div>
                </div>
            </div>
        `;
        return;
    }

    // Erstelle eine einfache Trends-Visualisierung mit HTML/CSS
    const trendData = this.calculateSimpleTrends(data);
    
    fallbackContainer.innerHTML = `
        <div class="card bg-base-100 shadow-sm">
            <div class="card-body">
                <h4 class="card-title mb-4">📈 Trends (${this.currentPeriod} Tage)</h4>
                
                <div class="space-y-4">
                    ${trendData.map(trend => `
                        <div class="flex items-center justify-between p-3 bg-base-200 rounded-lg">
                            <div class="flex items-center gap-3">
                                <span class="text-2xl">${trend.icon}</span>
                                <div>
                                    <div class="font-medium">${trend.label}</div>
                                    <div class="text-sm opacity-70">Durchschnitt: ${trend.average}</div>
                                </div>
                            </div>
                            <div class="text-right">
                                <div class="flex items-center gap-2">
                                    <span class="text-2xl">${trend.trendIcon}</span>
                                    <span class="font-bold ${trend.trendColor}">${trend.trendText}</span>
                                </div>
                                <div class="text-xs opacity-60">${trend.trendDescription}</div>
                            </div>
                        </div>
                    `).join('')}
                </div>
                
                <!-- Einfache Bar-Darstellung -->
                <div class="mt-6">
                    <h5 class="font-semibold mb-3">Letzte ${Math.min(data.length, 7)} Einträge</h5>
                    <div class="space-y-2">
                        ${data.slice(-7).map((entry, index) => {
                            const date = new Date(entry.date).toLocaleDateString('de-DE', { 
                                month: 'short', 
                                day: 'numeric' 
                            });
                            const stepsProgress = entry.steps ? Math.min((entry.steps / 10000) * 100, 100) : 0;
                            const waterProgress = entry.waterIntake ? Math.min((entry.waterIntake / 2) * 100, 100) : 0;
                            
                            return `
                                <div class="flex items-center gap-3">
                                    <div class="w-16 text-xs font-medium">${date}</div>
                                    <div class="flex-1 space-y-1">
                                        <div class="flex items-center gap-2">
                                            <span class="w-4 text-xs">🚶</span>
                                            <div class="flex-1 bg-base-300 rounded-full h-2">
                                                <div class="bg-primary h-2 rounded-full transition-all duration-300" 
                                                     style="width: ${stepsProgress}%"></div>
                                            </div>
                                            <span class="w-16 text-xs text-right">${entry.steps?.toLocaleString() || '—'}</span>
                                        </div>
                                        <div class="flex items-center gap-2">
                                            <span class="w-4 text-xs">💧</span>
                                            <div class="flex-1 bg-base-300 rounded-full h-2">
                                                <div class="bg-info h-2 rounded-full transition-all duration-300" 
                                                     style="width: ${waterProgress}%"></div>
                                            </div>
                                            <span class="w-16 text-xs text-right">${entry.waterIntake || '—'}L</span>
                                        </div>
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            </div>
        </div>
    `;
    
    console.log('✅ Fallback trends visualization created');
}

/** Calculate simple trends for fallback visualization */
calculateSimpleTrends(data) {
    const trends = [];
    
    // Steps trend
    const stepsData = data.filter(d => d.steps && d.steps > 0).map(d => d.steps);
    if (stepsData.length >= 2) {
        const avgSteps = stepsData.reduce((a, b) => a + b, 0) / stepsData.length;
        const firstHalf = stepsData.slice(0, Math.floor(stepsData.length / 2));
        const secondHalf = stepsData.slice(Math.floor(stepsData.length / 2));
        
        const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
        const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
        const change = ((secondAvg - firstAvg) / firstAvg) * 100;
        
        trends.push({
            label: 'Schritte',
            icon: '🚶‍♂️',
            average: Math.round(avgSteps).toLocaleString(),
            trendIcon: change > 5 ? '📈' : change < -5 ? '📉' : '➡️',
            trendText: `${change > 0 ? '+' : ''}${Math.round(change)}%`,
            trendColor: change > 5 ? 'text-success' : change < -5 ? 'text-error' : 'text-base-content',
            trendDescription: change > 5 ? 'Steigend' : change < -5 ? 'Fallend' : 'Stabil'
        });
    }
    
    // Water trend
    const waterData = data.filter(d => d.waterIntake && d.waterIntake > 0).map(d => d.waterIntake);
    if (waterData.length >= 2) {
        const avgWater = waterData.reduce((a, b) => a + b, 0) / waterData.length;
        const firstHalf = waterData.slice(0, Math.floor(waterData.length / 2));
        const secondHalf = waterData.slice(Math.floor(waterData.length / 2));
        
        const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
        const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
        const change = ((secondAvg - firstAvg) / firstAvg) * 100;
        
        trends.push({
            label: 'Wasser',
            icon: '💧',
            average: `${Math.round(avgWater * 10) / 10}L`,
            trendIcon: change > 5 ? '📈' : change < -5 ? '📉' : '➡️',
            trendText: `${change > 0 ? '+' : ''}${Math.round(change)}%`,
            trendColor: change > 5 ? 'text-success' : change < -5 ? 'text-error' : 'text-base-content',
            trendDescription: change > 5 ? 'Steigend' : change < -5 ? 'Fallend' : 'Stabil'
        });
    }
    
    // Sleep trend
    const sleepData = data.filter(d => d.sleepHours && d.sleepHours > 0).map(d => d.sleepHours);
    if (sleepData.length >= 2) {
        const avgSleep = sleepData.reduce((a, b) => a + b, 0) / sleepData.length;
        const firstHalf = sleepData.slice(0, Math.floor(sleepData.length / 2));
        const secondHalf = sleepData.slice(Math.floor(sleepData.length / 2));
        
        const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
        const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
        const change = ((secondAvg - firstAvg) / firstAvg) * 100;
        
        trends.push({
            label: 'Schlaf',
            icon: '😴',
            average: `${Math.round(avgSleep * 10) / 10}h`,
            trendIcon: change > 5 ? '📈' : change < -5 ? '📉' : '➡️',
            trendText: `${change > 0 ? '+' : ''}${Math.round(change)}%`,
            trendColor: change > 5 ? 'text-success' : change < -5 ? 'text-error' : 'text-base-content',
            trendDescription: change > 5 ? 'Steigend' : change < -5 ? 'Fallend' : 'Stabil'
        });
    }
    
    return trends;
}

    /** Prepare chart data */
    prepareChartData(data) {
        if (!Array.isArray(data) || data.length === 0) {
            return { labels: [], steps: [], water: [], sleep: [], weight: [] };
        }

        const groupedData = {};
        
        data.forEach(entry => {
            if (!entry || !entry.date) return;
            
            const date = new Date(entry.date);
            if (isNaN(date.getTime())) return;
            
            const dateKey = date.toLocaleDateString('de-DE', { 
                month: 'short', 
                day: 'numeric' 
            });
            
            if (!groupedData[dateKey]) {
                groupedData[dateKey] = {
                    steps: 0,
                    water: 0,
                    sleep: 0,
                    weight: null,
                    count: 0
                };
            }
            
            groupedData[dateKey].steps += entry.steps || 0;
            groupedData[dateKey].water += entry.waterIntake || 0;
            groupedData[dateKey].sleep += entry.sleepHours || 0;
            if (entry.weight) groupedData[dateKey].weight = entry.weight;
            groupedData[dateKey].count++;
        });

        const labels = Object.keys(groupedData);
        const steps = labels.map(date => groupedData[date].steps);
        const water = labels.map(date => Math.round(groupedData[date].water * 10) / 10);
        const sleep = labels.map(date => Math.round(groupedData[date].sleep * 10) / 10);
        const weight = labels.map(date => groupedData[date].weight);

        return { labels, steps, water, sleep, weight };
    }

    /** Create chart datasets */
    createChartDatasets(chartData) {
        const datasets = [];
        
        const datasetConfigs = {
            steps: {
                label: 'Schritte',
                data: chartData.steps,
                borderColor: '#3B82F6',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                yAxisID: 'y'
            },
            water: {
                label: 'Wasser (L)',
                data: chartData.water,
                borderColor: '#06B6D4',
                backgroundColor: 'rgba(6, 182, 212, 0.1)',
                yAxisID: this.currentMetric === 'all' ? 'y1' : 'y'
            },
            sleep: {
                label: 'Schlaf (h)',
                data: chartData.sleep,
                borderColor: '#8B5CF6',
                backgroundColor: 'rgba(139, 92, 246, 0.1)',
                yAxisID: this.currentMetric === 'all' ? 'y1' : 'y'
            },
            weight: {
                label: 'Gewicht (kg)',
                data: chartData.weight,
                borderColor: '#EF4444',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                yAxisID: 'y'
            }
        };

        // Add datasets based on current metric
        if (this.currentMetric === 'all') {
            Object.values(datasetConfigs).forEach(config => {
                datasets.push({
                    ...config,
                    tension: 0.4,
                    fill: false,
                    pointBackgroundColor: config.borderColor,
                    pointBorderColor: '#FFFFFF',
                    pointBorderWidth: 2,
                    pointRadius: 4
                });
            });
        } else if (datasetConfigs[this.currentMetric]) {
            datasets.push({
                ...datasetConfigs[this.currentMetric],
                tension: 0.4,
                fill: true,
                pointBackgroundColor: datasetConfigs[this.currentMetric].borderColor,
                pointBorderColor: '#FFFFFF',
                pointBorderWidth: 2,
                pointRadius: 4
            });
        }

        return datasets;
    }

    /** Get chart options */
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
