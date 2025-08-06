// REPLACE ENTIRE app.js FILE WITH THIS OPTIMIZED VERSION:

class HealthTracker {
    constructor() {
        this.apiBaseUrl = '/.netlify/functions';
        this.isOnline = navigator.onLine;
        this.currentTab = 'dashboard';
        this.themes = ['light', 'dark', 'cupcake', 'bumblebee', 'emerald', 'corporate', 'synthwave', 'retro', 'cyberpunk', 'valentine', 'halloween', 'garden', 'forest', 'aqua', 'lofi', 'pastel', 'fantasy', 'wireframe', 'black', 'luxury', 'dracula', 'cmyk', 'autumn', 'business', 'acid', 'lemonade', 'night', 'coffee', 'winter'];
        this.achievements = [
            { id: 'first-entry', name: 'Erster Eintrag', icon: 'fas fa-star', condition: (data) => data.length >= 1 },
            { id: 'week-streak', name: '7-Tage Streak', icon: 'fas fa-fire', condition: (data) => this.calculateStreak(data) >= 7 },
            { id: 'steps-master', name: 'Schritt-Meister', icon: 'fas fa-walking', condition: (data) => data.some(d => d.steps >= 15000) },
            { id: 'hydration-hero', name: 'Hydration Hero', icon: 'fas fa-tint', condition: (data) => data.some(d => d.water >= 3) }
        ];
    }

    async initialize() {
        this.initializeTheme();
        this.setupEventListeners();
        this.updateSyncStatus();
        this.setCurrentDate();
        await this.loadGoalsFromStorage();
        await this.updateDashboard();
        this.updateTodayStats();
        this.updateTodayEntry();
        this.showToast('Willkommen zurück!', 'success');
    }

    initializeTheme() {
        // Theme initialization with system preference
        const savedTheme = localStorage.getItem('health-tracker-theme');
        const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        const theme = savedTheme || systemTheme;
        
        document.documentElement.setAttribute('data-theme', theme);
        
        // Update theme toggle
        const themeToggle = document.querySelector('.theme-controller');
        if (themeToggle) {
            themeToggle.checked = theme === 'dark';
        }

        // Listen for system theme changes
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
            if (!localStorage.getItem('health-tracker-theme')) {
                const newTheme = e.matches ? 'dark' : 'light';
                document.documentElement.setAttribute('data-theme', newTheme);
                const themeToggle = document.querySelector('.theme-controller');
                if (themeToggle) {
                    themeToggle.checked = newTheme === 'dark';
                }
            }
        });
    }

    setupEventListeners() {
        // Theme toggle
        const themeToggle = document.querySelector('.theme-controller');
        if (themeToggle) {
            themeToggle.addEventListener('change', (e) => {
                const theme = e.target.checked ? 'dark' : 'light';
                document.documentElement.setAttribute('data-theme', theme);
                localStorage.setItem('health-tracker-theme', theme);
                this.showToast(`${theme === 'dark' ? 'Dunkler' : 'Heller'} Modus aktiviert`, 'info');
            });
        }

        // Tab navigation
        document.querySelectorAll('.tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                e.preventDefault();
                const targetTab = tab.getAttribute('data-tab');
                this.switchTab(targetTab);
            });
        });

        // Navigation links
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const targetTab = link.getAttribute('href').substring(1);
                this.switchTab(targetTab);
            });
        });

        // Form submissions
        const healthForm = document.getElementById('health-form');
        if (healthForm) {
            healthForm.addEventListener('submit', this.handleFormSubmission.bind(this));
        }

        const goalsForm = document.getElementById('goals-form');
        if (goalsForm) {
            goalsForm.addEventListener('submit', this.handleGoalsSubmission.bind(this));
        }

        // Online/offline detection
        window.addEventListener('online', () => {
            this.isOnline = true;
            this.updateSyncStatus();
            this.syncOfflineData();
        });

        window.addEventListener('offline', () => {
            this.isOnline = false;
            this.updateSyncStatus();
        });

        // Auto-set today's date
        const dateInput = document.getElementById('date');
        if (dateInput) {
            dateInput.value = new Date().toISOString().split('T')[0];
        }
    }

    switchTab(tabName) {
        // Update tab navigation
        document.querySelectorAll('.tab').forEach(tab => {
            tab.classList.remove('tab-active');
        });
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('tab-active');

        // Show/hide content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.add('hidden');
        });
        document.getElementById(`${tabName}-content`).classList.remove('hidden');

        this.currentTab = tabName;

        // Update content based on tab
        if (tabName === 'today-stats') {
            this.updateTodayStats();
            this.updateTodayEntry();
        } else if (tabName === 'dashboard') {
            this.updateDashboard();
        }
    }

    setCurrentDate() {
        const currentDateElement = document.getElementById('current-date');
        if (currentDateElement) {
            const today = new Date();
            currentDateElement.textContent = today.toLocaleDateString('de-DE', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            });
        }
    }

    updateSyncStatus() {
        const syncStatus = document.getElementById('sync-status');
        if (syncStatus) {
            if (this.isOnline) {
                syncStatus.innerHTML = '<i class="fas fa-cloud text-success mr-1"></i>Online';
                syncStatus.className = 'badge badge-outline badge-success';
            } else {
                syncStatus.innerHTML = '<i class="fas fa-cloud-offline text-error mr-1"></i>Offline';
                syncStatus.className = 'badge badge-outline badge-error';
            }
        }
    }

    async handleFormSubmission(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const healthData = {
            date: formData.get('date'),
            weight: formData.get('weight') ? parseFloat(formData.get('weight')) : null,
            steps: formData.get('steps') ? parseInt(formData.get('steps')) : null,
            water: formData.get('water') ? parseFloat(formData.get('water')) : null,
            sleep: formData.get('sleep') ? parseFloat(formData.get('sleep')) : null,
            mood: formData.get('mood') || null,
            notes: formData.get('notes') || null
        };

        try {
            await this.saveHealthData(healthData);
            this.showToast('Gesundheitsdaten erfolgreich gespeichert!', 'success');
            e.target.reset();
            document.getElementById('date').value = new Date().toISOString().split('T')[0];
            
            // Update dashboard and today stats
            await this.updateDashboard();
            this.updateTodayStats();
            this.updateTodayEntry();
            
        } catch (error) {
            console.error('Error saving health data:', error);
            this.showToast('Fehler beim Speichern der Daten', 'error');
        }
    }

    async handleGoalsSubmission(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const goals = {
            steps: formData.get('steps') ? parseInt(formData.get('steps')) : null,
            water: formData.get('water') ? parseFloat(formData.get('water')) : null,
            sleep: formData.get('sleep') ? parseFloat(formData.get('sleep')) : null,
            weight: formData.get('weight') ? parseFloat(formData.get('weight')) : null
        };

        try {
            this.saveGoalsToStorage(goals);
            this.showToast('Ziele erfolgreich gespeichert!', 'success');
            await this.updateDashboard();
            this.updateTodayStats();
        } catch (error) {
            console.error('Error saving goals:', error);
            this.showToast('Fehler beim Speichern der Ziele', 'error');
        }
    }

    async saveHealthData(data) {
        if (this.isOnline) {
            try {
                const response = await fetch(`${this.apiBaseUrl}/health-data`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });

                if (!response.ok) throw new Error('Network response was not ok');
                return await response.json();
            } catch (error) {
                console.error('Online save failed, saving offline:', error);
                this.saveToLocalStorage(data);
                throw error;
            }
        } else {
            this.saveToLocalStorage(data);
        }
    }

    saveToLocalStorage(data) {
        let offlineData = JSON.parse(localStorage.getItem('offlineHealthData') || '[]');
        offlineData.push({ ...data, _offline: true, _timestamp: Date.now() });
        localStorage.setItem('offlineHealthData', JSON.stringify(offlineData));
    }

    async getAllHealthData() {
        if (this.isOnline) {
            try {
                const response = await fetch(`${this.apiBaseUrl}/health-data`);
                if (response.ok) {
                    return await response.json();
                }
            } catch (error) {
                console.error('Failed to fetch online data:', error);
            }
        }
        
        // Fallback to localStorage
        return JSON.parse(localStorage.getItem('healthData') || '[]');
    }

    saveGoalsToStorage(goals) {
        localStorage.setItem('healthGoals', JSON.stringify(goals));
    }

    getGoalFromStorage(type) {
        try {
            const goals = JSON.parse(localStorage.getItem('healthGoals') || '{}');
            return goals[type] || null;
        } catch {
            return null;
        }
    }

    async loadGoalsFromStorage() {
        try {
            const goals = JSON.parse(localStorage.getItem('healthGoals') || '{}');
            
            Object.keys(goals).forEach(key => {
                const input = document.getElementById(`goal-${key}`);
                if (input && goals[key]) {
                    input.value = goals[key];
                }
            });
        } catch (error) {
            console.error('Error loading goals:', error);
        }
    }

    async updateDashboard() {
        try {
            const allData = await this.getAllHealthData();
            
            // Update quick stats
            this.updateQuickStats(allData);
            
            // Update weekly chart
            await this.updateWeeklyStepsChart();
            
            // Update achievements
            this.updateAchievements(allData);
            
        } catch (error) {
            console.error('Error updating dashboard:', error);
        }
    }

    updateQuickStats(allData) {
        const today = new Date().toISOString().split('T')[0];
        const todayData = allData.find(entry => 
            new Date(entry.date).toISOString().split('T')[0] === today
        ) || {};

        // Steps
        const steps = todayData.steps || 0;
        const stepsGoal = this.getGoalFromStorage('steps') || 10000;
        const stepsProgress = Math.min((steps / stepsGoal) * 100, 100);
        
        document.getElementById('today-steps').textContent = steps.toLocaleString();
        document.getElementById('steps-progress').textContent = `${Math.round(stepsProgress)}% vom Ziel (${stepsGoal.toLocaleString()})`;

        // Water
        const water = todayData.water || 0;
        const waterGoal = this.getGoalFromStorage('water') || 2.5;
        const waterProgress = Math.min((water / waterGoal) * 100, 100);
        
        document.getElementById('today-water').textContent = water.toFixed(1);
        document.getElementById('water-progress').textContent = `${Math.round(waterProgress)}% vom Ziel (${waterGoal}L)`;

        // Sleep
        const sleep = todayData.sleep || 0;
        const sleepGoal = this.getGoalFromStorage('sleep') || 8;
        const sleepProgress = Math.min((sleep / sleepGoal) * 100, 100);
        
        document.getElementById('today-sleep').textContent = sleep.toFixed(1);
        document.getElementById('sleep-progress').textContent = `${Math.round(sleepProgress)}% vom Ziel (${sleepGoal}h)`;

        // Weight
        const weight = todayData.weight;
        const weightGoal = this.getGoalFromStorage('weight');
        
        if (weight) {
            document.getElementById('today-weight').textContent = weight.toFixed(1);
            if (weightGoal) {
                const diff = weight - weightGoal;
                const trend = diff > 0 ? `+${diff.toFixed(1)}kg zum Ziel` : `${diff.toFixed(1)}kg zum Ziel`;
                document.getElementById('weight-trend').textContent = trend;
            } else {
                document.getElementById('weight-trend').textContent = 'Kein Ziel gesetzt';
            }
        } else {
            document.getElementById('today-weight').textContent = '--';
            document.getElementById('weight-trend').textContent = 'Keine Daten';
        }
    }

    async updateWeeklyStepsChart() {
        try {
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
            
            const allData = await this.getAllHealthData();
            const weekData = allData.filter(entry => {
                const entryDate = new Date(entry.date);
                return entryDate >= sevenDaysAgo;
            });

            const chartData = [];
            for (let i = 6; i >= 0; i--) {
                const date = new Date();
                date.setDate(date.getDate() - i);
                const dateStr = date.toISOString().split('T')[0];
                
                const dayData = weekData.find(entry => 
                    new Date(entry.date).toISOString().split('T')[0] === dateStr
                );
                
                const steps = dayData?.steps || 0;
                const goal = this.getGoalFromStorage('steps') || 10000;
                const percentage = Math.min((steps / goal) * 100, 100);
                
                chartData.push({
                    day: date.toLocaleDateString('de-DE', { weekday: 'short' }),
                    steps: steps,
                    goal: goal,
                    percentage: percentage,
                    achieved: steps >= goal
                });
            }

            this.renderWeeklyChart(chartData);
        } catch (error) {
            console.error('Fehler beim Laden der Wochendaten:', error);
        }
    }

    renderWeeklyChart(data) {
        const chartContainer = document.getElementById('weekly-steps-chart');
        if (!chartContainer) return;

        chartContainer.innerHTML = `
            <div class="stats stats-vertical lg:stats-horizontal shadow bg-base-100">
                ${data.map(day => `
                    <div class="stat ${day.achieved ? 'bg-success/10' : 'bg-base-100'}">
                        <div class="stat-figure text-primary">
                            ${day.achieved ? 
                                '<svg class="w-6 h-6 text-success" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path></svg>' : 
                                '<svg class="w-6 h-6 opacity-40" fill="currentColor" viewBox="0 0 20 20"><path d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"></path></svg>'
                            }
                        </div>
                        <div class="stat-title text-sm">${day.day}</div>
                        <div class="stat-value text-lg ${day.achieved ? 'text-success' : ''}">${day.steps.toLocaleString()}</div>
                        <div class="stat-desc">
                            <div class="text-xs mb-1">Ziel: ${day.goal.toLocaleString()}</div>
                            <progress class="progress ${day.achieved ? 'progress-success' : 'progress-primary'} w-20 h-2" value="${day.percentage}" max="100"></progress>
                            <div class="text-xs mt-1">${Math.round(day.percentage)}%</div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    updateAchievements(allData) {
        const achievementsContainer = document.getElementById('achievements');
        if (!achievementsContainer) return;

        const earnedAchievements = this.achievements.filter(achievement => 
            achievement.condition(allData)
        );

        if (earnedAchievements.length === 0) {
            achievementsContainer.innerHTML = '<div class="text-base-content/60">Noch keine Erfolge. Weiter so!</div>';
            return;
        }

        achievementsContainer.innerHTML = earnedAchievements.map(achievement => `
            <div class="badge badge-lg badge-success gap-2">
                <i class="${achievement.icon}"></i>
                ${achievement.name}
            </div>
        `).join('');
    }

    calculateStreak(data) {
        if (!data.length) return 0;
        
        const sortedData = data.sort((a, b) => new Date(b.date) - new Date(a.date));
        let streak = 0;
        let currentDate = new Date();
        
        for (const entry of sortedData) {
            const entryDate = new Date(entry.date);
            const daysDiff = Math.floor((currentDate - entryDate) / (1000 * 60 * 60 * 24));
            
            if (daysDiff === streak) {
                streak++;
                currentDate = entryDate;
            } else {
                break;
            }
        }
        
        return streak;
    }

    async updateTodayStats() {
        try {
            const allData = await this.getAllHealthData();
            const today = new Date().toISOString().split('T')[0];
            const todayData = allData.find(entry => 
                new Date(entry.date).toISOString().split('T')[0] === today
            );

            this.updateQuickStats(allData);
        } catch (error) {
            console.error('Error updating today stats:', error);
        }
    }

    async updateTodayEntry() {
        try {
            const allData = await this.getAllHealthData();
            const today = new Date().toISOString().split('T')[0];
            const todayData = allData.find(entry => 
                new Date(entry.date).toISOString().split('T')[0] === today
            );

            const entryDetails = document.getElementById('today-entry-details');
            const moodNotes = document.getElementById('today-mood-notes');

            if (todayData) {
                // Entry details
                entryDetails.innerHTML = `
                    <div class="grid grid-cols-2 gap-4">
                        <div class="stat bg-base-200 rounded-lg p-3">
                            <div class="stat-title text-sm">Schritte</div>
                            <div class="stat-value text-primary">${(todayData.steps || 0).toLocaleString()}</div>
                        </div>
                        <div class="stat bg-base-200 rounded-lg p-3">
                            <div class="stat-title text-sm">Wasser</div>
                            <div class="stat-value text-info">${(todayData.water || 0).toFixed(1)}L</div>
                        </div>
                        <div class="stat bg-base-200 rounded-lg p-3">
                            <div class="stat-title text-sm">Schlaf</div>
                            <div class="stat-value text-success">${(todayData.sleep || 0).toFixed(1)}h</div>
                        </div>
                        <div class="stat bg-base-200 rounded-lg p-3">
                            <div class="stat-title text-sm">Gewicht</div>
                            <div class="stat-value text-warning">${todayData.weight ? todayData.weight.toFixed(1) + 'kg' : '--'}</div>
                        </div>
                    </div>
                `;

                // Mood and notes
                const moodEmojis = {
                    'sehr-gut': '😄',
                    'gut': '😊',
                    'neutral': '😐',
                    'schlecht': '😞',
                    'sehr-schlecht': '😢'
                };

                moodNotes.innerHTML = `
                    <div class="space-y-4">
                        <div class="bg-base-200 rounded-lg p-4">
                            <div class="text-sm font-semibold mb-2">Stimmung</div>
                            <div class="text-2xl">
                                ${todayData.mood ? moodEmojis[todayData.mood] + ' ' + todayData.mood.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Nicht erfasst'}
                            </div>
                        </div>
                        ${todayData.notes ? `
                            <div class="bg-base-200 rounded-lg p-4">
                                <div class="text-sm font-semibold mb-2">Notizen</div>
                                <div class="text-base-content/80">${todayData.notes}</div>
                            </div>
                        ` : ''}
                    </div>
                `;
            } else {
                entryDetails.innerHTML = `
                    <div class="text-center py-8">
                        <i class="fas fa-calendar-plus text-4xl text-base-content/40 mb-4"></i>
                        <p class="text-base-content/60">Noch keine Daten für heute erfasst.</p>
                        <button class="btn btn-primary mt-4" onclick="healthTracker.switchTab('data-entry')">
                            <i class="fas fa-plus mr-2"></i>Daten erfassen
                        </button>
                    </div>
                `;
                moodNotes.innerHTML = '';
            }
        } catch (error) {
            console.error('Error updating today entry:', error);
        }
    }

    async syncOfflineData() {
        const offlineData = JSON.parse(localStorage.getItem('offlineHealthData') || '[]');
        
        if (offlineData.length === 0) return;

        try {
            for (const data of offlineData) {
                const { _offline, _timestamp, ...cleanData } = data;
                await this.saveHealthData(cleanData);
            }
            
            localStorage.removeItem('offlineHealthData');
            this.showToast(`${offlineData.length} Offline-Einträge synchronisiert`, 'success');
            await this.updateDashboard();
        } catch (error) {
            console.error('Sync failed:', error);
            this.showToast('Synchronisation fehlgeschlagen', 'error');
        }
    }

    showToast(message, type = 'info') {
        const toastContainer = document.getElementById('toast-container');
        const toastId = 'toast-' + Date.now();
        
        const typeClasses = {
            success: 'alert-success',
            error: 'alert-error',
            warning: 'alert-warning',
            info: 'alert-info'
        };

        const icons = {
            success: 'fas fa-check-circle',
            error: 'fas fa-times-circle',
            warning: 'fas fa-exclamation-triangle',
            info: 'fas fa-info-circle'
        };

        const toast = document.createElement('div');
        toast.id = toastId;
        toast.className = `alert ${typeClasses[type]} shadow-lg mb-2`;
        toast.innerHTML = `
            <div class="flex items-center">
                <i class="${icons[type]} mr-2"></i>
                <span>${message}</span>
            </div>
        `;

        toastContainer.appendChild(toast);

        // Auto remove after 3 seconds
        setTimeout(() => {
            const toastElement = document.getElementById(toastId);
            if (toastElement) {
                toastElement.remove();
            }
        }, 3000);
    }
}

// Initialize the app
const healthTracker = new HealthTracker();
document.addEventListener('DOMContentLoaded', () => {
    healthTracker.initialize();
});

// Make it globally available
window.healthTracker = healthTracker;
