// Enhanced app.js with complete fixes and robust chart functionality
class HealthTrackerPro {
    constructor() {
        this.userId = this.getUserId();
        this.availableThemes = ['light', 'dark', 'cupcake', 'corporate'];
        this.theme = localStorage.getItem('healthTheme') || this.detectSystemTheme();
        this.charts = {};
        this.chartInitialized = false;
        this.isLoading = false;
        
        this.initTheme();
        this.initEventListeners();
        this.loadTodaysData();
        this.loadRecentActivities();
        this.initAnimations();
        
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

    // Erweiterte Theme-Initialisierung
    initTheme() {
        // Theme anwenden
        document.documentElement.setAttribute('data-theme', this.theme);
        
        // Theme-Button aktualisieren
        this.updateThemeUI();
        
        console.log(`🎨 Theme aktiviert: ${this.theme}`);
    }

    initEventListeners() {
    // ========================================
    // FORM HANDLING
    // ========================================
    const form = document.getElementById('health-form');
    if (form) {
        form.addEventListener('submit', (e) => this.handleSubmit(e));
    }

    // ========================================
    // THEME MANAGEMENT
    // ========================================
    
    // Main Theme Toggle Button (cycles through themes)
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', () => this.toggleTheme());
    }

    // Individual Theme Selector Buttons
    const themeButtons = document.querySelectorAll('[data-theme-btn]');
    themeButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const selectedTheme = btn.getAttribute('data-theme-btn');
            this.setTheme(selectedTheme);
            
            // Close dropdown after selection (if applicable)
            const dropdown = btn.closest('.dropdown');
            if (dropdown) {
                dropdown.blur(); // Closes DaisyUI dropdown
            }
        });
    });

    // System Theme Change Detection
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', (e) => {
        // Only auto-switch if no manual theme is stored
        if (!localStorage.getItem('healthTheme')) {
            this.setTheme(e.matches ? 'dark' : 'light');
            console.log(`🎨 System theme changed to: ${e.matches ? 'dark' : 'light'}`);
        }
    });

    // ========================================
    // REAL-TIME INPUT UPDATES
    // ========================================
    
    // Steps Input - Update progress circle in real-time
    const stepsInput = document.getElementById('steps');
    if (stepsInput) {
        stepsInput.addEventListener('input', (e) => {
            const steps = parseInt(e.target.value) || 0;
            this.updateStepsProgress(steps);
            
            // Update steps progress circle
            const progressCircle = document.getElementById('steps-progress-circle');
            if (progressCircle) {
                const percentage = Math.min((steps / 10000) * 100, 100);
                progressCircle.style.setProperty('--value', percentage);
            }
        });

        // Format number on blur
        stepsInput.addEventListener('blur', (e) => {
            const value = parseInt(e.target.value);
            if (!isNaN(value)) {
                e.target.value = value.toLocaleString();
            }
        });

        // Remove formatting on focus
        stepsInput.addEventListener('focus', (e) => {
            e.target.value = e.target.value.replace(/,/g, '');
        });
    }

    // Water Intake Input - Update glass visualization
    const waterInput = document.getElementById('water');
    if (waterInput) {
        waterInput.addEventListener('input', (e) => {
            const water = parseFloat(e.target.value) || 0;
            this.updateWaterGlasses(water);
        });

        // Step increment with buttons (if you add +/- buttons)
        waterInput.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowUp') {
                e.preventDefault();
                const current = parseFloat(e.target.value) || 0;
                const newValue = Math.min(current + 0.25, 5);
                e.target.value = newValue;
                this.updateWaterGlasses(newValue);
            } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                const current = parseFloat(e.target.value) || 0;
                const newValue = Math.max(current - 0.25, 0);
                e.target.value = newValue;
                this.updateWaterGlasses(newValue);
            }
        });
    }

    // Sleep Hours Input - Update star quality indicator
    const sleepInput = document.getElementById('sleep');
    if (sleepInput) {
        sleepInput.addEventListener('input', (e) => {
            const sleep = parseFloat(e.target.value) || 0;
            this.updateSleepQuality(sleep);
        });
    }

    // Weight Input - Validation and formatting
    const weightInput = document.getElementById('weight');
    if (weightInput) {
        weightInput.addEventListener('input', (e) => {
            // Remove non-numeric characters except decimal point
            let value = e.target.value.replace(/[^0-9.]/g, '');
            
            // Ensure only one decimal point
            const parts = value.split('.');
            if (parts.length > 2) {
                value = parts[0] + '.' + parts.slice(1).join('');
            }
            
            e.target.value = value;
        });

        weightInput.addEventListener('blur', (e) => {
            const value = parseFloat(e.target.value);
            if (!isNaN(value)) {
                e.target.value = value.toFixed(1);
            }
        });
    }

    // Mood Selection - Enhanced feedback
    const moodSelect = document.getElementById('mood');
    if (moodSelect) {
        moodSelect.addEventListener('change', (e) => {
            // Add visual feedback for mood selection
            const selectedMood = e.target.value;
            const moodEmoji = this.getMoodEmoji(selectedMood);
            
            // Update a mood indicator if it exists
            const moodIndicator = document.getElementById('mood-indicator');
            if (moodIndicator) {
                moodIndicator.textContent = moodEmoji;
                moodIndicator.style.transform = 'scale(1.2)';
                setTimeout(() => {
                    moodIndicator.style.transform = 'scale(1)';
                }, 200);
            }
        });
    }

    // ========================================
    // WINDOW & CONNECTIVITY EVENTS
    // ========================================
    
    // Window Resize - Update charts
    window.addEventListener('resize', () => {
        this.handleResize();
        
        // Debounced chart resize
        clearTimeout(this.resizeTimeout);
        this.resizeTimeout = setTimeout(() => {
            if (this.chartInitialized) {
                Object.values(this.charts).forEach(chart => {
                    if (chart && chart.resize) {
                        chart.resize();
                    }
                });
            }
        }, 250);
    });

    // Online Status
    window.addEventListener('online', () => {
        console.log('🌐 Connection restored');
        this.updateConnectionStatus(true);
        
        // Show success toast
        this.showToast('🌐 Verbindung wiederhergestellt', 'success');
        
        // Sync offline data
        setTimeout(() => {
            this.syncOfflineData();
        }, 1000);
    });

    // Offline Status
    window.addEventListener('offline', () => {
        console.log('📵 Connection lost');
        this.updateConnectionStatus(false);
        
        // Show warning toast
        this.showToast('📵 Offline-Modus aktiv', 'warning');
    });

    // ========================================
    // PWA & INSTALLATION
    // ========================================
    
    // PWA Install Button
    const installBtn = document.getElementById('install-btn');
    if (installBtn) {
        installBtn.addEventListener('click', () => {
            if (window.deferredPrompt) {
                window.deferredPrompt.prompt();
            }
        });
    }

    // ========================================
    // KEYBOARD SHORTCUTS
    // ========================================
    
    document.addEventListener('keydown', (e) => {
        // Ctrl/Cmd + S = Save form
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            e.preventDefault();
            const form = document.getElementById('health-form');
            if (form) {
                form.dispatchEvent(new Event('submit'));
            }
        }
        
        // Ctrl/Cmd + T = Toggle theme
        if ((e.ctrlKey || e.metaKey) && e.key === 't') {
            e.preventDefault();
            this.toggleTheme();
        }
        
        // Escape = Close any open dropdowns/modals
        if (e.key === 'Escape') {
            document.querySelectorAll('.dropdown').forEach(dropdown => {
                dropdown.blur();
            });
        }
    });

    // ========================================
    // NAVIGATION & UI INTERACTIONS
    // ========================================
    
    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // Enhanced button interactions
    document.querySelectorAll('.btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            // Add ripple effect
            const ripple = document.createElement('span');
            ripple.classList.add('ripple');
            this.appendChild(ripple);
            
            setTimeout(() => {
                ripple.remove();
            }, 600);
        });
    });

    // ========================================
    // FORM VALIDATION HELPERS
    // ========================================
    
    // Real-time form validation
    const inputs = form?.querySelectorAll('input, select, textarea');
    inputs?.forEach(input => {
        input.addEventListener('blur', () => {
            this.validateField(input);
        });
        
        input.addEventListener('input', () => {
            // Clear validation errors on input
            input.classList.remove('input-error');
            const errorMsg = input.parentNode.querySelector('.text-error');
            if (errorMsg) {
                errorMsg.remove();
            }
        });
    });

    // ========================================
    // CUSTOM EVENTS
    // ========================================
    
    // Listen for custom theme change events
    document.addEventListener('themeChanged', (e) => {
        console.log(`🎨 Theme changed to: ${e.detail.theme}`);
        
        // Update charts theme
        setTimeout(() => {
            this.updateChartsTheme();
        }, 100);
        
        // Dispatch to other components if needed
        if (window.updateComponentThemes) {
            window.updateComponentThemes(e.detail.theme);
        }
    });

    // Listen for data updates
    document.addEventListener('healthDataUpdated', () => {
        this.loadRecentActivities();
        setTimeout(() => {
            this.loadAndUpdateCharts();
        }, 300);
    });

    // ========================================
    // PERFORMANCE OPTIMIZATIONS
    // ========================================
    
    // Debounced scroll handler for performance
    let scrollTimeout;
    window.addEventListener('scroll', () => {
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(() => {
            // Handle scroll-based animations or lazy loading
            this.handleScroll();
        }, 16); // ~60fps
    });

    console.log('✅ All event listeners initialized successfully');
}

// ========================================
// HELPER METHODS (add these to your class)
// ========================================

validateField(field) {
    const value = field.value.trim();
    const type = field.type;
    let isValid = true;
    let errorMessage = '';

    // Basic validation rules
    if (field.hasAttribute('required') && !value) {
        isValid = false;
        errorMessage = 'Dieses Feld ist erforderlich';
    } else if (type === 'number') {
        const num = parseFloat(value);
        if (value && isNaN(num)) {
            isValid = false;
            errorMessage = 'Bitte geben Sie eine gültige Zahl ein';
        }
    }

    // Update field appearance
    if (isValid) {
        field.classList.remove('input-error');
        field.classList.add('input-success');
    } else {
        field.classList.add('input-error');
        field.classList.remove('input-success');
        
        // Show error message
        let errorEl = field.parentNode.querySelector('.text-error');
        if (!errorEl) {
            errorEl = document.createElement('div');
            errorEl.className = 'text-error text-sm mt-1';
            field.parentNode.appendChild(errorEl);
        }
        errorEl.textContent = errorMessage;
    }

    return isValid;
}

handleScroll() {
    // Implement scroll-based features like:
    // - Navbar background opacity
    // - Parallax effects
    // - Lazy loading charts
    const scrollY = window.scrollY;
    const navbar = document.querySelector('.navbar');
    
    if (navbar) {
        if (scrollY > 50) {
            navbar.classList.add('backdrop-blur-md', 'bg-base-100/80');
        } else {
            navbar.classList.remove('backdrop-blur-md', 'bg-base-100/80');
        }
    }
}

updateConnectionStatus(isOnline) {
    const statusElement = document.getElementById('connection-status');
    if (statusElement) {
        statusElement.className = isOnline 
            ? 'badge badge-success gap-1 hidden sm:flex'
            : 'badge badge-warning gap-1 hidden sm:flex';
        
        const statusText = statusElement.querySelector('span');
        const statusDot = statusElement.querySelector('div');
        
        if (statusText) {
            statusText.textContent = isOnline ? 'Online' : 'Offline';
        }
        
        if (statusDot) {
            statusDot.className = isOnline 
                ? 'w-2 h-2 bg-success rounded-full animate-pulse'
                : 'w-2 h-2 bg-warning rounded-full';
        }
    }
}

    // Theme wechseln (Zyklisch durch alle Themes)
    toggleTheme() {
        const currentIndex = this.availableThemes.indexOf(this.theme);
        const nextIndex = (currentIndex + 1) % this.availableThemes.length;
        this.setTheme(this.availableThemes[nextIndex]);
    }

    // Bestimmtes Theme setzen
    setTheme(themeName) {
        if (!this.availableThemes.includes(themeName)) {
            console.warn(`Theme "${themeName}" nicht verfügbar`);
            return;
        }

        this.theme = themeName;
        localStorage.setItem('healthTheme', this.theme);
        document.documentElement.setAttribute('data-theme', this.theme);
        
        this.updateThemeUI();
        this.updateChartsTheme();
        
        // Theme-Change Event für andere Komponenten
        document.dispatchEvent(new CustomEvent('themeChanged', { 
            detail: { theme: this.theme } 
        }));
    }

    // Theme-UI aktualisieren
    updateThemeUI() {
        const themeToggle = document.getElementById('theme-toggle');
        const themeIcon = document.getElementById('theme-icon');
        const themeText = document.getElementById('theme-text');
        
        // Icon und Text je nach Theme
        const themeConfig = {
            light: { icon: 'sun', text: 'Hell', class: 'text-yellow-500' },
            dark: { icon: 'moon', text: 'Dunkel', class: 'text-blue-400' },
            cupcake: { icon: 'heart', text: 'Cupcake', class: 'text-pink-500' },
            corporate: { icon: 'briefcase', text: 'Business', class: 'text-gray-600' }
        };

        const config = themeConfig[this.theme] || themeConfig.light;
        
        if (themeIcon) {
            themeIcon.setAttribute('data-lucide', config.icon);
            themeIcon.className = `w-5 h-5 ${config.class}`;
        }
        
        if (themeText) {
            themeText.textContent = config.text;
        }

        // Theme-Selector aktualisieren
        const themeButtons = document.querySelectorAll('[data-theme-btn]');
        themeButtons.forEach(btn => {
            const btnTheme = btn.getAttribute('data-theme-btn');
            btn.classList.toggle('btn-primary', btnTheme === this.theme);
            btn.classList.toggle('btn-ghost', btnTheme !== this.theme);
        });

        // Lucide Icons neu laden
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
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
