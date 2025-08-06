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
            
            // Initial data load
            await this.loadInitialData();
            
            // Setup periodic sync
            this.setupPeriodicSync();
            
            console.log('✅ Health Tracker Pro erfolgreich initialisiert');
            
            // Show welcome notification
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
        // Initialize notification manager first (needed by other components)
        this.notificationManager = new SmartNotificationManager(this);
        
        // Initialize other components
        this.progressHub = new ProgressHub(this);
        this.activityFeed = new ActivityFeed(this);
        this.analyticsEngine = new AnalyticsEngine(this);
        
        console.log('📦 Alle Komponenten initialisiert');
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
        tabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                const viewName = tab.id.replace('tab-', '');
                this.progressHub?.showView(viewName);
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
            
            const success = await this.saveHealthData(formData);
            
            if (success) {
                this.showToast('✅ Gesundheitsdaten erfolgreich gespeichert!', 'success');
                event.target.reset();

                // ProgressHub über neue Daten informieren
                if (this.progressHub) {
                await this.progressHub.updateAllViews();
            }
                
                // Update all components with new data
                await this.refreshAllComponents();
                
                // Dispatch custom event for other components
                this.dispatchHealthDataEvent('health-data-saved', formData);
            }
            
        } catch (error) {
            console.error('❌ Fehler beim Speichern:', error);
            this.showToast('❌ Speichern fehlgeschlagen - Daten lokal gesichert', 'warning');
        } finally {
            this.setLoadingState(false);
        }

        if (success) {
    this.showToast('✅ Gesundheitsdaten erfolgreich gespeichert!', 'success');
    event.target.reset();
    
    // **WICHTIG: ProgressHub explizit aktualisieren**
    if (this.progressHub && typeof this.progressHub.updateTodayView === 'function') {
        console.log('🔄 Aktualisiere ProgressHub nach Datenspeicherung...');
        await this.progressHub.updateTodayView();
    } else {
        console.error('❌ ProgressHub nicht verfügbar oder updateTodayView-Methode fehlt');
    }
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
        
        return {
            userId: this.userId,
            date: formData.get('date') || new Date().toISOString().split('T')[0],
            weight: this.parseNumber(formData.get('weight')),
            steps: this.parseInt(formData.get('steps')),
            waterIntake: this.parseNumber(formData.get('waterIntake')),
            sleepHours: this.parseNumber(formData.get('sleepHours')),
            mood: formData.get('mood') || null,
            notes: this.sanitizeString(formData.get('notes'))
        };
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
     * Update dashboard statistics
     */
    async updateDashboardStats() {
        try {
            const data = await this.getAllHealthData();
            const todayData = this.getTodayData(data);
            const weekData = this.getWeekData(data);
            
            // Update today's stats
            this.updateStatCard('today-weight', todayData.weight, 'kg', '⚖️');
            this.updateStatCard('today-steps', todayData.steps, '', '🚶‍♂️');
            this.updateStatCard('today-water', todayData.waterIntake, 'L', '💧');
            this.updateStatCard('today-sleep', todayData.sleepHours, 'h', '😴');
            
            // Update weekly averages
            const weeklyAvg = this.calculateWeeklyAverages(weekData);
            this.updateStatCard('week-steps', weeklyAvg.steps, '', '📊');
            this.updateStatCard('week-water', weeklyAvg.water, 'L', '📈');
            this.updateStatCard('week-sleep', weeklyAvg.sleep, 'h', '🌙');
            
            // Update goal progress
            this.updateGoalProgress(todayData);
            
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
     * Get today's health data
     */
    getTodayData(allData) {
        const today = new Date().toISOString().split('T')[0];
        return allData.find(entry => entry.date === today) || {};
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
            await this.activityFeed?.load();
            
            // Refresh progress hub
            await this.progressHub?.loadViewData();
            
            // Refresh analytics
            await this.analyticsEngine?.updateAllAnalytics();
            
        } catch (error) {
            console.error('❌ Fehler beim Aktualisieren der Komponenten:', error);
        }
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
            
            // Add sync metadata
            const dataWithMetadata = {
                ...data,
                _localId: 'local_' + Date.now(),
                _synced: false,
                _createdAt: new Date().toISOString()
            };
            
            existingData.push(dataWithMetadata);
            
            // Keep only last 100 entries to prevent storage bloat
            const trimmedData = existingData.slice(-100);
            
            localStorage.setItem('healthData', JSON.stringify(trimmedData));
            
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
// PROGRESS HUB - Multi-View Progress Tracking
// ====================================================================

class ProgressHub {
    constructor(healthTracker) {
        this.healthTracker = healthTracker;
        this.currentView = 'today';
        this.achievements = new Map();
        this.streaks = new Map();
        
        // Wait briefly for HTML to load
        setTimeout(() => this.initialize(), 500);

        // Event-Listener für Datenänderungen
    document.addEventListener('health-data-saved', (event) => {
        this.updateAllViews();
    });
    
    document.addEventListener('goals-updated', (event) => {
        this.updateAllViews();
    });
    }
    
    /**
     * Initialize Progress Hub
     */
    initialize() {
        // Check if Progress Hub HTML exists
        if (!document.getElementById('view-today')) {
            console.warn('⚠️ Progress Hub HTML nicht gefunden - überspringe Initialisierung');
            return;
        }
        
        console.log('✅ Progress Hub wird initialisiert');
        
        // Show initial view
        this.showView(this.currentView);
        
        // Setup navigation
        this.setupTabNavigation();
    }
    
async updateAllViews() {
    try {
        console.log('🔄 ProgressHub wird aktualisiert...');
        
        // Lade aktuelle Daten
        const allData = await this.healthTracker.getAllHealthData();
        const goals = this.healthTracker.goals;
        
        // Update alle Views
        await this.updateTodayView(allData, goals);
        await this.updateWeekView(allData, goals);
        await this.updateAchievementsView(allData);
        await this.updateStreaksView(allData);
        
        console.log('✅ ProgressHub aktualisiert');
    } catch (error) {
        console.error('❌ ProgressHub Update Fehler:', error);
    }
}
    
    /**
     * Setup tab navigation
     */
    setupTabNavigation() {
        const tabs = document.querySelectorAll('[id^="tab-"]');
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const viewName = tab.id.replace('tab-', '');
                this.showView(viewName);
            });
        });
    }
    
    /**
     * Show specific view and load its data
     */
    showView(viewName) {
        if (!document.getElementById(`view-${viewName}`)) {
            console.warn(`Progress Hub View "${viewName}" nicht gefunden`);
            return;
        }
        
        // Hide all views
        document.querySelectorAll('.progress-view').forEach(view => {
            view.classList.add('hidden');
        });
        
        // Show selected view
        const targetView = document.getElementById(`view-${viewName}`);
        if (targetView) {
            targetView.classList.remove('hidden');
        }
        
        // Update tab styles
        document.querySelectorAll('.tabs .tab').forEach(tab => {
            tab.classList.remove('tab-active');
        });
        
        const tabElement = document.getElementById(`tab-${viewName}`);
        if (tabElement) {
            tabElement.classList.add('tab-active');
        }
        
        this.currentView = viewName;
        
        // Load data for the view
        this.loadViewData();
    }
    
    /**
     * Load data for current view
     */
    async loadViewData() {
        try {
            const data = await this.healthTracker.getAllHealthData();
            
            switch (this.currentView) {
                case 'today':
                    this.updateTodayView(data);
                    break;
                case 'week':
                    this.updateWeekView(data);
                    break;
                case 'achievements':
                    this.updateAchievementsView(data);
                    break;
                case 'streaks':
                    this.updateStreaksView(data);
                    break;
            }
        } catch (error) {
            console.error('❌ Error loading Progress Hub data:', error);
        }
    }
    
    /**
     * Update today view with current progress
     */
    async updateTodayView() {
    try {
        console.log('🔄 Aktualisiere Today View...');
        
        // Debug aufrufen
        this.debugTodayView();
        
        const today = new Date().toISOString().split('T')[0];
        const allData = await this.healthTracker.getAllHealthData();
        const todayData = allData.find(entry => entry.date === today) || {};
        const goals = this.healthTracker.goals;
        
        console.log('Today Data:', todayData);
        console.log('Goals:', goals);

        // Steps Progress
        const currentSteps = todayData.steps || 0;
        const stepsGoal = goals.stepsGoal || 10000;
        const stepsProgress = Math.round((currentSteps / stepsGoal) * 100);
        
        this.updateProgressElement('today-steps-display', currentSteps.toLocaleString());
        this.updateProgressElement('steps-progress-bar', Math.min(stepsProgress, 100), 'progress');
        this.updateProgressElement('steps-progress-badge', `${Math.min(stepsProgress, 100)}%`);

        // Water Progress
        const currentWater = todayData.waterIntake || 0;
        const waterGoal = goals.waterGoal || 2.0;
        const waterProgress = Math.round((currentWater / waterGoal) * 100);
        
        this.updateProgressElement('today-water-display', `${currentWater.toFixed(1)}L`);
        this.updateProgressElement('water-progress-bar', Math.min(waterProgress, 100), 'progress');
        this.updateProgressElement('water-progress-badge', `${Math.min(waterProgress, 100)}%`);

        // Sleep Progress
        const currentSleep = todayData.sleepHours || 0;
        const sleepGoal = goals.sleepGoal || 8;
        const sleepProgress = Math.round((currentSleep / sleepGoal) * 100);
        
        this.updateProgressElement('today-sleep-display', `${currentSleep.toFixed(1)}h`);
        this.updateProgressElement('sleep-progress-bar', Math.min(sleepProgress, 100), 'progress');
        this.updateProgressElement('sleep-progress-badge', `${Math.min(sleepProgress, 100)}%`);

        // Overall Score
        const overallScore = Math.round((stepsProgress + waterProgress + sleepProgress) / 3);
        this.updateProgressElement('today-score-display', `${overallScore}%`);
        this.updateProgressElement('score-progress-bar', overallScore, 'progress');
        this.updateProgressElement('score-progress-badge', `${overallScore}%`);

        // Update motivational messages
        this.updateMotivationalMessages(stepsProgress, waterProgress, sleepProgress, overallScore);
        
        console.log('✅ Today View aktualisiert');
        
    } catch (error) {
        console.error('❌ Fehler bei Today View Update:', error);
    }
}

// Helper method
updateProgressElement(elementId, value, type = 'text') {
    const element = document.getElementById(elementId);
    if (element) {
        if (type === 'progress') {
            element.value = value;
            element.style.setProperty('--value', value);
        } else {
            element.textContent = value;
        }
        console.log(`✅ Updated ${elementId}: ${value}`);
    } else {
        console.error(`❌ Element not found: ${elementId}`);
    }
}

updateMotivationalMessages(stepsProgress, waterProgress, sleepProgress, overallScore) {
    // Steps motivation
    const stepsMotivation = document.getElementById('steps-motivation');
    if (stepsMotivation) {
        if (stepsProgress >= 100) stepsMotivation.textContent = '🎉 Ziel erreicht!';
        else if (stepsProgress >= 80) stepsMotivation.textContent = '💪 Fast geschafft!';
        else if (stepsProgress >= 50) stepsMotivation.textContent = '🚶‍♂️ Auf gutem Weg!';
        else stepsMotivation.textContent = '🌟 Jeder Schritt zählt!';
    }

    // Water motivation
    const waterMotivation = document.getElementById('water-motivation');
    if (waterMotivation) {
        if (waterProgress >= 100) waterMotivation.textContent = '💧 Perfekt hydriert!';
        else if (waterProgress >= 75) waterMotivation.textContent = '💪 Gut gemacht!';
        else waterMotivation.textContent = '💧 Denk ans Trinken!';
    }

    // Sleep motivation
    const sleepMotivation = document.getElementById('sleep-motivation');
    if (sleepMotivation) {
        if (sleepProgress >= 100) sleepMotivation.textContent = '😴 Ausgeruht!';
        else sleepMotivation.textContent = '💤 Erholung ist wichtig!';
    }

    // Overall motivation
    const scoreMotivation = document.getElementById('score-motivation');
    if (scoreMotivation) {
        if (overallScore >= 90) scoreMotivation.textContent = '🌟 Fantastisch!';
        else if (overallScore >= 70) scoreMotivation.textContent = '💪 Super Tag!';
        else if (overallScore >= 50) scoreMotivation.textContent = '👍 Gut gemacht!';
        else scoreMotivation.textContent = '🚀 Du schaffst das!';
    }
}
    
    /**
     * Update progress card with data
     */
    updateProgressCard(type, current, goal) {
        if (type === 'score') {
            // Special handling for overall score
            const percentage = current;
            this.updateElement(`${type}-progress-badge`, Math.round(percentage) + '%');
            this.updateElement(`today-${type}-display`, Math.round(current));
            this.updateElement(`${type}-progress-bar`, null, (el) => {
                if (el) el.value = percentage;
            });
            this.updateElement(`${type}-motivation`, this.getMotivationalMessage(type, percentage));
            return;
        }
        
        if (!goal || goal <= 0) return;
        
        const percentage = Math.min((current / goal) * 100, 100);
        
        // Update elements with safe checks
        this.updateElement(`${type}-progress-badge`, Math.round(percentage) + '%');
        
        if (type === 'steps') {
            this.updateElement(`today-${type}-display`, current.toLocaleString());
        } else if (type === 'water') {
            this.updateElement(`today-${type}-display`, current.toLocaleString() + 'L');
        } else if (type === 'sleep') {
            this.updateElement(`today-${type}-display`, current.toLocaleString() + 'h');
        }
        
        this.updateElement(`${type}-progress-bar`, null, (el) => {
            if (el) el.value = percentage;
        });
        
        this.updateElement(`${type}-goal-display`, goal.toLocaleString() + (type === 'steps' ? '' : type === 'water' ? 'L' : 'h'));
        this.updateElement(`${type}-motivation`, this.getMotivationalMessage(type, percentage));
    }
    
    /**
     * Safely update element content
     */
    updateElement(id, content, customHandler = null) {
        const element = document.getElementById(id);
        if (element) {
            if (customHandler) {
                customHandler(element);
            } else if (content !== null) {
                element.textContent = content;
            }
        }
    }
    
    /**
     * Calculate overall health score for today
     */
    calculateOverallScore(todayData) {
        const goals = this.healthTracker.goals;
        let score = 0;
        let maxScore = 0;
        
        // Steps (40 points max)
        if (goals.stepsGoal && goals.stepsGoal > 0) {
            maxScore += 40;
            score += Math.min((todayData.steps || 0) / goals.stepsGoal, 1) * 40;
        }
        
        // Water (30 points max)
        if (goals.waterGoal && goals.waterGoal > 0) {
            maxScore += 30;
            score += Math.min((todayData.waterIntake || 0) / goals.waterGoal, 1) * 30;
        }
        
        // Sleep (30 points max)
        if (goals.sleepGoal && goals.sleepGoal > 0) {
            maxScore += 30;
            score += Math.min((todayData.sleepHours || 0) / goals.sleepGoal, 1) * 30;
        }
        
        return maxScore > 0 ? (score / maxScore) * 100 : 0;
    }
    
    /**
     * Get motivational message based on progress
     */
    getMotivationalMessage(type, percentage) {
        const messages = {
            steps: {
                low: 'Jeder Schritt zählt! 🚶‍♂️',
                medium: 'Du bist auf einem guten Weg! 👍',
                high: 'Fantastisch! Weiter so! 🎉'
            },
            water: {
                low: 'Denk ans Trinken! 💧',
                medium: 'Gute Hydration! 👌',
                high: 'Perfekt hydriert! ✨'
            },
            sleep: {
                low: 'Erholung ist wichtig! 😴',
                medium: 'Guter Schlaf! 👍',
                high: 'Optimal erholt! 🌟'
            },
            score: {
                low: 'Du schaffst das! 💪',
                medium: 'Toller Fortschritt! 🚀',
                high: 'Incredible! Du bist ein Star! ⭐'
            }
        };
        
        const level = percentage < 30 ? 'low' : percentage < 80 ? 'medium' : 'high';
        return messages[type]?.[level] || 'Bleib dran!';
    }
    
    /**
     * Generate quick actions based on missing data
     */
    generateQuickActions(todayData) {
        const container = document.getElementById('today-quick-actions');
        if (!container) return;
        
        const actions = [];
        
        // Check what's missing today
        if (!todayData.steps || todayData.steps < this.healthTracker.goals.stepsGoal * 0.5) {
            actions.push({
                text: '🚶‍♂️ Spaziergang machen',
                action: 'takeWalk',
                class: 'btn-success'
            });
        }
        
        if (!todayData.waterIntake || todayData.waterIntake < this.healthTracker.goals.waterGoal * 0.7) {
            actions.push({
                text: '💧 Wasser trinken',
                action: 'drinkWater',
                class: 'btn-info'
            });
        }
        
        if (!todayData.weight) {
            actions.push({
                text: '⚖️ Gewicht erfassen',
                action: 'recordWeight',
                class: 'btn-secondary'
            });
        }
        
        if (!todayData.mood) {
            actions.push({
                text: '😊 Stimmung festhalten',
                action: 'recordMood',
                class: 'btn-accent'
            });
        }
        
        // Always show data entry option
        actions.push({
            text: '📊 Daten eingeben',
            action: 'enterData',
            class: 'btn-primary'
        });
        
        container.innerHTML = actions.map(action => `
            <button class="btn ${action.class} btn-sm" onclick="healthTracker.progressHub.handleQuickAction('${action.action}')">
                ${action.text}
            </button>
        `).join('');
    }
    
    /**
     * Handle quick action clicks
     */
    handleQuickAction(action) {
        switch (action) {
            case 'takeWalk':
                this.healthTracker.notificationManager.showInAppNotification(
                    '🚶‍♂️ Zeit für einen Spaziergang! Jeder Schritt bringt dich näher zu deinem Ziel.',
                    'info'
                );
                break;
                
            case 'drinkWater':
                this.healthTracker.notificationManager.showInAppNotification(
                    '💧 Trinke ein Glas Wasser! Dein Körper wird es dir danken.',
                    'info'
                );
                break;
                
            case 'recordWeight':
            case 'recordMood':
            case 'enterData':
                // Scroll to health form
                document.getElementById('health-form')?.scrollIntoView({ 
                    behavior: 'smooth' 
                });
                break;
        }
    }
    
    /**
     * Update mood display
     */
    updateMoodDisplay(mood) {
        const moodElement = document.getElementById('today-mood-display');
        if (moodElement) {
            const moodEmojis = {
                'excellent': '😄',
                'good': '😊',
                'neutral': '😐',
                'bad': '😔',
                'terrible': '😞'
            };
            
            const moodLabels = {
                'excellent': 'Ausgezeichnet',
                'good': 'Gut',
                'neutral': 'Neutral',
                'bad': 'Schlecht',
                'terrible': 'Sehr schlecht'
            };
            
            if (mood) {
                moodElement.innerHTML = `${moodEmojis[mood]} ${moodLabels[mood]}`;
            } else {
                moodElement.innerHTML = '😐 Nicht erfasst';
            }
        }
    }
    
    /**
     * Update week view
     */
    updateWeekView(data) {
        const weekData = this.healthTracker.getWeekData(data);
        const weeklyAvg = this.healthTracker.calculateWeeklyAverages(weekData);
        
        // Update weekly stats
        this.updateElement('weekly-avg-steps', weeklyAvg.steps.toLocaleString());
        this.updateElement('weekly-avg-water', weeklyAvg.water + 'L');
        this.updateElement('weekly-avg-sleep', weeklyAvg.sleep + 'h');
        
        // Calculate goals achievement rate
        const goalsHitRate = this.calculateWeeklyGoalsRate(weekData);
        this.updateElement('weekly-goals-rate', Math.round(goalsHitRate) + '%');
        
        // Generate weekly insights
        this.generateWeeklyInsights(weekData, weeklyAvg);
    }
    
    /**
     * Calculate weekly goals achievement rate
     */
    calculateWeeklyGoalsRate(weekData) {
        if (weekData.length === 0) return 0;
        
        const goalsHit = weekData.reduce((count, entry) => {
            let dailyGoalsHit = 0;
            
            if (entry.steps >= this.healthTracker.goals.stepsGoal) dailyGoalsHit++;
            if (entry.waterIntake >= this.healthTracker.goals.waterGoal) dailyGoalsHit++;
            if (entry.sleepHours >= this.healthTracker.goals.sleepGoal) dailyGoalsHit++;
            
            // Consider day successful if at least 2 out of 3 goals are met
            return count + (dailyGoalsHit >= 2 ? 1 : 0);
        }, 0);
        
        return (goalsHit / weekData.length) * 100;
    }
    
    /**
     * Generate weekly insights
     */
    generateWeeklyInsights(weekData, weeklyAvg) {
        const insights = [];
        
        // Steps insights
        if (weeklyAvg.steps >= this.healthTracker.goals.stepsGoal) {
            insights.push('🚶‍♂️ Großartig! Du erreichst dein Schrittziel konstant.');
        } else if (weeklyAvg.steps >= this.healthTracker.goals.stepsGoal * 0.8) {
            insights.push('👍 Du bist nah an deinem Schrittziel. Nur noch etwas mehr!');
        } else {
            insights.push('📈 Versuche täglich ein paar mehr Schritte zu gehen.');
        }
        
        // Water insights
        if (weeklyAvg.water >= this.healthTracker.goals.waterGoal) {
            insights.push('💧 Perfekte Hydration! Du trinkst ausreichend Wasser.');
        } else {
            insights.push('🥤 Denke daran, regelmäßig zu trinken.');
        }
        
        // Sleep insights
        if (weeklyAvg.sleep >= this.healthTracker.goals.sleepGoal) {
            insights.push('😴 Ausgezeichnet! Du bekommst genug Schlaf.');
        } else {
            insights.push('🌙 Früher ins Bett gehen könnte dir helfen.');
        }
        
        // Consistency insight
        const consistentDays = weekData.length;
        if (consistentDays >= 6) {
            insights.push('🔥 Fantastische Konstanz beim Tracking!');
        } else if (consistentDays >= 4) {
            insights.push('📊 Gute Tracking-Gewohnheit entwickelt.');
        } else {
            insights.push('📝 Versuche täglich deine Daten zu erfassen.');
        }
        
        const insightsContainer = document.getElementById('weekly-insights');
        if (insightsContainer) {
            insightsContainer.innerHTML = insights.map(insight => `
                <div class="alert alert-info">
                    <span>${insight}</span>
                </div>
            `).join('');
        }
    }
    
    /**
     * Update achievements view
     */
    updateAchievementsView(data) {
        const achievements = this.calculateAchievements(data);
        this.renderAchievements(achievements);
    }
    
    /**
     * Calculate user achievements
     */
    calculateAchievements(data) {
        const achievements = [];
        
        // Steps achievements
        const totalSteps = data.reduce((sum, d) => sum + (d.steps || 0), 0);
        const stepMilestones = [
            { threshold: 10000, title: 'Erste 10.000 Schritte', icon: '🥉' },
            { threshold: 50000, title: '50.000 Schritte Meilenstein', icon: '🥈' },
            { threshold: 100000, title: '100.000 Schritte Held', icon: '🥇' },
            { threshold: 250000, title: 'Viertel Million Schritte', icon: '🏆' },
            { threshold: 500000, title: 'Halbe Million Schritte', icon: '💎' },
            { threshold: 1000000, title: 'Million Schritte Champion', icon: '👑' }
        ];
        
        stepMilestones.forEach(milestone => {
            if (totalSteps >= milestone.threshold) {
                achievements.push({
                    ...milestone,
                    category: 'steps',
                    achieved: true,
                    progress: 100
                });
            } else {
                const progress = (totalSteps / milestone.threshold) * 100;
                if (progress > 50) { // Show upcoming achievements
                    achievements.push({
                        ...milestone,
                        category: 'steps',
                        achieved: false,
                        progress: Math.round(progress)
                    });
                }
            }
        });
        
        // Streak achievements
        const streakData = this.calculateStreaks(data);
        if (streakData.steps.current >= 7) {
            achievements.push({
                title: `${streakData.steps.current} Tage Schritte-Serie`,
                icon: '🔥',
                category: 'streak',
                achieved: true,
                progress: 100
            });
        }
        
        // Goal achievements
        const goalsHitDays = data.filter(entry => {
            let goalsHit = 0;
            if (entry.steps >= this.healthTracker.goals.stepsGoal) goalsHit++;
            if (entry.waterIntake >= this.healthTracker.goals.waterGoal) goalsHit++;
            if (entry.sleepHours >= this.healthTracker.goals.sleepGoal) goalsHit++;
            return goalsHit >= 2;
        }).length;
        
        if (goalsHitDays >= 7) {
            achievements.push({
                title: `${goalsHitDays} Tage Ziele erreicht`,
                icon: '🎯',
                category: 'goals',
                achieved: true,
                progress: 100
            });
        }
        
        return achievements.sort((a, b) => b.progress - a.progress);
    }
    
    /**
     * Render achievements in the UI
     */
    renderAchievements(achievements) {
        const container = document.getElementById('achievements-list');
        if (!container) return;
        
        container.innerHTML = achievements.map(achievement => `
            <div class="card bg-base-100 shadow-lg ${achievement.achieved ? 'ring-2 ring-success' : 'opacity-70'}">
                <div class="card-body">
                    <div class="flex items-center gap-4">
                        <div class="text-4xl">${achievement.icon}</div>
                        <div class="flex-1">
                            <h3 class="card-title text-lg">${achievement.title}</h3>
                            <div class="progress progress-${achievement.achieved ? 'success' : 'info'} w-full mt-2">
                                <div class="progress-bar" style="width: ${achievement.progress}%"></div>
                            </div>
                            <p class="text-sm opacity-70 mt-1">${achievement.progress}% erreicht</p>
                        </div>
                        ${achievement.achieved ? '<div class="badge badge-success">Erreicht!</div>' : ''}
                    </div>
                </div>
            </div>
        `).join('');
    }
    
    /**
     * Update streaks view
     */
    updateStreaksView(data) {
        const streakData = this.calculateStreaks(data);
        this.renderStreaks(streakData);
    }
    
    /**
     * Calculate various streaks
     */
    calculateStreaks(data) {
        const sortedData = data.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        return {
            steps: this.calculateStreak(sortedData, entry => entry.steps >= this.healthTracker.goals.stepsGoal),
            water: this.calculateStreak(sortedData, entry => entry.waterIntake >= this.healthTracker.goals.waterGoal),
            sleep: this.calculateStreak(sortedData, entry => entry.sleepHours >= this.healthTracker.goals.sleepGoal),
            tracking: this.calculateStreak(sortedData, entry => entry.steps || entry.waterIntake || entry.sleepHours || entry.weight),
            allGoals: this.calculateStreak(sortedData, entry => {
                let goalsHit = 0;
                if (entry.steps >= this.healthTracker.goals.stepsGoal) goalsHit++;
                if (entry.waterIntake >= this.healthTracker.goals.waterGoal) goalsHit++;
                if (entry.sleepHours >= this.healthTracker.goals.sleepGoal) goalsHit++;
                return goalsHit >= 3; // All goals hit
            })
        };
    }
    
    /**
     * Calculate streak for a specific condition
     */
    calculateStreak(sortedData, condition) {
        let current = 0;
        let longest = 0;
        let tempStreak = 0;
        
        // Calculate current streak (from today backwards)
        for (const entry of sortedData) {
            if (condition(entry)) {
                if (current === tempStreak) {
                    current++;
                }
                tempStreak++;
            } else {
                if (current === tempStreak) {
                    break; // End of current streak
                }
                tempStreak = 0;
            }
        }
        
        // Calculate longest streak
        tempStreak = 0;
        for (const entry of sortedData.reverse()) {
            if (condition(entry)) {
                tempStreak++;
                longest = Math.max(longest, tempStreak);
            } else {
                tempStreak = 0;
            }
        }
        
        return { current, longest };
    }
    
    /**
     * Render streaks in the UI
     */
    renderStreaks(streakData) {
        const container = document.getElementById('streaks-list');
        if (!container) return;
        
        const streaks = [
            { key: 'steps', title: 'Schritte-Ziel', icon: '🚶‍♂️', data: streakData.steps },
            { key: 'water', title: 'Wasser-Ziel', icon: '💧', data: streakData.water },
            { key: 'sleep', title: 'Schlaf-Ziel', icon: '😴', data: streakData.sleep },
            { key: 'tracking', title: 'Tägliches Tracking', icon: '📊', data: streakData.tracking },
            { key: 'allGoals', title: 'Alle Ziele', icon: '🎯', data: streakData.allGoals }
        ];
        
        container.innerHTML = streaks.map(streak => `
            <div class="stat bg-base-100 rounded-lg shadow">
                <div class="stat-figure text-2xl">${streak.icon}</div>
                <div class="stat-title">${streak.title}</div>
                <div class="stat-value text-primary">${streak.data.current}</div>
                <div class="stat-desc">
                    Aktuelle Serie • Rekord: ${streak.data.longest} Tage
                    ${streak.data.current > 0 ? '<div class="badge badge-success badge-sm ml-2">🔥</div>' : ''}
                </div>
            </div>
        `).join('');
    }
    
    /**
     * Export weekly data (placeholder)
     */
    exportWeeklyData() {
        this.healthTracker.notificationManager.showInAppNotification(
            '📊 Export-Funktion wird entwickelt...', 
            'info'
        );
    }
    
    /**
     * Share progress via Web Share API
     */
    async shareProgress() {
        const today = new Date().toLocaleDateString('de-DE');
        const shareText = `🎯 Mein Health Tracker Fortschritt vom ${today}\n\nBleib gesund und aktiv! 💪`;
        
        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'Health Tracker Pro Fortschritt',
                    text: shareText,
                    url: window.location.href
                });
            } catch (error) {
                console.log('Share cancelled or failed:', error);
            }
        } else {
            // Fallback: Copy to clipboard
            try {
                await navigator.clipboard.writeText(shareText);
                this.healthTracker.notificationManager.showInAppNotification(
                    '📋 Fortschritt in Zwischenablage kopiert!', 
                    'success'
                );
            } catch (error) {
                this.healthTracker.notificationManager.showInAppNotification(
                    '📱 Teilen-Funktion in diesem Browser nicht verfügbar', 
                    'warning'
                );
            }
        }
    }
    
    /**
     * Reset progress (with confirmation)
     */
    resetProgress() {
        if (confirm('Möchtest du wirklich den gesamten Fortschritt zurücksetzen? Diese Aktion kann nicht rückgängig gemacht werden.')) {
            localStorage.removeItem('healthData');
            localStorage.removeItem('userGoals');
            localStorage.removeItem('seenMilestones');
            
            this.healthTracker.notificationManager.showInAppNotification(
                '🔄 Fortschritt zurückgesetzt!', 
                'warning'
            );
            
            // Reload page to reset everything
            setTimeout(() => location.reload(), 1000);
        }
    }

    // In der ProgressHub-Klasse hinzufügen:
debugTodayView() {
    console.log('🔍 Progress Hub Today View Debug:');
    
    // Check HTML elements
    const elements = [
        'today-steps-display',
        'today-water-display', 
        'today-sleep-display',
        'today-score-display',
        'steps-progress-bar',
        'water-progress-bar',
        'sleep-progress-bar',
        'score-progress-bar'
    ];
    
    elements.forEach(id => {
        const element = document.getElementById(id);
        console.log(`Element ${id}:`, element ? 'FOUND' : 'NOT FOUND');
    });
    
    // Check data
    const today = new Date().toISOString().split('T')[0];
    const allData = this.healthTracker.getAllHealthData();
    console.log('Today date:', today);
    console.log('All data:', allData);
    console.log('Goals:', this.healthTracker.goals);
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
     * Parse health data into activity entries
     */
    parseActivities(data) {
        if (!Array.isArray(data)) return [];
        
        const activities = [];
        
        // Sort by date (newest first)
        const sortedData = data.sort((a, b) => 
            new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date)
        );
        
        sortedData.forEach(entry => {
            const date = new Date(entry.date);
            const timeStr = this.formatTime(date);
            
            // Create activities for each data type
            if (entry.steps && entry.steps > 0) {
                activities.push({
                    type: 'steps',
                    label: `${entry.steps.toLocaleString()} Schritte erfasst`,
                    time: timeStr,
                    value: entry.steps,
                    date: date,
                    goal: this.healthTracker.goals.stepsGoal,
                    entry: entry
                });
            }
            
            if (entry.waterIntake && entry.waterIntake > 0) {
                activities.push({
                    type: 'water',
                    label: `${entry.waterIntake}L Wasser getrunken`,
                    time: timeStr,
                    value: entry.waterIntake,
                    date: date,
                    goal: this.healthTracker.goals.waterGoal,
                    entry: entry
                });
            }
            
            if (entry.sleepHours && entry.sleepHours > 0) {
                const hours = Math.floor(entry.sleepHours);
                const minutes = Math.round((entry.sleepHours - hours) * 60);
                activities.push({
                    type: 'sleep',
                    label: `${hours}h ${minutes}min geschlafen`,
                    time: timeStr,
                    value: entry.sleepHours,
                    date: date,
                    goal: this.healthTracker.goals.sleepGoal,
                    entry: entry
                });
            }
            
            if (entry.weight && entry.weight > 0) {
                activities.push({
                    type: 'weight',
                    label: `Gewicht: ${entry.weight}kg erfasst`,
                    time: timeStr,
                    value: entry.weight,
                    date: date,
                    goal: this.healthTracker.goals.weightGoal,
                    entry: entry
                });
            }
            
            if (entry.mood) {
                const moodLabels = {
                    excellent: 'Ausgezeichnete Stimmung',
                    good: 'Gute Stimmung',
                    neutral: 'Neutrale Stimmung',
                    bad: 'Schlechte Stimmung',
                    terrible: 'Schlechte Stimmung'
                };
                activities.push({
                    type: 'mood',
                    label: moodLabels[entry.mood] || 'Stimmung erfasst',
                    time: timeStr,
                    value: entry.mood,
                    date: date,
                    entry: entry
                });
            }
            
            if (entry.notes && entry.notes.trim()) {
                activities.push({
                    type: 'note',
                    label: 'Notiz hinzugefügt',
                    time: timeStr,
                    value: entry.notes.substring(0, 100),
                    date: date,
                    entry: entry
                });
            }
        });
        
        // Sort by date (newest first)
        return activities.sort((a, b) => b.date - a.date);
    }
    
    /**
     * Format timestamp for display
     */
    formatTime(date) {
        const now = new Date();
        const diffMs = now - date;
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        
        if (diffDays === 0) {
            return `Heute • ${date.toLocaleTimeString('de-DE', { 
                hour: '2-digit', 
                minute: '2-digit' 
            })}`;
        } else if (diffDays === 1) {
            return 'Gestern';
        } else if (diffDays < 7) {
            return `${diffDays} Tage her`;
        } else {
            return date.toLocaleDateString('de-DE');
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
// ANALYTICS ENGINE - Advanced Data Analysis & Visualization
// ====================================================================

class AnalyticsEngine {
    constructor(healthTracker) {
        this.healthTracker = healthTracker;
        this.charts = new Map();
        this.currentPeriod = 30; // Default to 30 days
        this.currentMetric = 'steps';
        
        // Initialize after short delay to ensure DOM is ready
        setTimeout(() => this.initialize(), 1000);
    }
    
    /**
     * Initialize analytics engine
     */
    initialize() {
        console.log('📊 Analytics Engine wird initialisiert...');
        
        // Check if Chart.js is available
        if (typeof Chart === 'undefined') {
            console.warn('⚠️ Chart.js nicht verfügbar - Charts werden nicht angezeigt');
            return;
        }
        
        // Configure Chart.js defaults
        this.configureChartDefaults();
        
        // Setup analytics controls
        this.setupAnalyticsControls();
        
        // Initial load
        this.updateAllAnalytics();
        
        console.log('✅ Analytics Engine initialisiert');
    }
    
    /**
     * Configure Chart.js default settings
     */
    configureChartDefaults() {
        Chart.defaults.font.family = 'Inter, system-ui, -apple-system, sans-serif';
        Chart.defaults.color = '#64748b';
        Chart.defaults.responsive = true;
        Chart.defaults.maintainAspectRatio = false;
        Chart.defaults.interaction = {
            intersect: false,
            mode: 'index'
        };
        Chart.defaults.plugins.tooltip.backgroundColor = 'rgba(15, 23, 42, 0.9)';
        Chart.defaults.plugins.tooltip.titleColor = '#f1f5f9';
        Chart.defaults.plugins.tooltip.bodyColor = '#cbd5e1';
        Chart.defaults.plugins.tooltip.cornerRadius = 8;
    }
    
    /**
     * Setup analytics control buttons
     */
    setupAnalyticsControls() {
        // Period selector buttons
        const periodButtons = document.querySelectorAll('[data-period]');
        periodButtons.forEach(button => {
            button.addEventListener('click', () => {
                this.currentPeriod = parseInt(button.dataset.period);
                this.updatePeriodButtons();
                this.updateAllAnalytics();
            });
        });
        
        // Metric selector buttons
        const metricButtons = document.querySelectorAll('[data-metric]');
        metricButtons.forEach(button => {
            button.addEventListener('click', () => {
                this.currentMetric = button.dataset.metric;
                this.updateMetricButtons();
                this.updateTrendChart();
            });
        });
    }
    
    /**
     * Update period button states
     */
    updatePeriodButtons() {
        document.querySelectorAll('[data-period]').forEach(button => {
            if (parseInt(button.dataset.period) === this.currentPeriod) {
                button.classList.add('btn-primary');
                button.classList.remove('btn-ghost');
            } else {
                button.classList.remove('btn-primary');
                button.classList.add('btn-ghost');
            }
        });
    }
    
    /**
     * Update metric button states
     */
    updateMetricButtons() {
        document.querySelectorAll('[data-metric]').forEach(button => {
            if (button.dataset.metric === this.currentMetric) {
                button.classList.add('btn-primary');
                button.classList.remove('btn-ghost');
            } else {
                button.classList.remove('btn-primary');
                button.classList.add('btn-ghost');
            }
        });
    }
    
    /**
     * Update all analytics charts and insights
     */
    async updateAllAnalytics() {
    try {
        const data = await this.healthTracker.getAllHealthData();
        const periodData = this.getDataForPeriod(data, this.currentPeriod);
        
        // Update all charts
        await Promise.all([
            this.updateTrendChart(periodData),
            this.updateHeatmapChart(periodData),
            this.updateCorrelationChart(periodData),
            this.updateWeeklySummaryChart(data),
            this.updateGoalProgressChart(periodData)
        ]);
        
        // Update insights
        this.updateInsights(periodData);
        this.updateCorrelationInsights(periodData);
        
    } catch (error) {
        console.error('❌ Analytics update error:', error);
    }
}
    
    /**
     * Get data for specific time period
     */
    getDataForPeriod(allData, days) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);
        
        return allData.filter(entry => {
            const entryDate = new Date(entry.date);
            return entryDate >= cutoffDate;
        }).sort((a, b) => new Date(a.date) - new Date(b.date));
    }
    
    /**
     * Update trend chart
     */
    async updateTrendChart(data = null) {
    if (!data) {
        const allData = await this.healthTracker.getAllHealthData();
        data = this.getDataForPeriod(allData, this.currentPeriod);
    }
    
    const canvas = document.getElementById('trends-chart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    
    // Destroy existing chart
    if (this.charts.has('trends')) {
        this.charts.get('trends').destroy();
    }
    
    const chartData = this.prepareTrendData(data);
    
    const chart = new Chart(ctx, {
        type: 'line',
        data: chartData,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    type: 'time',
                    time: {
                        unit: this.currentPeriod > 30 ? 'week' : 'day',
                        displayFormats: {
                            day: 'MMM dd',
                            week: 'MMM dd'
                        }
                    },
                    title: {
                        display: true,
                        text: 'Datum'
                    }
                },
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: this.getMetricLabel(this.currentMetric)
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: (context) => {
                            const value = context.parsed.y;
                            const unit = this.getMetricUnit(this.currentMetric);
                            return `${value.toLocaleString()}${unit}`;
                        }
                    }
                }
            },
            animation: {
                duration: 750,
                easing: 'easeInOutQuart'
            }
        }
    });
    
    this.charts.set('trends', chart);
}
    
    /**
     * Prepare data for trend chart
     */
    prepareTrendData(data) {
        const sortedData = data.sort((a, b) => new Date(a.date) - new Date(b.date));
        
        const datasets = [{
            label: this.getMetricLabel(this.currentMetric),
            data: sortedData.map(entry => ({
                x: entry.date,
                y: this.getMetricValue(entry, this.currentMetric)
            })),
            borderColor: this.getMetricColor(this.currentMetric),
            backgroundColor: this.getMetricColor(this.currentMetric, 0.1),
            tension: 0.4,
            fill: true,
            pointBackgroundColor: this.getMetricColor(this.currentMetric),
            pointBorderColor: '#ffffff',
            pointBorderWidth: 2,
            pointRadius: 4,
            pointHoverRadius: 6
        }];
        
        // Add goal line if applicable
        const goal = this.getGoalForMetric(this.currentMetric);
        if (goal) {
            datasets.push({
                label: 'Ziel',
                data: sortedData.map(entry => ({
                    x: entry.date,
                    y: goal
                })),
                borderColor: '#ef4444',
                borderDash: [5, 5],
                fill: false,
                pointRadius: 0,
                tension: 0
            });
        }
        
        return { datasets };
    }
    
    /**
     * Update heatmap chart (activity pattern visualization)
     */
    async updateHeatmapChart(data) {
        const canvas = document.getElementById('heatmap-chart');
        if (!canvas) return;
        
        // Clear existing heatmap
        canvas.innerHTML = '';
        
        // Generate heatmap data
        const heatmapData = this.generateHeatmapData(data);
        
        // Create heatmap visualization
        this.renderHeatmap(canvas, heatmapData);
    }
    
    /**
     * Generate heatmap data for activity patterns
     */
    generateHeatmapData(data) {
        const heatmapData = [];
        const weeks = [];
        
        // Get last 12 weeks
        for (let i = 11; i >= 0; i--) {
            const weekStart = new Date();
            weekStart.setDate(weekStart.getDate() - (i * 7) - weekStart.getDay());
            weekStart.setHours(0, 0, 0, 0);
            
            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekEnd.getDate() + 6);
            weekEnd.setHours(23, 59, 59, 999);
            
            weeks.push({ start: weekStart, end: weekEnd });
        }
        
        weeks.forEach((week, weekIndex) => {
            for (let day = 0; day < 7; day++) {
                const currentDay = new Date(week.start);
                currentDay.setDate(currentDay.getDate() + day);
                
                const dateStr = currentDay.toISOString().split('T')[0];
                const dayData = data.find(entry => entry.date === dateStr);
                
                const intensity = this.calculateDayIntensity(dayData);
                
                heatmapData.push({
                    week: weekIndex,
                    day: day,
                    date: dateStr,
                    intensity: intensity,
                    data: dayData
                });
            }
        });
        
        return heatmapData;
    }
    
    /**
     * Calculate day activity intensity (0-4)
     */
    calculateDayIntensity(dayData) {
        if (!dayData) return 0;
        
        let score = 0;
        const goals = this.healthTracker.goals;
        
        // Steps contribution (0-2 points)
        if (dayData.steps) {
            score += Math.min(2, (dayData.steps / goals.stepsGoal) * 2);
        }
        
        // Water contribution (0-1 point)
        if (dayData.waterIntake) {
            score += Math.min(1, (dayData.waterIntake / goals.waterGoal));
        }
        
        // Sleep contribution (0-1 point)
        if (dayData.sleepHours) {
            score += Math.min(1, (dayData.sleepHours / goals.sleepGoal));
        }
        
        // Return intensity level 0-4
        return Math.min(4, Math.floor(score));
    }
    
    /**
     * Render heatmap visualization
     */
    renderHeatmap(container, heatmapData) {
        const heatmapContainer = document.createElement('div');
        heatmapContainer.className = 'flex flex-col gap-1 p-4';
        
        // Create weekday labels
        const weekdayLabels = document.createElement('div');
        weekdayLabels.className = 'flex gap-1 mb-2 text-xs text-base-content/60';
        weekdayLabels.innerHTML = `
            <div class="w-3"></div>
            <div class="w-3">Mo</div>
            <div class="w-3"></div>
            <div class="w-3">Mi</div>
            <div class="w-3"></div>
            <div class="w-3">Fr</div>
            <div class="w-3"></div>
        `;
        
        heatmapContainer.appendChild(weekdayLabels);
        
        // Create heatmap grid
        const grid = document.createElement('div');
        grid.className = 'grid grid-cols-7 gap-1';
        
        heatmapData.forEach(cell => {
            const cellEl = document.createElement('div');
            cellEl.className = `w-3 h-3 rounded-sm cursor-pointer transition-all hover:scale-110`;
            
            // Set intensity color
            const intensityColors = [
                'bg-base-200',
                'bg-primary/20',
                'bg-primary/40',
                'bg-primary/60',
                'bg-primary/80'
            ];
            
            cellEl.className += ` ${intensityColors[cell.intensity]}`;
            
            // Add tooltip
            cellEl.title = this.generateHeatmapTooltip(cell);
            
            grid.appendChild(cellEl);
        });
        
        heatmapContainer.appendChild(grid);
        
        // Add legend
        const legend = document.createElement('div');
        legend.className = 'flex items-center gap-2 mt-4 text-xs text-base-content/60';
        legend.innerHTML = `
            <span>Weniger</span>
            <div class="flex gap-1">
                ${[0, 1, 2, 3, 4].map(i => `
                    <div class="w-3 h-3 rounded-sm ${intensityColors[i]}"></div>
                `).join('')}
            </div>
            <span>Mehr</span>
        `;
        
        heatmapContainer.appendChild(legend);
        container.appendChild(heatmapContainer);
    }
    
    /**
     * Generate tooltip for heatmap cell
     */
    generateHeatmapTooltip(cell) {
        if (!cell.data) {
            return `${new Date(cell.date).toLocaleDateString('de-DE')}: Keine Daten`;
        }
        
        const parts = [];
        if (cell.data.steps) parts.push(`${cell.data.steps} Schritte`);
        if (cell.data.waterIntake) parts.push(`${cell.data.waterIntake}L Wasser`);
        if (cell.data.sleepHours) parts.push(`${cell.data.sleepHours}h Schlaf`);
        
        return `${new Date(cell.date).toLocaleDateString('de-DE')}: ${parts.join(', ')}`;
    }
    
    /**
     * Update correlation chart
     */
    async updateCorrelationChart(data) {
        const canvas = document.getElementById('correlation-chart');
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        
        // Destroy existing chart
        if (this.charts.has('correlation')) {
            this.charts.get('correlation').destroy();
        }
        
        const chart = new Chart(ctx, {
            type: 'scatter',
            data: {
                datasets: [{
                    label: 'Schritte vs Schlaf',
                    data: data.map(entry => ({
                        x: entry.steps || 0,
                        y: entry.sleepHours || 0
                    })).filter(point => point.x > 0 && point.y > 0),
                    backgroundColor: 'rgba(99, 102, 241, 0.6)',
                    borderColor: 'rgba(99, 102, 241, 1)',
                    pointRadius: 6,
                    pointHoverRadius: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: (context) => {
                                return `${context.parsed.x.toLocaleString()} Schritte, ${context.parsed.y}h Schlaf`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: 'Schritte'
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'Schlaf (Stunden)'
                        }
                    }
                }
            }
        });
        
        this.charts.set('correlation', chart);
    }
    
    /**
     * Update weekly summary chart
     */
    async updateWeeklySummaryChart(data) {
        const canvas = document.getElementById('weekly-summary-chart');
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        
        // Destroy existing chart
        if (this.charts.has('weekly')) {
            this.charts.get('weekly').destroy();
        }
        
        const weeklyData = this.generateWeeklySummaryData(data);
        
        const chart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: weeklyData.labels,
                datasets: [
                    {
                        label: 'Schritte (Tausend)',
                        data: weeklyData.steps,
                        backgroundColor: 'rgba(34, 197, 94, 0.8)',
                        borderColor: 'rgba(34, 197, 94, 1)',
                        borderWidth: 1,
                        yAxisID: 'y'
                    },
                    {
                        label: 'Wasser (L)',
                        data: weeklyData.water,
                        backgroundColor: 'rgba(59, 130, 246, 0.8)',
                        borderColor: 'rgba(59, 130, 246, 1)',
                        borderWidth: 1,
                        yAxisID: 'y1'
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true,
                        position: 'top'
                    }
                },
                scales: {
                    y: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        title: {
                            display: true,
                            text: 'Schritte (Tausend)'
                        }
                    },
                    y1: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        title: {
                            display: true,
                            text: 'Wasser (L)'
                        },
                        grid: {
                            drawOnChartArea: false
                        }
                    }
                }
            }
        });
        
        this.charts.set('weekly', chart);
    }
    
    /**
     * Generate weekly summary data
     */
    generateWeeklySummaryData(data) {
        const weeks = [];
        const now = new Date();
        
        // Generate last 8 weeks
        for (let i = 7; i >= 0; i--) {
            const weekStart = new Date(now);
            weekStart.setDate(weekStart.getDate() - (i * 7) - weekStart.getDay());
            weekStart.setHours(0, 0, 0, 0);
            
            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekEnd.getDate() + 6);
            weekEnd.setHours(23, 59, 59, 999);
            
            weeks.push({ start: weekStart, end: weekEnd });
        }
        
        const labels = [];
        const stepsData = [];
        const waterData = [];
        
        weeks.forEach(week => {
            const weekData = data.filter(entry => {
                const entryDate = new Date(entry.date);
                return entryDate >= week.start && entryDate <= week.end;
            });
            
            const label = `${week.start.getDate()}.${week.start.getMonth() + 1}`;
            labels.push(label);
            
            const avgSteps = weekData.reduce((sum, entry) => sum + (entry.steps || 0), 0) / (weekData.length || 1);
            const avgWater = weekData.reduce((sum, entry) => sum + (entry.waterIntake || 0), 0) / (weekData.length || 1);
            
            stepsData.push(Math.round(avgSteps / 1000)); // Convert to thousands
            waterData.push(Math.round(avgWater * 10) / 10); // Round to 1 decimal
        });
        
        return { labels, steps: stepsData, water: waterData };
    }
    
    /**
     * Update goal progress chart
     */
    async updateGoalProgressChart(data) {
        const canvas = document.getElementById('goal-progress-chart');
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        
        // Destroy existing chart
        if (this.charts.has('goals')) {
            this.charts.get('goals').destroy();
        }
        
        const goalData = this.generateGoalProgressData(data);
        
        const chart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: goalData.labels,
                datasets: [{
                    data: goalData.values,
                    backgroundColor: [
                        'rgba(34, 197, 94, 0.8)',
                        'rgba(59, 130, 246, 0.8)',
                        'rgba(245, 158, 11, 0.8)'
                    ],
                    borderColor: [
                        'rgba(34, 197, 94, 1)',
                        'rgba(59, 130, 246, 1)',
                        'rgba(245, 158, 11, 1)'
                    ],
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    },
                    tooltip: {
                        callbacks: {
                            label: (context) => {
                                return `${context.label}: ${context.parsed}%`;
                            }
                        }
                    }
                }
            }
        });
        
        this.charts.set('goals', chart);
    }
    
    /**
     * Generate goal progress data
     */
    generateGoalProgressData(data) {
        const today = new Date().toISOString().split('T')[0];
        const todayData = data.find(entry => entry.date === today) || {};
        const goals = this.healthTracker.goals;
        
        const labels = [];
        const values = [];
        
        if (goals.stepsGoal) {
            labels.push('Schritte');
            values.push(Math.min(100, Math.round(((todayData.steps || 0) / goals.stepsGoal) * 100)));
        }
        
        if (goals.waterGoal) {
            labels.push('Wasser');
            values.push(Math.min(100, Math.round(((todayData.waterIntake || 0) / goals.waterGoal) * 100)));
        }
        
        if (goals.sleepGoal) {
            labels.push('Schlaf');
            values.push(Math.min(100, Math.round(((todayData.sleepHours || 0) / goals.sleepGoal) * 100)));
        }
        
        return { labels, values };
    }
    
    /**
     * Update insights based on data analysis
     */
    updateInsights(data) {
        const container = document.getElementById('analytics-insights');
        if (!container) return;
        
        const insights = this.generateInsights(data);
        
        container.innerHTML = insights.map(insight => `
            <div class="alert alert-info">
                <i data-lucide="lightbulb" class="w-5 h-5"></i>
                <span>${insight}</span>
            </div>
        `).join('');
        
        // Re-initialize lucide icons
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }
    
    /**
     * Generate data-driven insights
     */
    generateInsights(data) {
        const insights = [];
        
        if (data.length < 7) {
            insights.push('📊 Sammle mehr Daten für bessere Einblicke (mindestens 7 Tage empfohlen)');
            return insights;
        }
        
        // Weekly averages
        const weeklyData = this.getDataForPeriod(data, 7);
        const averages = this.calculateAverages(weeklyData);
        const goals = this.healthTracker.goals;
        
        // Steps insights
        if (averages.steps >= goals.stepsGoal) {
            insights.push('🚶‍♂️ Ausgezeichnet! Du erreichst konstant dein Schrittziel');
        } else if (averages.steps >= goals.stepsGoal * 0.8) {
            insights.push('👍 Du bist nah an deinem Schrittziel - nur noch etwas mehr!');
        } else {
            insights.push('📈 Versuche täglich mehr Schritte zu gehen');
        }
        
        // Water insights
        if (averages.water >= goals.waterGoal) {
            insights.push('💧 Perfekte Hydration! Du trinkst ausreichend');
        } else {
            insights.push('🥤 Denke daran, mehr Wasser zu trinken');
        }
        
        // Sleep insights
        if (averages.sleep >= goals.sleepGoal) {
            insights.push('😴 Großartig! Du bekommst genug Schlaf');
        } else if (averages.sleep < 6) {
            insights.push('⚠️ Du schläfst zu wenig - das kann deine Gesundheit beeinträchtigen');
        } else {
            insights.push('🌙 Versuche früher ins Bett zu gehen');
        }
        
        // Trend insights
        const trends = this.calculateTrends(data);
        if (trends.steps > 0.1) {
            insights.push('📈 Deine Schritt-Aktivität zeigt einen positiven Trend!');
        }
        
        // Consistency insights
        const consistency = this.calculateConsistency(data);
        if (consistency >= 0.8) {
            insights.push('🔥 Fantastische Tracking-Konstanz!');
        } else if (consistency < 0.5) {
            insights.push('📝 Versuche regelmäßiger deine Daten zu erfassen');
        }
        
        return insights;
    }
    
    /**
     * Update correlation insights
     */
    updateCorrelationInsights(data) {
        const container = document.getElementById('correlation-insights');
        if (!container) return;
        
        const correlations = this.calculateCorrelations(data);
        
        container.innerHTML = correlations.map(correlation => `
            <div class="alert alert-success">
                <i data-lucide="trending-up" class="w-5 h-5"></i>
                <span>${correlation}</span>
            </div>
        `).join('');
        
        // Re-initialize lucide icons
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }
    
    /**
     * Calculate correlations between different metrics
     */
    calculateCorrelations(data) {
        if (data.length < 10) {
            return ['Nicht genug Daten für Korrelationsanalyse (mindestens 10 Einträge benötigt)'];
        }
        
        const correlations = [];
        
        // Steps vs Sleep
        const stepsData = data.map(d => d.steps || 0).filter(v => v > 0);
        const sleepData = data.map(d => d.sleepHours || 0).filter(v => v > 0);
        
        if (stepsData.length >= 5 && sleepData.length >= 5) {
            const correlation = this.pearsonCorrelation(
                data.map(d => d.steps || 0),
                data.map(d => d.sleepHours || 0)
            );
            
            if (Math.abs(correlation) > 0.3) {
                const direction = correlation > 0 ? 'positive' : 'negative';
                const strength = Math.abs(correlation * 100).toFixed(0);
                correlations.push(`🚶‍♂️💤 ${direction} Korrelation zwischen Schritten und Schlaf (${strength}%)`);
            }
        }
        
        // Water vs Mood
        const waterData = data.map(d => d.waterIntake || 0).filter(v => v > 0);
        const moodData = data.filter(d => d.mood).map(d => this.moodToNumber(d.mood));
        
        if (waterData.length >= 5 && moodData.length >= 5) {
            const correlation = this.pearsonCorrelation(
                data.map(d => d.waterIntake || 0),
                data.map(d => this.moodToNumber(d.mood))
            );
            
            if (Math.abs(correlation) > 0.2) {
                const strength = Math.abs(correlation * 100).toFixed(0);
                correlations.push(`💧😊 Wasserzufuhr korreliert mit der Stimmung (${strength}%)`);
            }
        }
        
        // Sleep vs Mood
        if (sleepData.length >= 5 && moodData.length >= 5) {
            const correlation = this.pearsonCorrelation(
                data.map(d => d.sleepHours || 0),
                data.map(d => this.moodToNumber(d.mood))
            );
            
            if (Math.abs(correlation) > 0.2) {
                const strength = Math.abs(correlation * 100).toFixed(0);
                correlations.push(`😴😊 Besserer Schlaf führt zu besserer Stimmung (${strength}%)`);
            }
        }
        
        return correlations.length > 0 ? correlations : ['Keine signifikanten Korrelationen gefunden'];
    }
    
    /**
     * Calculate Pearson correlation coefficient
     */
    pearsonCorrelation(x, y) {
        const n = Math.min(x.length, y.length);
        if (n === 0) return 0;
        
        const xFiltered = x.slice(0, n);
        const yFiltered = y.slice(0, n);
        
        const sumX = xFiltered.reduce((a, b) => a + b, 0);
        const sumY = yFiltered.reduce((a, b) => a + b, 0);
        const sumXY = xFiltered.reduce((sum, xi, i) => sum + xi * yFiltered[i], 0);
        const sumX2 = xFiltered.reduce((sum, xi) => sum + xi * xi, 0);
        const sumY2 = yFiltered.reduce((sum, yi) => sum + yi * yi, 0);
        
        const numerator = n * sumXY - sumX * sumY;
        const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
        
        return denominator === 0 ? 0 : numerator / denominator;
    }
    
    /**
     * Convert mood to numeric value for correlation
     */
    moodToNumber(mood) {
        const moodMap = {
            'terrible': 1,
            'bad': 2,
            'neutral': 3,
            'good': 4,
            'excellent': 5
        };
        return moodMap[mood] || 3;
    }
    
    /**
     * Calculate averages for a dataset
     */
    calculateAverages(data) {
        if (data.length === 0) return { steps: 0, water: 0, sleep: 0 };
        
        const totals = data.reduce((acc, entry) => {
            acc.steps += entry.steps || 0;
            acc.water += entry.waterIntake || 0;
            acc.sleep += entry.sleepHours || 0;
            return acc;
        }, { steps: 0, water: 0, sleep: 0 });
        
        return {
            steps: Math.round(totals.steps / data.length),
            water: Math.round((totals.water / data.length) * 10) / 10,
            sleep: Math.round((totals.sleep / data.length) * 10) / 10
        };
    }
    
    /**
     * Calculate trends in data
     */
    calculateTrends(data) {
        const sortedData = data.sort((a, b) => new Date(a.date) - new Date(b.date));
        
        if (sortedData.length < 4) return { steps: 0, water: 0, sleep: 0 };
        
        const firstHalf = sortedData.slice(0, Math.floor(sortedData.length / 2));
        const secondHalf = sortedData.slice(Math.floor(sortedData.length / 2));
        
        const firstAvg = this.calculateAverages(firstHalf);
        const secondAvg = this.calculateAverages(secondHalf);
        
        return {
            steps: firstAvg.steps > 0 ? (secondAvg.steps - firstAvg.steps) / firstAvg.steps : 0,
            water: firstAvg.water > 0 ? (secondAvg.water - firstAvg.water) / firstAvg.water : 0,
            sleep: firstAvg.sleep > 0 ? (secondAvg.sleep - firstAvg.sleep) / firstAvg.sleep : 0
        };
    }
    
    /**
     * Calculate tracking consistency
     */
    calculateConsistency(data) {
        const totalDays = this.currentPeriod;
        const daysWithData = data.filter(entry => 
            entry.steps || entry.waterIntake || entry.sleepHours || entry.weight
        ).length;
        
        return daysWithData / totalDays;
    }
    
    /**
     * Get metric value from entry
     */
    getMetricValue(entry, metric) {
        switch (metric) {
            case 'steps': return entry.steps || 0;
            case 'water': return entry.waterIntake || 0;
            case 'sleep': return entry.sleepHours || 0;
            case 'weight': return entry.weight || 0;
            default: return 0;
        }
    }
    
    /**
     * Get metric label
     */
    getMetricLabel(metric) {
        const labels = {
            steps: 'Schritte',
            water: 'Wasser (L)',
            sleep: 'Schlaf (Stunden)',
            weight: 'Gewicht (kg)'
        };
        return labels[metric] || metric;
    }
    
    /**
     * Get metric unit
     */
    getMetricUnit(metric) {
        const units = {
            steps: '',
            water: 'L',
            sleep: 'h',
            weight: 'kg'
        };
        return units[metric] || '';
    }
    
    /**
     * Get metric color
     */
    getMetricColor(metric, opacity = 1) {
        const colors = {
            steps: `rgba(34, 197, 94, ${opacity})`,
            water: `rgba(59, 130, 246, ${opacity})`,
            sleep: `rgba(245, 158, 11, ${opacity})`,
            weight: `rgba(168, 85, 247, ${opacity})`
        };
        return colors[metric] || `rgba(156, 163, 175, ${opacity})`;
    }
    
    /**
     * Get goal for metric
     */
    getGoalForMetric(metric) {
        const goals = this.healthTracker.goals;
        switch (metric) {
            case 'steps': return goals.stepsGoal;
            case 'water': return goals.waterGoal;
            case 'sleep': return goals.sleepGoal;
            case 'weight': return goals.weightGoal;
            default: return null;
        }
    }
    
    /**
     * Export analytics data as CSV
     */
    exportAnalyticsData() {
        // Placeholder for export functionality
        this.healthTracker.notificationManager?.showInAppNotification(
            '📊 Export-Funktion wird entwickelt...', 
            'info'
        );
    }
    
    /**
     * Cleanup charts when component is destroyed
     */
    cleanup() {
        this.charts.forEach(chart => {
            chart.destroy();
        });
        this.charts.clear();
    }
}
