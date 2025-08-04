// Enhanced app.js with complete fixes and robust chart functionality
class HealthTrackerPro {
    constructor() {
        this.userId = this.getUserId();
        this.theme = localStorage.getItem('theme') || 'light';
        this.charts = {};
        this.chartInitialized = false;
        this.isLoading = false;
        
        this.initTheme();
        this.initEventListeners();
        
        // Initialize without charts first
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
                                return `${context.parsed.y} kg`;
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
                            }
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
                        max: 4,
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
                                let quality = 'Schlecht';
                                if (hours >= 8) quality = 'Ausgezeichnet';
                                else if (hours >= 7) quality = 'Gut';
                                else if (hours >= 6) quality = 'Durchschnitt';
                                
                                return [
                                    `Schlaf: ${hours}h`,
                                    `Qualität: ${quality}`
                                ];
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 10,
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
                // ✅ KORRIGIERT: Verwende /api/ statt /.netlify/functions/api/
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
            // 1. Weight Chart Update
            if (this.charts.weight) {
                const weightData = last7Days
                    .map(d => d.weight || null)
                    .filter(w => w !== null && !isNaN(w));
                
                if (weightData.length > 0) {
                    this.charts.weight.data.labels = labels.slice(0, weightData.length);
                    this.charts.weight.data.datasets[0].data = weightData;
                    this.charts.weight.update('none');
                    console.log('✅ Weight chart updated with', weightData.length, 'points');
                } else {
                    console.log('ℹ️ No valid weight data found');
                }
            }
            
            // 2. Activity Chart Update
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
                this.charts.activity.update('none');
                console.log('✅ Activity chart updated');
            }
            
            // 3. Sleep Chart Update
            if (this.charts.sleep) {
                const sleepData = last7Days.map(d => {
                    const sleep = d.sleepHours || 0;
                    return isNaN(sleep) ? 0 : sleep;
                });
                
                const sleepColors = sleepData.map(hours => {
                    if (hours >= 8) return 'rgba(34, 197, 94, 0.8)';
                    if (hours >= 7) return 'rgba(251, 191, 36, 0.8)';
                    if (hours >= 6) return 'rgba(251, 146, 60, 0.8)';
                    return 'rgba(239, 68, 68, 0.8)';
                });
                
                this.charts.sleep.data.labels = labels;
                this.charts.sleep.data.datasets[0].data = sleepData;
                this.charts.sleep.data.datasets[0].backgroundColor = sleepColors;
                this.charts.sleep.data.datasets[0].borderColor = sleepColors.map(c => c.replace('0.8', '1'));
                this.charts.sleep.update('none');
                console.log('✅ Sleep chart updated');
            }
            
            // 4. Mood Chart Update
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
  let theme = userTheme
    || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
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

        const stepsInput = document.getElementById('steps');
        if (stepsInput) {
            stepsInput.addEventListener('input', (e) => {
                this.updateStepsProgress(e.target.value || 0);
            });
        }

        const waterInput = document.getElementById('water');
        if (waterInput) {
            waterInput.addEventListener('input', (e) => {
                this.updateWaterGlasses(e.target.value || 0);
            });
        }

        const sleepInput = document.getElementById('sleep');
        if (sleepInput) {
            sleepInput.addEventListener('input', (e) => {
                this.updateSleepQuality(e.target.value || 0);
            });
        }

        window.addEventListener('resize', () => this.handleResize());
        window.addEventListener('online', () => this.updateConnectionStatus(true));
        window.addEventListener('offline', () => this.updateConnectionStatus(false));
    }

    toggleTheme() {
  // Wechsle zwischen 'light' und 'dark' Theme
  this.theme = this.theme === 'light' ? 'dark' : 'light';

  // Speichere die Theme-Auswahl lokal
  localStorage.setItem('theme', this.theme);

  // Setze das DaisyUI data-theme Attribut
  document.documentElement.setAttribute('data-theme', this.theme);

  // Aktualisiere das Icon des Theme-Toggles (optional, je nach Implementierung)
  const themeToggle = document.getElementById('theme-toggle');
  const icon = this.theme === 'dark' ? 'sun' : 'moon';
  if (themeToggle) {
    themeToggle.innerHTML = `<i data-lucide="${icon}"></i>`;
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

    async saveToServer(data) {
    const response = await fetch('/api/health-data', {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json' 
        },
        body: JSON.stringify(data)
    });
    
    if (!response.ok) {
        // Erweiterte Fehlerbehandlung
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
            
            localData.push({ ...data, _id: 'local_' + Date.now() });
            
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
        }
        
        if (data.steps) {
            const stepsEl = document.getElementById('today-steps');
            if (stepsEl) stepsEl.textContent = data.steps.toLocaleString();
            this.updateStepsProgress(data.steps);
        }
        
        if (data.waterIntake) {
            const waterEl = document.getElementById('today-water');
            if (waterEl) waterEl.textContent = data.waterIntake + ' L';
            this.updateWaterGlasses(data.waterIntake);
        }
        
        if (data.sleepHours) {
            const sleepEl = document.getElementById('today-sleep');
            if (sleepEl) sleepEl.textContent = data.sleepHours + ' h';
            this.updateSleepQuality(data.sleepHours);
        }
    }

    updateStepsProgress(steps) {
        const goal = 10000;
        const percentage = Math.min((steps / goal) * 100, 100);
        const stepsProgressElement = document.getElementById('steps-progress');
        const stepsPercentageElement = document.getElementById('steps-percentage');
        
        if (stepsProgressElement && stepsPercentageElement) {
            stepsProgressElement.setAttribute('stroke-dasharray', `${percentage}, 100`);
            stepsPercentageElement.textContent = Math.round(percentage) + '%';
        }
    }

    updateWaterGlasses(waterIntake) {
        const glasses = Math.min(Math.ceil(waterIntake / 0.25), 10);
        const container = document.getElementById('water-glasses');
        
        if (container) {
            container.innerHTML = '';
            for (let i = 0; i < 8; i++) {
                const glass = document.createElement('div');
                glass.className = `w-4 h-6 rounded-sm transition-colors duration-300 ${i < glasses ? 'bg-blue-400' : 'bg-gray-200 dark:bg-gray-600'}`;
                container.appendChild(glass);
            }
        }
    }

    updateSleepQuality(sleepHours) {
        const quality = Math.min(Math.ceil(sleepHours / 2), 5);
        const container = document.getElementById('sleep-quality');
        
        if (container) {
            container.innerHTML = '';
            for (let i = 0; i < 5; i++) {
                const star = document.createElement('i');
                star.setAttribute('data-lucide', 'star');
                star.className = `w-3 h-3 transition-colors duration-300 ${i < quality ? 'text-yellow-400 fill-current' : 'text-gray-300 dark:text-gray-600'}`;
                container.appendChild(star);
            }
            if (typeof lucide !== 'undefined') {
                lucide.createIcons();
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
                const baseUrl = window.location.origin;
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
                
                const date = activity.date ? 
                    new Date(activity.date).toLocaleDateString('de-DE', {
                        weekday: 'short',
                        day: 'numeric',
                        month: 'short'
                    }) : 'N/A';
                    
                const mood = this.getMoodEmoji(activity.mood);
                
                return `
                    <div class="p-6 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-300">
                        <div class="flex items-center justify-between">
                            <div class="flex items-center space-x-4">
                                <div class="w-12 h-12 gradient-primary rounded-xl flex items-center justify-center">
                                    <span class="text-2xl">${mood}</span>
                                </div>
                                <div>
                                    <div class="font-medium text-gray-900 dark:text-white">${date}</div>
                                    <div class="text-sm text-gray-500 dark:text-gray-400">
                                        ${this.formatActivitySummary(activity)}
                                    </div>
                                </div>
                            </div>
                            <div class="text-right">
                                <div class="text-sm text-gray-500 dark:text-gray-400">
                                    ${activity.date ? new Date(activity.date).toLocaleDateString('de-DE') : 'N/A'}
                                </div>
                            </div>
                        </div>
                    </div>
                `;
            }).filter(html => html.length > 0).join('');
            
            console.log('✅ Recent activities displayed:', activities.length);
            
        } catch (error) {
            console.error('❌ Error displaying activities:', error);
        }
    }

    getMoodEmoji(mood) {
        const moods = {
            excellent: '😍',
            good: '😊',
            neutral: '😐',
            bad: '😞',
            terrible: '😢'
        };
        return moods[mood] || '📊';
    }

    formatActivitySummary(activity) {
        if (!activity || typeof activity !== 'object') {
            return 'Daten eingegeben';
        }
        
        const parts = [];
        if (activity.steps && !isNaN(activity.steps)) {
            parts.push(`${activity.steps.toLocaleString()} Schritte`);
        }
        if (activity.waterIntake && !isNaN(activity.waterIntake)) {
            parts.push(`${activity.waterIntake}L Wasser`);
        }
        if (activity.sleepHours && !isNaN(activity.sleepHours)) {
            parts.push(`${activity.sleepHours}h Schlaf`);
        }
        if (activity.weight && !isNaN(activity.weight)) {
            parts.push(`${activity.weight}kg`);
        }
        
        return parts.length > 0 ? parts.join(' • ') : 'Daten eingegeben';
    }

    resetForm() {
        const form = document.getElementById('health-form');
        if (form) {
            form.reset();
            this.updateStepsProgress(0);
            this.updateWaterGlasses(0);
            this.updateSleepQuality(0);
        }
    }

    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        const bgColor = {
            success: 'bg-green-500',
            error: 'bg-red-500',
            warning: 'bg-yellow-500',
            info: 'bg-blue-500'
        }[type] || 'bg-gray-500';
        
        toast.className = `${bgColor} text-white px-6 py-4 rounded-xl shadow-lg transform transition-all duration-300 flex items-center space-x-3 translate-x-full`;
        toast.innerHTML = `
            <i data-lucide="${type === 'success' ? 'check-circle' : type === 'error' ? 'x-circle' : 'info'}" class="w-5 h-5"></i>
            <span>${message}</span>
        `;
        
        const container = document.getElementById('toast-container');
        if (container) {
            container.appendChild(toast);
            
            if (typeof lucide !== 'undefined') {
                lucide.createIcons();
            }
            
            setTimeout(() => toast.classList.remove('translate-x-full'), 100);
            
            setTimeout(() => {
                toast.classList.add('translate-x-full', 'opacity-0');
                setTimeout(() => toast.remove(), 300);
            }, 4000);
        }
    }

    showLoading(show) {
        const overlay = document.getElementById('loading-overlay');
        if (overlay) {
            if (show) {
                overlay.classList.remove('hidden');
            } else {
                overlay.classList.add('hidden');
            }
        }
    }

    updateConnectionStatus(isOnline) {
        const statusElement = document.getElementById('connection-status');
        if (statusElement) {
            statusElement.textContent = isOnline ? 'Online' : 'Offline';
            const indicator = statusElement.previousElementSibling;
            if (indicator) {
                indicator.className = `w-3 h-3 rounded-full transition-colors duration-300 ${isOnline ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`;
            }
        }
    }

    initAnimations() {
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate-fade-in-up');
                }
            });
        }, observerOptions);
        
        document.querySelectorAll('section, .chart-section').forEach(el => {
            observer.observe(el);
        });
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    new HealthTrackerPro();
});

// Data Export/Import Funktionalität hinzufügen
class DataManager {
    constructor(healthTracker) {
        this.healthTracker = healthTracker;
        this.initExportImportButtons();
    }

    initExportImportButtons() {
        // Export Button Event
        const exportBtn = document.getElementById('export-data-btn');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.exportData());
        }

        // Import Button Event
        const importBtn = document.getElementById('import-data-btn');
        const importFile = document.getElementById('import-file');
        if (importBtn && importFile) {
            importBtn.addEventListener('click', () => importFile.click());
            importFile.addEventListener('change', (e) => this.importData(e));
        }
    }

    async exportData() {
        try {
            this.healthTracker.showLoading(true);
            
            // Sammle alle Daten
            let allData = [];
            
            if (navigator.onLine) {
                try {
                    const response = await fetch(`/api/health-data/${this.healthTracker.userId}`);
                    if (response.ok) {
                        allData = await response.json();
                    }
                } catch (error) {
                    console.log('Server nicht verfügbar, verwende lokale Daten');
                }
            }
            
            // Fallback zu lokalen Daten
            if (allData.length === 0) {
                const localData = localStorage.getItem('healthData');
                if (localData) {
                    allData = JSON.parse(localData);
                }
            }

            // Erstelle Export-Objekt
            const exportData = {
                userId: this.healthTracker.userId,
                exportDate: new Date().toISOString(),
                version: "1.0",
                totalEntries: allData.length,
                data: allData
            };

            // Download als JSON-Datei
            const blob = new Blob([JSON.stringify(exportData, null, 2)], {
                type: 'application/json'
            });
            
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `health-tracker-backup-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            this.healthTracker.showToast(`${allData.length} Einträge erfolgreich exportiert!`, 'success');
        } catch (error) {
            console.error('Export Fehler:', error);
            this.healthTracker.showToast('Fehler beim Exportieren der Daten', 'error');
        } finally {
            this.healthTracker.showLoading(false);
        }
    }

    async importData(event) {
        const file = event.target.files[0];
        if (!file) return;

        try {
            this.healthTracker.showLoading(true);
            
            const text = await file.text();
            const importData = JSON.parse(text);
            
            // Validiere Import-Daten
            if (!importData.data || !Array.isArray(importData.data)) {
                throw new Error('Ungültiges Datenformat');
            }

            // Zeige Bestätigungsdialog
            const confirmImport = confirm(
                `Import von ${importData.totalEntries} Einträgen?\n` +
                `Export-Datum: ${new Date(importData.exportDate).toLocaleDateString('de-DE')}\n` +
                `Dies wird bestehende lokale Daten überschreiben.`
            );

            if (!confirmImport) return;

            // Importiere Daten
            const processedData = importData.data.map(entry => ({
                ...entry,
                _id: entry._id || 'imported_' + Date.now() + '_' + Math.random()
            }));

            // Speichere lokal
            localStorage.setItem('healthData', JSON.stringify(processedData));
            
            // Versuche Server-Upload wenn online
            if (navigator.onLine) {
                for (const entry of processedData) {
                    try {
                        await fetch('/api/health-data', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                ...entry,
                                userId: this.healthTracker.userId
                            })
                        });
                    } catch (error) {
                        console.log('Server-Upload fehlgeschlagen:', error.message);
                    }
                }
            }

            // Aktualisiere UI
            this.healthTracker.loadTodaysData();
            this.healthTracker.loadRecentActivities();
            setTimeout(() => this.healthTracker.loadAndUpdateCharts(), 500);

            this.healthTracker.showToast(`${processedData.length} Einträge erfolgreich importiert!`, 'success');
            
        } catch (error) {
            console.error('Import Fehler:', error);
            this.healthTracker.showToast('Fehler beim Importieren: ' + error.message, 'error');
        } finally {
            this.healthTracker.showLoading(false);
            event.target.value = ''; // Reset file input
        }
    }
}

// Export/Import Buttons HTML hinzufügen (nach dem Dashboard)
const exportImportHTML = `
<div class="bg-base-100 rounded-xl shadow-lg p-6 mt-6">
    <h3 class="text-lg font-semibold mb-4 flex items-center gap-2">
        <i data-lucide="database" class="w-5 h-5"></i>
        Daten verwalten
    </h3>
    <div class="flex flex-col sm:flex-row gap-3">
        <button id="export-data-btn" class="btn btn-outline btn-primary flex-1">
            <i data-lucide="download" class="w-4 h-4"></i>
            Daten exportieren
        </button>
        <button id="import-data-btn" class="btn btn-outline btn-secondary flex-1">
            <i data-lucide="upload" class="w-4 h-4"></i>
            Daten importieren
        </button>
        <input type="file" id="import-file" accept=".json" class="hidden">
    </div>
    <p class="text-sm text-base-content/60 mt-2">
        Sichere deine Gesundheitsdaten oder stelle sie wieder her.
    </p>
</div>
`;

// Initialisierung in der HealthTrackerPro Klasse ergänzen
// In der constructor-Methode nach den bestehenden Initialisierungen:
setTimeout(() => {
    // Export/Import UI hinzufügen
    const dashboard = document.querySelector('main .container');
    if (dashboard) {
        dashboard.insertAdjacentHTML('beforeend', exportImportHTML);
        
        // Lucide Icons aktualisieren
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
        
        // DataManager initialisieren
        new DataManager(window.healthTracker);
    }
}, 1000);
