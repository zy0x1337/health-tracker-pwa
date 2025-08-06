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

    async initializeGoals() {
    const goals = this.getLocalGoals();
    this.renderGoals(goals);
}

getLocalGoals() {
    try {
        const goals = localStorage.getItem('healthTracker_goals');
        return goals ? JSON.parse(goals) : [];
    } catch (error) {
        console.error('Fehler beim Laden der Ziele:', error);
        return [];
    }
}

saveLocalGoals(goals) {
    try {
        localStorage.setItem('healthTracker_goals', JSON.stringify(goals));
        return true;
    } catch (error) {
        console.error('Fehler beim Speichern der Ziele:', error);
        this.showToast('Fehler beim Speichern der Ziele', 'error');
        return false;
    }
}

async addGoal(goalData) {
    try {
        const goals = this.getLocalGoals();
        
        const newGoal = {
            id: Date.now().toString(),
            type: goalData.type,
            description: goalData.description,
            target: parseFloat(goalData.target),
            unit: goalData.unit,
            deadline: goalData.deadline,
            progress: 0,
            completed: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        goals.push(newGoal);
        
        if (this.saveLocalGoals(goals)) {
            this.renderGoals(goals);
            this.showToast('Ziel erfolgreich hinzugefügt', 'success');
            document.getElementById('goal-form').reset();
            document.getElementById('goal-form-toggle').checked = false;
        }
    } catch (error) {
        console.error('Fehler beim Hinzufügen des Ziels:', error);
        this.showToast('Fehler beim Hinzufügen des Ziels', 'error');
    }
}

async updateGoalProgress(goalId, newProgress) {
    try {
        const goals = this.getLocalGoals();
        const goalIndex = goals.findIndex(goal => goal.id === goalId);
        
        if (goalIndex !== -1) {
            goals[goalIndex].progress = Math.min(newProgress, goals[goalIndex].target);
            goals[goalIndex].completed = goals[goalIndex].progress >= goals[goalIndex].target;
            goals[goalIndex].updatedAt = new Date().toISOString();
            
            if (this.saveLocalGoals(goals)) {
                this.renderGoals(goals);
                
                if (goals[goalIndex].completed && !goals[goalIndex].wasCompletedBefore) {
                    goals[goalIndex].wasCompletedBefore = true;
                    this.saveLocalGoals(goals);
                    this.showToast('🎉 Ziel erreicht! Glückwunsch!', 'success');
                }
            }
        }
    } catch (error) {
        console.error('Fehler beim Aktualisieren des Fortschritts:', error);
        this.showToast('Fehler beim Aktualisieren des Fortschritts', 'error');
    }
}

async deleteGoal(goalId) {
    try {
        const goals = this.getLocalGoals();
        const filteredGoals = goals.filter(goal => goal.id !== goalId);
        
        if (this.saveLocalGoals(filteredGoals)) {
            this.renderGoals(filteredGoals);
            this.showToast('Ziel gelöscht', 'info');
        }
    } catch (error) {
        console.error('Fehler beim Löschen des Ziels:', error);
        this.showToast('Fehler beim Löschen des Ziels', 'error');
    }
}

renderGoals(goals) {
    const goalsList = document.getElementById('goals-list');
    
    if (!goals || goals.length === 0) {
        goalsList.innerHTML = `
            <div class="alert alert-info">
                <svg class="w-6 h-6 stroke-current shrink-0" fill="none" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                <span>Noch keine Ziele definiert. Füge dein erstes Gesundheitsziel hinzu!</span>
            </div>
        `;
        return;
    }
    
    goalsList.innerHTML = goals.map(goal => {
        const progressPercent = goal.target > 0 ? Math.round((goal.progress / goal.target) * 100) : 0;
        const isOverdue = goal.deadline && new Date(goal.deadline) < new Date() && !goal.completed;
        const statusClass = goal.completed ? 'badge-success' : isOverdue ? 'badge-error' : 'badge-warning';
        const statusText = goal.completed ? 'Erreicht' : isOverdue ? 'Überfällig' : 'In Bearbeitung';
        
        return `
            <div class="card bg-base-200 shadow-sm">
                <div class="card-body p-4">
                    <div class="flex justify-between items-start mb-3">
                        <div>
                            <h3 class="font-semibold text-lg">${goal.description}</h3>
                            <div class="badge ${statusClass} mt-1">${statusText}</div>
                        </div>
                        <div class="dropdown dropdown-end">
                            <label tabindex="0" class="btn btn-ghost btn-sm">
                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"></path>
                                </svg>
                            </label>
                            <ul tabindex="0" class="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52">
                                <li><a onclick="healthTracker.editGoalProgress('${goal.id}')">Fortschritt aktualisieren</a></li>
                                <li><a onclick="healthTracker.deleteGoal('${goal.id}')" class="text-error">Löschen</a></li>
                            </ul>
                        </div>
                    </div>
                    
                    <div class="mb-3">
                        <div class="flex justify-between text-sm mb-1">
                            <span>Fortschritt</span>
                            <span>${goal.progress} / ${goal.target} ${goal.unit}</span>
                        </div>
                        <progress class="progress progress-primary w-full" value="${progressPercent}" max="100"></progress>
                        <div class="text-center text-sm text-base-content/70 mt-1">${progressPercent}%</div>
                    </div>
                    
                    ${goal.deadline ? `
                        <div class="text-sm text-base-content/70">
                            <span class="font-medium">Ziel bis:</span> ${new Date(goal.deadline).toLocaleDateString('de-DE')}
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }).join('');
}

async editGoalProgress(goalId) {
    const goals = this.getLocalGoals();
    const goal = goals.find(g => g.id === goalId);
    
    if (!goal) return;
    
    const newProgress = prompt(`Fortschritt für "${goal.description}" aktualisieren:\n\nAktuell: ${goal.progress} ${goal.unit}\nZiel: ${goal.target} ${goal.unit}`, goal.progress);
    
    if (newProgress !== null && !isNaN(newProgress)) {
        await this.updateGoalProgress(goalId, parseFloat(newProgress));
    }
}

    /**
     * Event Listeners einrichten
     */
    setupEventListeners() {
    // Health Data Form Event Handler
    const healthForm = document.getElementById('health-form');
    if (healthForm) {
        healthForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const formData = {
                date: document.getElementById('date').value,
                weight: document.getElementById('weight').value,
                bloodPressureSys: document.getElementById('bloodPressureSys').value,
                bloodPressureDia: document.getElementById('bloodPressureDia').value,
                heartRate: document.getElementById('heartRate').value,
                steps: document.getElementById('steps').value,
                sleep: document.getElementById('sleep').value,
                notes: document.getElementById('notes').value
            };
            
            // Validation
            if (!formData.date) {
                this.showToast('Bitte ein Datum auswählen', 'warning');
                return;
            }
            
            await this.addHealthData(formData);
        });
    }

    // Goal Form Event Handler (NEU)
    const goalForm = document.getElementById('goal-form');
    if (goalForm) {
        goalForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const goalData = {
                type: document.getElementById('goal-type').value,
                description: document.getElementById('goal-description').value,
                target: document.getElementById('goal-target').value,
                unit: document.getElementById('goal-unit').value,
                deadline: document.getElementById('goal-deadline').value
            };
            
            // Validation
            if (!goalData.description.trim() || !goalData.target || !goalData.unit.trim()) {
                this.showToast('Bitte alle Pflichtfelder ausfüllen', 'warning');
                return;
            }
            
            await this.addGoal(goalData);
        });
    }

    // Auto-fill unit based on goal type (NEU)
    const goalTypeSelect = document.getElementById('goal-type');
    if (goalTypeSelect) {
        goalTypeSelect.addEventListener('change', (e) => {
            const unitField = document.getElementById('goal-unit');
            const targetField = document.getElementById('goal-target');
            
            const unitMap = {
                'weight': 'kg',
                'steps': 'Schritte',
                'exercise': 'Einheiten/Woche',
                'water': 'Liter',
                'sleep': 'Stunden',
                'custom': ''
            };
            
            const targetMap = {
                'weight': '',
                'steps': '10000',
                'exercise': '3',
                'water': '2.5',
                'sleep': '8',
                'custom': ''
            };
            
            if (unitMap[e.target.value]) {
                unitField.value = unitMap[e.target.value];
            }
            
            if (targetMap[e.target.value]) {
                targetField.value = targetMap[e.target.value];
            }
        });
    }

    // Date Input - Default to today
    const dateInput = document.getElementById('date');
    if (dateInput && !dateInput.value) {
        dateInput.value = new Date().toISOString().split('T')[0];
    }

    // Refresh Button Event Handler
    const refreshBtn = document.getElementById('refresh-btn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', async () => {
            refreshBtn.disabled = true;
            refreshBtn.innerHTML = '<span class="loading loading-spinner loading-sm"></span> Laden...';
            
            await this.loadHealthData();
            
            refreshBtn.disabled = false;
            refreshBtn.innerHTML = '🔄 Aktualisieren';
        });
    }

    // Export Button Event Handler
    const exportBtn = document.getElementById('export-btn');
    if (exportBtn) {
        exportBtn.addEventListener('click', () => {
            this.exportData();
        });
    }

    // Theme Toggle Event Handler (falls vorhanden)
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            this.toggleTheme();
        });
    }

    // Search/Filter Event Handler (falls vorhanden)
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            this.filterHealthData(e.target.value);
        });
    }

    // Keyboard Shortcuts
    document.addEventListener('keydown', (e) => {
        // Ctrl/Cmd + S = Save current form
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            e.preventDefault();
            const activeForm = document.querySelector('form:focus-within') || 
                              document.getElementById('health-form') || 
                              document.getElementById('goal-form');
            if (activeForm) {
                activeForm.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
            }
        }
        
        // Ctrl/Cmd + R = Refresh data
        if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
            e.preventDefault();
            this.loadHealthData();
        }
    });

    // Form Auto-Save (Optional - für bessere UX)
    const autoSaveInputs = document.querySelectorAll('#health-form input, #health-form textarea, #goal-form input, #goal-form select');
    autoSaveInputs.forEach(input => {
        input.addEventListener('blur', () => {
            this.saveFormDraft(input.closest('form'));
        });
    });

    // Online/Offline Status Handler
    window.addEventListener('online', () => {
        this.showToast('Verbindung wiederhergestellt', 'success');
        this.syncOfflineData();
    });

    window.addEventListener('offline', () => {
        this.showToast('Offline-Modus aktiviert', 'info');
    });

    // Page Visibility API - Sync when page becomes visible
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden && navigator.onLine) {
            this.loadHealthData();
        }
    });

    // Responsive Navigation Toggle (falls vorhanden)
    const navToggle = document.getElementById('nav-toggle');
    if (navToggle) {
        navToggle.addEventListener('click', () => {
            const navMenu = document.getElementById('nav-menu');
            if (navMenu) {
                navMenu.classList.toggle('hidden');
            }
        });
    }

    // Close Toast Messages on Click
    document.addEventListener('click', (e) => {
        if (e.target.closest('.alert .btn-close')) {
            e.target.closest('.alert').remove();
        }
    });

    console.log('✅ Event Listeners erfolgreich initialisiert');
}

saveFormDraft(form) {
    if (!form) return;
    
    const formData = new FormData(form);
    const draftData = {};
    
    for (let [key, value] of formData.entries()) {
        draftData[key] = value;
    }
    
    const draftKey = `healthTracker_draft_${form.id}`;
    localStorage.setItem(draftKey, JSON.stringify(draftData));
}

loadFormDraft(formId) {
    const draftKey = `healthTracker_draft_${formId}`;
    const draft = localStorage.getItem(draftKey);
    
    if (draft) {
        try {
            const draftData = JSON.parse(draft);
            const form = document.getElementById(formId);
            
            if (form) {
                Object.keys(draftData).forEach(key => {
                    const field = form.querySelector(`[name="${key}"]`);
                    if (field && draftData[key]) {
                        field.value = draftData[key];
                    }
                });
            }
        } catch (error) {
            console.error('Fehler beim Laden des Entwurfs:', error);
        }
    }
}

clearFormDraft(formId) {
    const draftKey = `healthTracker_draft_${formId}`;
    localStorage.removeItem(draftKey);
}

toggleTheme() {
    const html = document.documentElement;
    const currentTheme = html.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    html.setAttribute('data-theme', newTheme);
    localStorage.setItem('healthTracker_theme', newTheme);
    
    this.showToast(`${newTheme === 'dark' ? '🌙' : '☀️'} Theme geändert`, 'info');
}

filterHealthData(query) {
    const healthEntries = document.querySelectorAll('.health-entry');
    
    healthEntries.forEach(entry => {
        const text = entry.textContent.toLowerCase();
        const matches = text.includes(query.toLowerCase());
        entry.style.display = matches ? 'block' : 'none';
    });
}

exportData() {
    try {
        const healthData = this.getOfflineData();
        const goals = this.getLocalGoals();
        
        const exportData = {
            healthData,
            goals,
            exportDate: new Date().toISOString(),
            version: '1.0'
        };
        
        const blob = new Blob([JSON.stringify(exportData, null, 2)], {
            type: 'application/json'
        });
        
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `health-tracker-export-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        this.showToast('Daten erfolgreich exportiert', 'success');
    } catch (error) {
        console.error('Export Fehler:', error);
        this.showToast('Fehler beim Exportieren', 'error');
    }
}

async syncOfflineData() {
    // Diese Methode wird später für die Synchronisation der Offline-Daten implementiert
    console.log('Synchronisation der Offline-Daten...');
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
