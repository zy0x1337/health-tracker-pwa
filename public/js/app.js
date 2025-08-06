/**
 * Minimale Health Tracker App - Neustart
 * Mit bestehender MongoDB-Logik
 */
class HealthTracker {
    constructor() {
        this.userId = this.generateUserId();
        this.isOnline = navigator.onLine;
        this.goals = {
            stepsGoal: 10000,
            waterGoal: 2.0,
            sleepGoal: 8,
            weightGoal: null
        };
        this.initialize();
    }

    /**
     * App initialisieren
     */
    async initialize() {
        console.log('🚀 Health Tracker wird initialisiert...');
        
        try {
            await this.loadUserGoals();
            this.setupEventListeners();
            await this.updateDashboard();
            
            this.showToast('✅ Health Tracker bereit!', 'success');
            console.log('✅ Initialisierung erfolgreich');
        } catch (error) {
            console.error('❌ Initialisierungsfehler:', error);
            this.showToast('⚠️ Offline-Modus aktiv', 'warning');
        }
    }

    /**
     * Event Listeners einrichten
     */
    setupEventListeners() {
        // Formular Submission
        const healthForm = document.getElementById('health-form');
        if (healthForm) {
            healthForm.addEventListener('submit', this.handleFormSubmission.bind(this));
        }

        // Ziele Formular
        const goalsForm = document.getElementById('goals-form');
        if (goalsForm) {
            goalsForm.addEventListener('submit', this.handleGoalsSubmission.bind(this));
        }

        // Online/Offline Status
        window.addEventListener('online', () => {
            this.isOnline = true;
            this.showToast('🌐 Online', 'success');
        });
        
        window.addEventListener('offline', () => {
            this.isOnline = false;
            this.showToast('📵 Offline', 'warning');
        });
    }

    /**
     * Gesundheitsdaten Formular verarbeiten
     */
    async handleFormSubmission(event) {
        event.preventDefault();
        
        try {
            const formData = this.extractFormData(event.target);
            const success = await this.saveHealthData(formData);
            
            if (success) {
                this.showToast('✅ Daten gespeichert!', 'success');
                event.target.reset();
                await this.updateDashboard();
            }
        } catch (error) {
            console.error('❌ Speichern fehlgeschlagen:', error);
            this.showToast('❌ Fehler beim Speichern', 'error');
        }
    }

    /**
     * Ziele Formular verarbeiten
     */
    async handleGoalsSubmission(event) {
        event.preventDefault();
        
        try {
            const goalsData = this.extractGoalsData(event.target);
            const success = await this.saveUserGoals(goalsData);
            
            if (success) {
                this.goals = { ...this.goals, ...goalsData };
                this.showToast('✅ Ziele aktualisiert!', 'success');
                await this.updateDashboard();
            }
        } catch (error) {
            console.error('❌ Ziele speichern fehlgeschlagen:', error);
            this.showToast('❌ Fehler beim Speichern der Ziele', 'error');
        }
    }

    /**
     * Formulardaten extrahieren
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
            notes: formData.get('notes')?.trim() || null
        };
    }

    /**
     * Ziele-Daten extrahieren
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
     * Gesundheitsdaten speichern (MongoDB)
     */
    async saveHealthData(data) {
        try {
            // Lokal speichern
            this.saveToLocalStorage(data);

            // Server speichern wenn online
            if (this.isOnline) {
                const response = await this.makeAPICall('/api/health-data', {
                    method: 'POST',
                    body: JSON.stringify(data)
                });
                return response.success;
            }
            return true;
        } catch (error) {
            console.error('❌ Speichern fehlgeschlagen:', error);
            return false;
        }
    }

    /**
     * Benutzerziele laden (MongoDB)
     */
    async loadUserGoals() {
        try {
            if (this.isOnline) {
                const goals = await this.makeAPICall(`/api/goals/${this.userId}`);
                if (goals && Object.keys(goals).length > 1) {
                    this.goals = { ...this.goals, ...goals };
                }
            }
            
            // Fallback zu localStorage
            const localGoals = localStorage.getItem('userGoals');
            if (localGoals) {
                this.goals = { ...this.goals, ...JSON.parse(localGoals) };
            }
        } catch (error) {
            console.error('❌ Ziele laden fehlgeschlagen:', error);
        }
    }

    /**
     * Benutzerziele speichern (MongoDB)
     */
    async saveUserGoals(goalsData) {
        try {
            // Lokal speichern
            localStorage.setItem('userGoals', JSON.stringify(goalsData));

            // Server speichern wenn online
            if (this.isOnline) {
                const response = await this.makeAPICall('/api/goals', {
                    method: 'POST',
                    body: JSON.stringify(goalsData)
                });
                return response.success;
            }
            return true;
        } catch (error) {
            console.error('❌ Ziele speichern fehlgeschlagen:', error);
            return false;
        }
    }

    /**
     * Dashboard aktualisieren
     */
    async updateDashboard() {
        try {
            const data = await this.getAllHealthData();
            const todayData = this.getTodayData(data);

            // Heutige Werte anzeigen
            this.updateElement('today-weight', todayData.weight, 'kg');
            this.updateElement('today-steps', todayData.steps, '');
            this.updateElement('today-water', todayData.waterIntake, 'L');
            this.updateElement('today-sleep', todayData.sleepHours, 'h');

            // Fortschritt berechnen
            this.updateProgress(todayData);
        } catch (error) {
            console.error('❌ Dashboard Update fehlgeschlagen:', error);
        }
    }

    /**
     * Element aktualisieren
     */
    updateElement(elementId, value, unit) {
        const element = document.getElementById(elementId);
        if (element) {
            const displayValue = value ? value.toLocaleString('de-DE') : '—';
            element.textContent = `${displayValue}${unit}`;
        }
    }

    /**
     * Fortschritt aktualisieren
     */
    updateProgress(todayData) {
        if (todayData.steps && this.goals.stepsGoal) {
            const progress = Math.min((todayData.steps / this.goals.stepsGoal) * 100, 100);
            this.updateProgressBar('steps-progress', progress);
        }
        
        if (todayData.waterIntake && this.goals.waterGoal) {
            const progress = Math.min((todayData.waterIntake / this.goals.waterGoal) * 100, 100);
            this.updateProgressBar('water-progress', progress);
        }
    }

    /**
     * Fortschrittsbalken aktualisieren
     */
    updateProgressBar(elementId, progress) {
        const element = document.getElementById(elementId);
        if (element) {
            element.style.setProperty('--value', Math.round(progress));
            element.textContent = Math.round(progress) + '%';
        }
    }

    /**
     * Alle Gesundheitsdaten abrufen (MongoDB)
     */
    async getAllHealthData() {
        try {
            if (this.isOnline) {
                return await this.makeAPICall(`/api/health-data/${this.userId}`);
            }
            
            // Fallback zu localStorage
            const localData = localStorage.getItem('healthData');
            return localData ? JSON.parse(localData) : [];
        } catch (error) {
            console.error('❌ Daten laden fehlgeschlagen:', error);
            return [];
        }
    }

    /**
     * Heutige Daten finden
     */
    getTodayData(allData) {
        const today = new Date().toISOString().split('T')[0];
        return allData.find(entry => entry.date === today) || {};
    }

    /**
     * API Aufruf durchführen
     */
    async makeAPICall(endpoint, options = {}) {
        const defaultOptions = {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
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
            throw error;
        }
    }

    /**
     * Lokal speichern
     */
    saveToLocalStorage(data) {
        try {
            const existingData = JSON.parse(localStorage.getItem('healthData') || '[]');
            const dataWithMetadata = {
                ...data,
                _localId: 'local_' + Date.now(),
                _synced: false,
                _createdAt: new Date().toISOString()
            };
            
            existingData.push(dataWithMetadata);
            localStorage.setItem('healthData', JSON.stringify(existingData.slice(-100)));
        } catch (error) {
            console.error('❌ localStorage Fehler:', error);
        }
    }

    /**
     * Toast Nachricht anzeigen
     */
    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        const bgClass = {
            success: 'bg-green-500',
            error: 'bg-red-500',
            warning: 'bg-yellow-500',
            info: 'bg-blue-500'
        }[type] || 'bg-gray-500';

        toast.className = `fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg text-white ${bgClass}`;
        toast.textContent = message;
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.style.transform = 'translateY(-100%)';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    /**
     * Benutzer-ID generieren
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
     * Sichere Zahlen-Parsing
     */
    parseNumber(value) {
        if (!value || value === '') return null;
        const num = parseFloat(value);
        return isNaN(num) ? null : num;
    }

    parseInt(value) {
        if (!value || value === '') return null;
        const num = parseInt(value, 10);
        return isNaN(num) ? null : num;
    }
}

// App initialisieren
document.addEventListener('DOMContentLoaded', () => {
    window.healthTracker = new HealthTracker();
});
