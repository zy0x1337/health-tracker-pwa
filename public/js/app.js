// Enhanced app.js with Goals and Progress Tracking
class HealthTrackerPro {
    constructor() {
        this.userId = this.getUserId();
        this.theme = localStorage.getItem('theme') || 'light';
        this.charts = {};
        this.chartInitialized = false;
        this.isLoading = false;
        this.goals = {
            stepsGoal: 10000,
            waterGoal: 2.0,
            sleepGoal: 8,
            weightGoal: null
        };
        
        this.initTheme();
        this.initEventListeners();
        this.loadGoals();
        this.loadTodaysData();
        this.loadRecentActivities();
        this.initAnimations();
        
        // Initialize charts safely after DOM is ready
        setTimeout(() => this.initializeAllCharts(), 800);
    }

    async initializeAllCharts() {
        try {
            if (typeof Chart === 'undefined') {
                console.warn('Chart.js not available');
                return;
            }

            Chart.defaults.responsive = true;
            Chart.defaults.maintainAspectRatio = false;
            Chart.defaults.animation = false;
            Chart.defaults.plugins.legend.display = false;

            this.initWeightChart();
            this.initActivityChart();
            this.initSleepChart();
            this.initMoodChart();
            
            this.chartInitialized = true;
            console.log('✅ Charts initialized with empty data');
            
            setTimeout(() => this.loadAndUpdateCharts(), 300);
        } catch (error) {
            console.error('❌ Chart initialization failed:', error);
        }
    }

    initWeightChart() {
        const canvas = document.getElementById('weightChart');
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        this.charts.weight = new Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Gewicht (kg)',
                    data: [],
                    borderColor: 'rgba(102, 126, 234, 1)',
                    backgroundColor: 'rgba(102, 126, 234, 0.1)',
                    borderWidth: 3,
                    tension: 0.4,
                    fill: true,
                    pointRadius: 6,
                    pointHoverRadius: 8,
                    pointBackgroundColor: 'rgba(102, 126, 234, 1)',
                    pointBorderColor: '#ffffff',
                    pointBorderWidth: 2
                }, {
                    label: 'Gewichtsziel',
                    data: [],
                    borderColor: 'rgba(239, 68, 68, 1)',
                    backgroundColor: 'transparent',
                    borderWidth: 2,
                    borderDash: [5, 5],
                    pointRadius: 0,
                    fill: false
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleColor: '#ffffff',
                        bodyColor: '#ffffff',
                        cornerRadius: 8,
                        callbacks: {
                            label: function(context) {
                                if (context.datasetIndex === 0) {
                                    return `${context.parsed.y} kg`;
                                } else {
                                    return `Ziel: ${context.parsed.y} kg`;
                                }
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: false,
                        grid: {
                            color: this.theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                            drawBorder: false
                        },
                        ticks: {
                            color: this.theme === 'dark' ? '#9CA3AF' : '#6B7280',
                            callback: function(value) {
                                return value + ' kg';
                            }
                        }
                    },
                    x: {
                        grid: { display: false },
                        ticks: {
                            color: this.theme === 'dark' ? '#9CA3AF' : '#6B7280'
                        }
                    }
                }
            }
        });
    }

    initActivityChart() {
        const canvas = document.getElementById('activityChart');
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        this.charts.activity = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: [],
                datasets: [{
                    label: 'Schritte',
                    data: [],
                    backgroundColor: 'rgba(34, 197, 94, 0.8)',
                    borderColor: 'rgba(34, 197, 94, 1)',
                    borderWidth: 2,
                    borderRadius: 6
                }, {
                    label: 'Wasser (L)',
                    data: [],
                    backgroundColor: 'rgba(59, 130, 246, 0.8)',
                    borderColor: 'rgba(59, 130, 246, 1)',
                    borderWidth: 2,
                    borderRadius: 6,
                    yAxisID: 'y1'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: false,
                plugins: {
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        callbacks: {
                            label: function(context) {
                                if (context.datasetIndex === 0) {
                                    return `Schritte: ${context.parsed.y.toLocaleString()}`;
                                } else {
                                    return `Wasser: ${context.parsed.y}L`;
                                }
                            },
                            afterLabel: function(context) {
                                const goalText = context.datasetIndex === 0 
                                    ? `Ziel: ${(this.goals?.stepsGoal || 10000).toLocaleString()}`
                                    : `Ziel: ${(this.goals?.waterGoal || 2.0)}L`;
                                return goalText;
                            }.bind(this)
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        position: 'left',
                        grid: {
                            color: this.theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
                        },
                        ticks: {
                            color: this.theme === 'dark' ? '#9CA3AF' : '#6B7280',
                            callback: function(value) {
                                return value.toLocaleString();
                            }
                        }
                    },
                    y1: {
                        beginAtZero: true,
                        position: 'right',
                        max: Math.max(4, (this.goals?.waterGoal || 2.0) + 1),
                        grid: { drawOnChartArea: false },
                        ticks: {
                            color: this.theme === 'dark' ? '#9CA3AF' : '#6B7280',
                            callback: function(value) {
                                return value + 'L';
                            }
                        }
                    },
                    x: {
                        grid: { display: false },
                        ticks: {
                            color: this.theme === 'dark' ? '#9CA3AF' : '#6B7280'
                        }
                    }
                }
            }
        });
    }

    initSleepChart() {
        const canvas = document.getElementById('sleepChart');
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        this.charts.sleep = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: [],
                datasets: [{
                    label: 'Schlafstunden',
                    data: [],
                    backgroundColor: [],
                    borderColor: [],
                    borderWidth: 2,
                    borderRadius: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: false,
                plugins: {
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        callbacks: {
                            label: function(context) {
                                const hours = context.parsed.y;
                                const goal = this.goals?.sleepGoal || 8;
                                let quality = 'Schlecht';
                                if (hours >= goal) quality = 'Ausgezeichnet';
                                else if (hours >= goal * 0.875) quality = 'Gut';
                                else if (hours >= goal * 0.75) quality = 'Durchschnitt';
                                
                                return [
                                    `Schlaf: ${hours}h`,
                                    `Ziel: ${goal}h`,
                                    `Qualität: ${quality}`
                                ];
                            }.bind(this)
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: Math.max(10, (this.goals?.sleepGoal || 8) + 2),
                        grid: {
                            color: this.theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
                        },
                        ticks: {
                            color: this.theme === 'dark' ? '#9CA3AF' : '#6B7280',
                            callback: function(value) {
                                return value + 'h';
                            }
                        }
                    },
                    x: {
                        grid: { display: false },
                        ticks: {
                            color: this.theme === 'dark' ? '#9CA3AF' : '#6B7280'
                        }
                    }
                }
            }
        });
    }

    initMoodChart() {
        const canvas = document.getElementById('moodChart');
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        this.charts.mood = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Furchtbar', 'Schlecht', 'Neutral', 'Gut', 'Ausgezeichnet'],
                datasets: [{
                    data: [0, 0, 0, 0, 0],
                    backgroundColor: [
                        'rgba(239, 68, 68, 0.8)',
                        'rgba(251, 146, 60, 0.8)',
                        'rgba(251, 191, 36, 0.8)',
                        'rgba(34, 197, 94, 0.8)',
                        'rgba(16, 185, 129, 0.8)'
                    ],
                    borderWidth: 2,
                    cutout: '60%'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: false,
                plugins: {
                    legend: {
                        display: true,
                        position: 'bottom',
                        labels: {
                            color: this.theme === 'dark' ? '#9CA3AF' : '#6B7280',
                            usePointStyle: true
                        }
                    }
                }
            }
        });
    }

    async loadAndUpdateCharts() {
        if (!this.chartInitialized) return;
        
        console.log('🔄 Loading chart data...');
        try {
            let allData = [];
            
            if (navigator.onLine) {
                try {
                    const url = `/api/health-data/${this.userId}`;
                    console.log('🌐 Fetching from URL:', url);
                    const response = await fetch(url);
                    console.log('📡 Response status:', response.status);
                    
                    if (response.ok) {
                        const serverData = await response.json();
                        console.log('📦 Raw server response:', serverData);
                        
                        if (Array.isArray(serverData)) {
                            allData = serverData;
                            console.log('📊 Server data loaded:', allData.length, 'entries');
                        } else {
                            console.warn('⚠️ Server returned non-array data:', typeof serverData, serverData);
                            allData = [];
                        }
                    } else {
                        console.warn('⚠️ Server response not ok:', response.status);
                    }
                } catch (error) {
                    console.log('⚠️ Server error:', error.message);
                }
            }
            
            // Fallback zu lokalen Daten
            if (allData.length === 0) {
                const localDataString = localStorage.getItem('healthData') || '[]';
                try {
                    const localData = JSON.parse(localDataString);
                    if (Array.isArray(localData)) {
                        allData = localData;
                        console.log('💾 Local data loaded:', allData.length, 'entries');
                    } else {
                        console.warn('⚠️ Local data is not an array, resetting');
                        localStorage.setItem('healthData', '[]');
                        allData = [];
                    }
                } catch (parseError) {
                    console.error('❌ Error parsing local data:', parseError);
                    localStorage.setItem('healthData', '[]');
                    allData = [];
                }
            }
            
            // Charts aktualisieren
            this.updateChartsWithData(allData);
        } catch (error) {
            console.error('❌ Error loading chart data:', error);
        }
    }

    updateChartsWithData(allData) {
        if (!this.chartInitialized) {
            console.log('⚠️ Charts not initialized yet');
            return;
        }
        
        if (!allData || !Array.isArray(allData)) {
            console.log('⚠️ Invalid data provided to updateChartsWithData:', typeof allData);
            return;
        }
        
        if (allData.length === 0) {
            console.log('ℹ️ No data available for charts');
            return;
        }
        
        console.log('📈 Updating charts with', allData.length, 'data points');
        const last7Days = allData.slice(-7);
        
        if (last7Days.length === 0) {
            console.log('⚠️ No recent data found');
            return;
        }
        
        const labels = last7Days.map(d => {
            if (!d.date) return 'N/A';
            try {
                return new Date(d.date).toLocaleDateString('de-DE', { weekday: 'short' });
            } catch (error) {
                return 'N/A';
            }
        });

        try {
            // 1. Weight Chart Update WITH GOAL LINE
            if (this.charts.weight) {
                const weightData = last7Days
                    .map(d => d.weight || null)
                    .filter(w => w !== null && !isNaN(w));
                
                if (weightData.length > 0) {
                    this.charts.weight.data.labels = labels.slice(0, weightData.length);
                    this.charts.weight.data.datasets[0].data = weightData;
                    
                    // Add goal line if weight goal exists
                    if (this.goals.weightGoal && !isNaN(this.goals.weightGoal)) {
                        this.charts.weight.data.datasets[1].data = new Array(weightData.length).fill(this.goals.weightGoal);
                    } else {
                        this.charts.weight.data.datasets[1].data = [];
                    }
                    
                    this.charts.weight.update('none');
                    console.log('✅ Weight chart updated with', weightData.length, 'points');
                } else {
                    console.log('ℹ️ No valid weight data found');
                }
            }
            
            // 2. Activity Chart Update WITH GOAL INDICATORS
            if (this.charts.activity) {
                const stepsData = last7Days.map(d => {
                    const steps = d.steps || 0;
                    return isNaN(steps) ? 0 : steps;
                });
                
                const waterData = last7Days.map(d => {
                    const water = d.waterIntake || 0;
                    return isNaN(water) ? 0 : water;
                });
                
                this.charts.activity.data.labels = labels;
                this.charts.activity.data.datasets[0].data = stepsData;
                this.charts.activity.data.datasets[1].data = waterData;
                
                // Update y1 axis max based on water goal
                if (this.charts.activity.options.scales.y1) {
                    this.charts.activity.options.scales.y1.max = Math.max(4, (this.goals.waterGoal || 2.0) + 1);
                }
                
                this.charts.activity.update('none');
                console.log('✅ Activity chart updated');
            }
            
            // 3. Sleep Chart Update WITH GOAL-BASED COLORS
            if (this.charts.sleep) {
                const sleepData = last7Days.map(d => {
                    const sleep = d.sleepHours || 0;
                    return isNaN(sleep) ? 0 : sleep;
                });
                
                const sleepColors = sleepData.map(hours => {
                    const goal = this.goals.sleepGoal || 8;
                    if (hours >= goal) return 'rgba(34, 197, 94, 0.8)'; // Green - Goal reached
                    if (hours >= goal * 0.875) return 'rgba(251, 191, 36, 0.8)'; // Yellow - Close to goal
                    if (hours >= goal * 0.75) return 'rgba(251, 146, 60, 0.8)'; // Orange - Below goal
                    return 'rgba(239, 68, 68, 0.8)'; // Red - Much below goal
                });
                
                this.charts.sleep.data.labels = labels;
                this.charts.sleep.data.datasets[0].data = sleepData;
                this.charts.sleep.data.datasets[0].backgroundColor = sleepColors;
                this.charts.sleep.data.datasets[0].borderColor = sleepColors.map(c => c.replace('0.8', '1'));
                
                // Update y axis max based on sleep goal
                if (this.charts.sleep.options.scales.y) {
                    this.charts.sleep.options.scales.y.max = Math.max(10, (this.goals.sleepGoal || 8) + 2);
                }
                
                this.charts.sleep.update('none');
                console.log('✅ Sleep chart updated');
            }
            
            // 4. Mood Chart Update (unchanged)
            if (this.charts.mood) {
                const moodCounts = [0, 0, 0, 0, 0];
                const moodMapping = ['terrible', 'bad', 'neutral', 'good', 'excellent'];
                
                last7Days.forEach(d => {
                    if (d.mood && typeof d.mood === 'string') {
                        const moodIndex = moodMapping.indexOf(d.mood.toLowerCase());
                        if (moodIndex !== -1) {
                            moodCounts[moodIndex]++;
                        }
                    }
                });
                
                this.charts.mood.data.datasets[0].data = moodCounts;
                this.charts.mood.update('none');
                console.log('✅ Mood chart updated', moodCounts);
            }
            
        } catch (error) {
            console.error('❌ Error updating charts:', error);
        }
    }

    getUserId() {
        let userId = localStorage.getItem('userId');
        if (!userId) {
            userId = 'user_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('userId', userId);
        }
        return userId;
    }

    initTheme() {
        const userTheme = localStorage.getItem('theme');
        let theme = userTheme || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
        document.documentElement.setAttribute('data-theme', theme);
        this.theme = theme;
    }

    initEventListeners() {
        const form = document.getElementById('health-form');
        if (form) {
            form.addEventListener('submit', (e) => this.handleSubmit(e));
        }

        const themeToggle = document.getElementById('theme-toggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => this.toggleTheme());
        }

        // Goals-related event listeners
        const editGoalsBtn = document.getElementById('edit-goals-btn');
        if (editGoalsBtn) {
            editGoalsBtn.addEventListener('click', () => this.openGoalsModal());
        }

        const closeGoalsModal = document.getElementById('close-goals-modal');
        if (closeGoalsModal) {
            closeGoalsModal.addEventListener('click', () => this.closeGoalsModal());
        }

        const cancelGoals = document.getElementById('cancel-goals');
        if (cancelGoals) {
            cancelGoals.addEventListener('click', () => this.closeGoalsModal());
        }

        const goalsForm = document.getElementById('goals-form');
        if (goalsForm) {
            goalsForm.addEventListener('submit', (e) => this.handleGoalsSubmit(e));
        }

        // Input event listeners
        const stepsInput = document.getElementById('steps');
        if (stepsInput) {
            stepsInput.addEventListener('input', (e) => {
                this.updateStepsProgress(e.target.value || 0);
            });
        }

        const waterInput = document.getElementById('water');
        if (waterInput) {
            waterInput.addEventListener('input', (e) => {
                this.updateWaterProgress(e.target.value || 0);
            });
        }

        const sleepInput = document.getElementById('sleep');
        if (sleepInput) {
            sleepInput.addEventListener('input', (e) => {
                this.updateSleepProgress(e.target.value || 0);
            });
        }

        window.addEventListener('resize', () => this.handleResize());
        window.addEventListener('online', () => this.updateConnectionStatus(true));
        window.addEventListener('offline', () => this.updateConnectionStatus(false));
    }

    // NEW: Goals Management Methods
    async loadGoals() {
        try {
            let goals = null;
            
            if (navigator.onLine) {
                try {
                    const response = await fetch(`/api/goals/${this.userId}`);
                    if (response.ok) {
                        goals = await response.json();
                        console.log('🎯 Server goals loaded:', goals);
                    }
                } catch (error) {
                    console.log('⚠️ Server goals error:', error.message);
                }
            }
            
            // Fallback to local goals
            if (!goals) {
                const localGoals = localStorage.getItem('userGoals');
                if (localGoals) {
                    try {
                        goals = JSON.parse(localGoals);
                        console.log('💾 Local goals loaded:', goals);
                    } catch (error) {
                        console.error('❌ Error parsing local goals:', error);
                    }
                }
            }
            
            if (goals) {
                this.goals = {
                    stepsGoal: goals.stepsGoal || 10000,
                    waterGoal: goals.waterGoal || 2.0,
                    sleepGoal: goals.sleepGoal || 8,
                    weightGoal: goals.weightGoal || null
                };
            }
            
            this.updateGoalsDisplay();
            console.log('✅ Goals loaded:', this.goals);
            
        } catch (error) {
            console.error('❌ Error loading goals:', error);
        }
    }

    updateGoalsDisplay() {
        // Update goals display section
        const weightGoalEl = document.getElementById('weight-goal-display');
        const stepsGoalEl = document.getElementById('steps-goal-display');
        const waterGoalEl = document.getElementById('water-goal-display');
        const sleepGoalEl = document.getElementById('sleep-goal-display');
        
        if (weightGoalEl) {
            weightGoalEl.textContent = this.goals.weightGoal ? `${this.goals.weightGoal} kg` : '-- kg';
        }
        if (stepsGoalEl) {
            stepsGoalEl.textContent = this.goals.stepsGoal.toLocaleString();
        }
        if (waterGoalEl) {
            waterGoalEl.textContent = `${this.goals.waterGoal} L`;
        }
        if (sleepGoalEl) {
            sleepGoalEl.textContent = `${this.goals.sleepGoal} h`;
        }
        
        // Update stats section goal displays
        const weightGoalStatEl = document.getElementById('weight-goal-stat');
        const stepsGoalStatEl = document.getElementById('steps-goal-stat');
        const waterGoalStatEl = document.getElementById('water-goal-stat');
        const sleepGoalStatEl = document.getElementById('sleep-goal-stat');
        
        if (weightGoalStatEl) {
            weightGoalStatEl.textContent = this.goals.weightGoal ? `${this.goals.weightGoal} kg` : '--';
        }
        if (stepsGoalStatEl) {
            stepsGoalStatEl.textContent = this.goals.stepsGoal.toLocaleString();
        }
        if (waterGoalStatEl) {
            waterGoalStatEl.textContent = `${this.goals.waterGoal} L`;
        }
        if (sleepGoalStatEl) {
            sleepGoalStatEl.textContent = `${this.goals.sleepGoal} h`;
        }
    }

    openGoalsModal() {
    const modal = document.getElementById('goals-modal');
    if (!modal) return;
    
    // Pre-fill form with current goals
    const weightInput = document.getElementById('weight-goal-input');
    const stepsInput = document.getElementById('steps-goal-input');
    const waterInput = document.getElementById('water-goal-input');
    const sleepInput = document.getElementById('sleep-goal-input');
    
    if (weightInput) weightInput.value = this.goals.weightGoal || '';
    if (stepsInput) stepsInput.value = this.goals.stepsGoal;
    if (waterInput) waterInput.value = this.goals.waterGoal;
    if (sleepInput) sleepInput.value = this.goals.sleepGoal;
    
    // Show modal using DaisyUI method
    modal.classList.add('modal-open');
}

closeGoalsModal() {
    const modal = document.getElementById('goals-modal');
    if (modal) {
        modal.classList.remove('modal-open');
    }
}

    closeGoalsModal() {
        const modal = document.getElementById('goals-modal');
        if (modal) {
            modal.classList.add('hidden');
        }
    }

    async handleGoalsSubmit(e) {
        e.preventDefault();
        
        const weightGoal = parseFloat(document.getElementById('weight-goal-input').value) || null;
        const stepsGoal = parseInt(document.getElementById('steps-goal-input').value) || 10000;
        const waterGoal = parseFloat(document.getElementById('water-goal-input').value) || 2.0;
        const sleepGoal = parseFloat(document.getElementById('sleep-goal-input').value) || 8;
        
        const goalsData = {
            userId: this.userId,
            weightGoal,
            stepsGoal,
            waterGoal,
            sleepGoal
        };
        
        console.log('🎯 Saving goals:', goalsData);
        
        try {
            if (navigator.onLine) {
                await this.saveGoalsToServer(goalsData);
                this.showToast('🎯 Ziele erfolgreich gespeichert!', 'success');
            } else {
                this.saveGoalsToLocal(goalsData);
                this.showToast('🎯 Ziele offline gespeichert!', 'success');
            }
            
            this.goals = {
                stepsGoal,
                waterGoal,
                sleepGoal,
                weightGoal
            };
            
            this.updateGoalsDisplay();
            this.closeGoalsModal();
            
            // Reload charts to show new goal lines
            setTimeout(() => {
                this.loadAndUpdateCharts();
            }, 300);
            
        } catch (error) {
            console.error('❌ Error saving goals:', error);
            this.showToast('❌ Fehler beim Speichern der Ziele', 'error');
        }
    }

    async saveGoalsToServer(goalsData) {
        const response = await fetch('/api/goals', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(goalsData)
        });
        
        if (!response.ok) {
            let errorMessage = `Server error: ${response.status}`;
            try {
                const errorData = await response.json();
                errorMessage = errorData.message || errorMessage;
            } catch (parseError) {
                // Falls JSON-Parsing fehlschlägt, verwende Standard-Fehlermeldung
            }
            throw new Error(errorMessage);
        }
        
        return response.json();
    }

    saveGoalsToLocal(goalsData) {
        try {
            localStorage.setItem('userGoals', JSON.stringify(goalsData));
            console.log('💾 Goals saved locally:', goalsData);
        } catch (error) {
            console.error('❌ Error saving goals to local storage:', error);
        }
    }

    toggleTheme() {
        this.theme = this.theme === 'light' ? 'dark' : 'light';
        localStorage.setItem('theme', this.theme);
        document.documentElement.setAttribute('data-theme', this.theme);

        const themeToggle = document.getElementById('theme-toggle');
        const icon = this.theme === 'dark' ? 'sun' : 'moon';
        if (themeToggle) {
            themeToggle.innerHTML = `<i data-lucide="${icon}" class="w-5 h-5"></i>`;
            if (typeof lucide !== 'undefined') {
                lucide.createIcons();
            }
        }

        this.updateChartsTheme();
    }

    async handleSubmit(e) {
        e.preventDefault();
        this.showLoading(true);

        const formData = {
            userId: this.userId,
            date: new Date().toISOString().split('T')[0],
            weight: parseFloat(document.getElementById('weight').value) || null,
            steps: parseInt(document.getElementById('steps').value) || null,
            waterIntake: parseFloat(document.getElementById('water').value) || null,
            sleepHours: parseFloat(document.getElementById('sleep').value) || null,
            mood: document.getElementById('mood').value || null,
            notes: document.getElementById('notes').value || null
        };

        console.log('💾 Saving data:', formData);

        try {
            if (navigator.onLine) {
                await this.saveToServer(formData);
                this.showToast('Daten erfolgreich gespeichert!', 'success');
            } else {
                this.saveToLocal(formData);
                this.showToast('Daten offline gespeichert!', 'success');
            }

            this.updateDashboard(formData);
            this.checkGoalAchievements(formData);
            this.loadRecentActivities();

            setTimeout(() => {
                console.log('🔄 Reloading charts after data save...');
                this.loadAndUpdateCharts();
            }, 500);

            this.resetForm();

        } catch (error) {
            console.error('❌ Fehler beim Speichern:', error);
            this.showToast('Fehler beim Speichern der Daten', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    // NEW: Goal Achievement Check
    checkGoalAchievements(data) {
        const achievements = [];
        
        if (data.steps && data.steps >= this.goals.stepsGoal) {
            achievements.push(`🚶‍♂️ Schrittziel erreicht: ${data.steps.toLocaleString()} Schritte!`);
        }
        
        if (data.waterIntake && data.waterIntake >= this.goals.waterGoal) {
            achievements.push(`💧 Wasserziel erreicht: ${data.waterIntake} L!`);
        }
        
        if (data.sleepHours && data.sleepHours >= this.goals.sleepGoal) {
            achievements.push(`😴 Schlafziel erreicht: ${data.sleepHours} Stunden!`);
        }
        
        if (this.goals.weightGoal && data.weight) {
            // Check if approaching weight goal (within 1kg)
            const diff = Math.abs(data.weight - this.goals.weightGoal);
            if (diff <= 1) {
                achievements.push(`⚖️ Gewichtsziel fast erreicht: Nur noch ${diff.toFixed(1)}kg!`);
            }
        }
        
        // Show achievement notifications
        achievements.forEach((achievement, index) => {
            setTimeout(() => {
                this.showToast(achievement, 'success');
            }, index * 1500); // Stagger notifications
        });
    }

    async saveToServer(data) {
        const response = await fetch('/api/health-data', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            let errorMessage = `Server error: ${response.status}`;
            try {
                const errorData = await response.json();
                errorMessage = errorData.message || errorMessage;
            } catch (parseError) {
                // Falls JSON-Parsing fehlschlägt, verwende Standard-Fehlermeldung
            }
            throw new Error(errorMessage);
        }

        return response.json();
    }

    saveToLocal(data) {
        try {
            let localData = [];
            const existingData = localStorage.getItem('healthData');
            
            if (existingData) {
                try {
                    const parsed = JSON.parse(existingData);
                    if (Array.isArray(parsed)) {
                        localData = parsed;
                    } else {
                        console.warn('⚠️ Existing local data is not an array, resetting');
                        localData = [];
                    }
                } catch (parseError) {
                    console.error('❌ Error parsing existing local data:', parseError);
                    localData = [];
                }
            }

            localData.push({
                ...data,
                _id: 'local_' + Date.now()
            });

            localStorage.setItem('healthData', JSON.stringify(localData));
            console.log('💾 Data saved locally, total entries:', localData.length);

        } catch (error) {
            console.error('❌ Error saving to local storage:', error);
        }
    }

    updateDashboard(data) {
        if (data.weight) {
            const weightEl = document.getElementById('today-weight');
            if (weightEl) weightEl.textContent = data.weight + ' kg';
            this.updateWeightProgress(data.weight);
        }

        if (data.steps) {
            const stepsEl = document.getElementById('today-steps');
            if (stepsEl) stepsEl.textContent = data.steps.toLocaleString();
            this.updateStepsProgress(data.steps);
        }

        if (data.waterIntake) {
            const waterEl = document.getElementById('today-water');
            if (waterEl) waterEl.textContent = data.waterIntake + ' L';
            this.updateWaterProgress(data.waterIntake);
        }

        if (data.sleepHours) {
            const sleepEl = document.getElementById('today-sleep');
            if (sleepEl) sleepEl.textContent = data.sleepHours + ' h';
            this.updateSleepProgress(data.sleepHours);
        }
    }

    updateStepsProgress(steps) {
        const goal = this.goals.stepsGoal;
        const percentage = Math.min((steps / goal) * 100, 100);
        
        const stepsProgressElement = document.getElementById('steps-progress');
        const stepsPercentageElement = document.getElementById('steps-percentage');
        
        if (stepsProgressElement && stepsPercentageElement) {
            stepsProgressElement.setAttribute('stroke-dasharray', `${percentage}, 100`);
            stepsPercentageElement.textContent = Math.round(percentage) + '%';
        }
    }

    updateWaterProgress(waterIntake) {
    const goal = this.goals.waterGoal;
    const percentage = Math.min((waterIntake / goal) * 100, 100);
    
    // Update glasses visualization
    const glasses = Math.min(Math.ceil(waterIntake / 0.25), 8);
    const container = document.getElementById('water-glasses');
    if (container) {
        container.innerHTML = '';
        for (let i = 0; i < 8; i++) {
            const glass = document.createElement('div');
            glass.className = `w-4 h-6 rounded-sm transition-colors duration-300 ${i < glasses ? 'bg-info' : 'bg-base-300'}`;
            container.appendChild(glass);
        }
    }
    
    // Update DaisyUI progress bar
    const progressEl = document.getElementById('water-progress');
    const progressTextEl = document.getElementById('water-progress-text');
    
    if (progressEl) {
        progressEl.value = percentage;
    }
    if (progressTextEl) {
        progressTextEl.textContent = `${Math.round(percentage)}% des Tagesziels`;
    }
}

    updateSleepProgress(sleepHours) {
    const goal = this.goals.sleepGoal;
    const percentage = Math.min((sleepHours / goal) * 100, 100);
    
    // Update star quality visualization
    const quality = Math.min(Math.ceil(sleepHours / 2), 5);
    const container = document.getElementById('sleep-quality');
    if (container) {
        container.innerHTML = '';
        for (let i = 0; i < 5; i++) {
            const star = document.createElement('i');
            star.setAttribute('data-lucide', 'star');
            star.className = `w-3 h-3 transition-colors duration-300 ${i < quality ? 'text-warning fill-current' : 'text-base-300'}`;
            container.appendChild(star);
        }
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }
    
    // Update DaisyUI progress bar
    const progressEl = document.getElementById('sleep-progress');
    const progressTextEl = document.getElementById('sleep-progress-text');
    
    if (progressEl) {
        progressEl.value = percentage;
    }
    if (progressTextEl) {
        progressTextEl.textContent = `${Math.round(percentage)}% des Tagesziels`;
    }
}

    updateWeightProgress(currentWeight) {
    if (!this.goals.weightGoal || !currentWeight) return;
    
    const goal = this.goals.weightGoal;
    const diff = Math.abs(currentWeight - goal);
    const maxDiff = goal * 0.2; // 20% of goal weight as max difference for progress calculation
    
    let percentage;
    if (diff <= 1) {
        percentage = 100; // Very close to goal
    } else {
        percentage = Math.max(0, Math.min(100, ((maxDiff - diff) / maxDiff) * 100));
    }
    
    const progressEl = document.getElementById('weight-progress');
    const progressTextEl = document.getElementById('weight-progress-text');
    
    if (progressEl) {
        progressEl.value = percentage;
    }
    if (progressTextEl) {
        if (diff <= 1) {
            progressTextEl.textContent = 'Ziel erreicht! 🎉';
        } else {
            progressTextEl.textContent = `${diff.toFixed(1)}kg zum Ziel`;
        }
    }
}

    updateChartsTheme() {
        if (!this.chartInitialized) return;

        const gridColor = this.theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
        const tickColor = this.theme === 'dark' ? '#9CA3AF' : '#6B7280';

        Object.values(this.charts).forEach(chart => {
            if (chart && chart.options && chart.options.scales) {
                Object.values(chart.options.scales).forEach(scale => {
                    if (scale.grid) scale.grid.color = gridColor;
                    if (scale.ticks) scale.ticks.color = tickColor;
                });
                chart.update('none');
            }
            if (chart.options && chart.options.plugins && chart.options.plugins.legend) {
                chart.options.plugins.legend.labels.color = tickColor;
            }
        });
    }

    handleResize() {
        if (!this.chartInitialized) return;
        
        Object.values(this.charts).forEach(chart => {
            if (chart && chart.resize) {
                chart.resize();
            }
        });
    }

    async loadTodaysData() {
        try {
            if (navigator.onLine) {
                const response = await fetch(`/api/health-data/${this.userId}`);
                if (response.ok) {
                    const data = await response.json();
                    if (Array.isArray(data) && data.length > 0) {
                        const today = data.find(entry => {
                            const entryDate = new Date(entry.date).toISOString().split('T')[0];
                            const todayDate = new Date().toISOString().split('T')[0];
                            return entryDate === todayDate;
                        });
                        
                        if (today) {
                            this.updateDashboard(today);
                        }
                    }
                }
            } else {
                this.loadLocalTodaysData();
            }
        } catch (error) {
            console.error('Fehler beim Laden der heutigen Daten:', error);
            this.loadLocalTodaysData();
        }
    }

    loadLocalTodaysData() {
        try {
            const localData = JSON.parse(localStorage.getItem('healthData') || '[]');
            if (Array.isArray(localData)) {
                const today = new Date().toISOString().split('T')[0];
                const todayData = localData.find(entry => entry.date === today);
                
                if (todayData) {
                    this.updateDashboard(todayData);
                }
            }
        } catch (error) {
            console.error('Error loading local today data:', error);
        }
    }

    async loadRecentActivities() {
        try {
            let activities = [];
            
            if (navigator.onLine) {
                try {
                    const response = await fetch(`/api/health-data/${this.userId}`);
                    if (response.ok) {
                        const serverData = await response.json();
                        if (Array.isArray(serverData)) {
                            activities = serverData;
                            console.log('📋 Server activities loaded:', activities.length);
                        } else {
                            console.warn('⚠️ Server activities data is not an array:', typeof serverData);
                            activities = [];
                        }
                    }
                } catch (error) {
                    console.log('⚠️ Server activities error:', error.message);
                }
            }
            
            if (activities.length === 0) {
                try {
                    const localData = JSON.parse(localStorage.getItem('healthData') || '[]');
                    if (Array.isArray(localData)) {
                        activities = localData;
                        console.log('💾 Local activities loaded:', activities.length);
                    } else {
                        console.warn('⚠️ Local activities data is not an array');
                        activities = [];
                    }
                } catch (parseError) {
                    console.error('❌ Error parsing local activities:', parseError);
                    activities = [];
                }
            }
            
            const recentActivities = activities.slice(-5).reverse();
            this.displayRecentActivities(recentActivities);
            
        } catch (error) {
            console.error('❌ Fehler beim Laden der Aktivitäten:', error);
        }
    }

    displayRecentActivities(activities) {
        const container = document.getElementById('recent-activities');
        if (!container) {
            console.warn('⚠️ Recent activities container not found');
            return;
        }
        
        if (!Array.isArray(activities)) {
            console.warn('⚠️ Activities is not an array:', typeof activities);
            return;
        }
        
        if (activities.length === 0) {
            console.log('ℹ️ No activities to display');
            return;
        }

        try {
            container.innerHTML = activities.map(activity => {
                if (!activity || typeof activity !== 'object') {
                    return '';
                }
                
                const date = activity.date ? new Date(activity.date).toLocaleDateString('de-DE', {
                    weekday: 'short',
                    day: 'numeric',
                    month: 'short'
                }) : 'N/A';
                
                const mood = this.getMoodEmoji(activity.mood);
                
                return `
                    <div class="activity-item bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all duration-200">
                        <div class="flex items-center justify-between mb-2">
                            <span class="text-sm font-medium text-gray-600 dark:text-gray-300">${date}</span>
                            <span class="text-lg">${mood}</span>
                        </div>
                        <div class="grid grid-cols-2 gap-2 text-xs text-gray-500 dark:text-gray-400">
                            ${activity.weight ? `<div>⚖️ ${activity.weight}kg</div>` : ''}
                            ${activity.steps ? `<div>👣 ${activity.steps.toLocaleString()}</div>` : ''}
                            ${activity.waterIntake ? `<div>💧 ${activity.waterIntake}L</div>` : ''}
                            ${activity.sleepHours ? `<div>😴 ${activity.sleepHours}h</div>` : ''}
                        </div>
                        ${activity.notes ? `<div class="mt-2 text-xs text-gray-600 dark:text-gray-300 italic">"${activity.notes}"</div>` : ''}
                    </div>
                `;
            }).join('');
            
            console.log('✅ Recent activities displayed:', activities.length, 'items');
            
        } catch (error) {
            console.error('❌ Error displaying activities:', error);
            container.innerHTML = '<p class="text-center text-gray-500 py-4">Fehler beim Anzeigen der Aktivitäten</p>';
        }
    }

    getMoodEmoji(mood) {
        const moodEmojis = {
            'excellent': '😄',
            'good': '😊',
            'neutral': '😐',
            'bad': '😔',
            'terrible': '😞'
        };
        return moodEmojis[mood] || '😐';
    }

    showLoading(show) {
        this.isLoading = show;
        const submitBtn = document.querySelector('#health-form button[type="submit"]');
        if (submitBtn) {
            if (show) {
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<i data-lucide="loader-2" class="w-4 h-4 mr-2 animate-spin"></i> Speichern...';
            } else {
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<i data-lucide="save" class="w-4 h-4 mr-2"></i> Speichern';
            }
            if (typeof lucide !== 'undefined') {
                lucide.createIcons();
            }
        }
    }

    showToast(message, type = 'info') {
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

        // Auto remove after 4 seconds
        setTimeout(() => {
            toast.style.transform = 'translateY(-100%)';
            setTimeout(() => toast.remove(), 300);
        }, 4000);
    }

    resetForm() {
        const form = document.getElementById('health-form');
        if (form) {
            form.reset();
        }
    }

    initAnimations() {
        // Add subtle animations to stat cards
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }
            });
        }, observerOptions);

        document.querySelectorAll('.stat-card, .activity-item').forEach(card => {
            card.style.opacity = '0';
            card.style.transform = 'translateY(20px)';
            card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
            observer.observe(card);
        });
    }

    updateConnectionStatus(isOnline) {
        const statusEl = document.getElementById('connection-status');
        if (statusEl) {
            statusEl.textContent = isOnline ? '🌐 Online' : '📵 Offline';
            statusEl.className = `text-xs ${isOnline ? 'text-green-600' : 'text-yellow-600'}`;
        }
        
        if (isOnline) {
            this.showToast('🌐 Verbindung wiederhergestellt', 'success');
        } else {
            this.showToast('📵 Offline-Modus aktiv', 'warning');
        }
    }
}

// App initialisieren wenn DOM bereit ist
document.addEventListener('DOMContentLoaded', () => {
    window.healthTracker = new HealthTrackerPro();
    console.log('🚀 Health Tracker Pro mit Goals-System initialisiert');
});
