// Enhanced app.js with Goals and Progress Tracking
class SmartNotificationManager {
    constructor(healthTracker) {
        this.healthTracker = healthTracker;
        this.notificationQueue = [];
        this.activeNotifications = new Map();
        this.reminderIntervals = new Map();
        this.notificationsEnabled = false;
        
        this.initializeNotifications();
        this.setupReminderSchedule();
        this.startSmartChecks();
    }

    async initializeNotifications() {
        // Check if notifications are supported
        if (!('Notification' in window)) {
            console.log('ℹ️ Browser unterstützt keine Benachrichtigungen');
            return;
        }

        const permission = await this.checkNotificationPermission();
        if (permission === 'granted') {
            this.notificationsEnabled = true;
            this.setupReminders();
        } else if (permission === 'default') {
            // Show permission modal after 30 seconds
            setTimeout(() => this.showPermissionModal(), 30000);
        }
    }

    async checkNotificationPermission() {
        if (Notification.permission === 'granted') return 'granted';
        if (Notification.permission === 'denied') return 'denied';
        return 'default';
    }

    showPermissionModal() {
        const modal = document.getElementById('notification-permission-modal');
        const enableBtn = document.getElementById('enable-notifications-btn');
        
        if (modal && enableBtn) {
            modal.showModal();
            enableBtn.onclick = () => this.requestNotificationPermission();
        }
    }

    async requestNotificationPermission() {
        try {
            const permission = await Notification.requestPermission();
            if (permission === 'granted') {
                this.notificationsEnabled = true;
                this.setupReminders();
                this.showInAppNotification('🔔 Benachrichtigungen aktiviert!', 'success');
                document.getElementById('notification-permission-modal').close();
            } else {
                this.showInAppNotification('📵 Benachrichtigungen deaktiviert', 'warning');
            }
        } catch (error) {
            console.error('❌ Notification permission error:', error);
        }
    }

    setupReminderSchedule() {
        // Clear existing reminders
        this.reminderIntervals.forEach(interval => clearInterval(interval));
        this.reminderIntervals.clear();

        if (!this.notificationsEnabled) return;

        // Water reminder every 2 hours (9-21 Uhr)
        const waterReminder = setInterval(() => {
            const hour = new Date().getHours();
            if (hour >= 9 && hour <= 21 && hour % 2 === 1) {
                this.checkWaterIntake();
            }
        }, 60 * 60 * 1000); // Check every hour

        // Steps motivation at 15:00
        const stepsReminder = setInterval(() => {
            const now = new Date();
            if (now.getHours() === 15 && now.getMinutes() === 0) {
                this.checkStepsProgress();
            }
        }, 60 * 1000); // Check every minute

        // Sleep reminder at 22:00
        const sleepReminder = setInterval(() => {
            const now = new Date();
            if (now.getHours() === 22 && now.getMinutes() === 0) {
                this.sendSleepReminder();
            }
        }, 60 * 1000);

        this.reminderIntervals.set('water', waterReminder);
        this.reminderIntervals.set('steps', stepsReminder);
        this.reminderIntervals.set('sleep', sleepReminder);
    }

    setupReminders() {
        this.setupReminderSchedule();
        this.scheduleTrackingReminder();
    }

    scheduleTrackingReminder() {
        // Daily tracking reminder at 20:00 if no data today
        const trackingCheck = setInterval(() => {
            const now = new Date();
            if (now.getHours() === 20 && now.getMinutes() === 0) {
                this.checkTodayTracking();
            }
        }, 60 * 1000);
        
        this.reminderIntervals.set('tracking', trackingCheck);
    }

    async checkWaterIntake() {
        const todayData = await this.getTodayData();
        const currentWater = todayData?.waterIntake || 0;
        const goal = this.healthTracker.goals.waterGoal;
        
        if (currentWater < goal * 0.7) {
            this.sendNotification(
                '💧 Wasser-Erinnerung',
                `Du hast heute erst ${currentWater}L getrunken. Zeit für ein Glas Wasser!`,
                'water'
            );
        }
    }

    async checkStepsProgress() {
        const todayData = await this.getTodayData();
        const currentSteps = todayData?.steps || 0;
        const goal = this.healthTracker.goals.stepsGoal;
        
        if (currentSteps < goal * 0.6) {
            this.sendNotification(
                '🚶‍♂️ Bewegung tut gut!',
                `${currentSteps} Schritte geschafft. Wie wäre es mit einem kurzen Spaziergang?`,
                'steps'
            );
        } else if (currentSteps >= goal * 0.9) {
            this.sendNotification(
                '🎉 Fast geschafft!',
                `Nur noch ${goal - currentSteps} Schritte bis zum Tagesziel!`,
                'steps'
            );
        }
    }

    sendSleepReminder() {
        this.sendNotification(
            '🌙 Zeit fürs Bett',
            'Um dein Schlafziel zu erreichen, solltest du langsam ans Schlafen denken.',
            'sleep'
        );
    }

    async checkTodayTracking() {
        const todayData = await this.getTodayData();
        if (!todayData) {
            this.sendNotification(
                '📊 Vergiss nicht zu tracken!',
                'Du hast heute noch keine Gesundheitsdaten erfasst.',
                'tracking'
            );
        }
    }

    async getTodayData() {
        try {
            const today = new Date().toISOString().split('T')[0];
            const localData = JSON.parse(localStorage.getItem('healthData') || '[]');
            return localData.find(entry => entry.date === today);
        } catch (error) {
            return null;
        }
    }

    sendNotification(title, body, type = 'info', actions = []) {
        // Browser notification
        if (this.notificationsEnabled && Notification.permission === 'granted') {
            const notification = new Notification(title, {
                body,
                icon: '/icons/icon-192x192.png',
                badge: '/icons/icon-96x96.png',
                tag: type,
                requireInteraction: false,
                actions
            });

            notification.onclick = () => {
                window.focus();
                notification.close();
                this.handleNotificationClick(type);
            };

            // Auto-close after 10 seconds
            setTimeout(() => notification.close(), 10000);
        }

        // Always show in-app notification
        this.showInAppNotification(`${title}: ${body}`, this.getNotificationStyle(type));
    }

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

    handleNotificationClick(type) {
        switch (type) {
            case 'water':
            case 'steps':
            case 'sleep':
                document.getElementById('health-form')?.scrollIntoView({ behavior: 'smooth' });
                break;
            case 'tracking':
                document.getElementById('health-form')?.scrollIntoView({ behavior: 'smooth' });
                break;
        }
    }

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

        notification.className = `alert ${bgColors[type] || 'alert-info'} shadow-lg transform transition-all duration-300 translate-x-full`;
        notification.innerHTML = `
            <div class="flex-1">
                <span class="text-sm">${message}</span>
            </div>
            <button class="btn btn-ghost btn-xs" onclick="this.parentElement.remove()">
                <i data-lucide="x" class="w-3 h-3"></i>
            </button>
        `;

        container.appendChild(notification);

        // Trigger animation
        setTimeout(() => {
            notification.classList.remove('translate-x-full');
            if (typeof lucide !== 'undefined') lucide.createIcons();
        }, 100);

        // Auto-remove
        setTimeout(() => {
            if (notification.parentElement) {
                notification.classList.add('translate-x-full');
                setTimeout(() => notification.remove(), 300);
            }
        }, duration);

        this.activeNotifications.set(notificationId, notification);
        return notificationId;
    }

    startSmartChecks() {
        // Achievement checks every 5 minutes
        setInterval(() => this.checkAchievements(), 5 * 60 * 1000);
        
        // Motivational messages
        setInterval(() => this.sendMotivationalMessage(), 2 * 60 * 60 * 1000); // Every 2 hours
    }

    async checkAchievements() {
        const todayData = await this.getTodayData();
        if (!todayData) return;

        const achievements = [];
        
        if (todayData.steps >= this.healthTracker.goals.stepsGoal) {
            achievements.push('🎉 Schrittziel erreicht!');
        }
        
        if (todayData.waterIntake >= this.healthTracker.goals.waterGoal) {
            achievements.push('💧 Wasserziel geschafft!');
        }
        
        if (todayData.sleepHours >= this.healthTracker.goals.sleepGoal) {
            achievements.push('😴 Perfekter Schlaf!');
        }

        achievements.forEach(achievement => {
            this.sendNotification('Ziel erreicht! 🎯', achievement, 'achievement');
        });
    }

    sendMotivationalMessage() {
        const messages = [
            'Du machst das großartig! 💪',
            'Jeder Schritt zählt! 🚶‍♂️',
            'Bleib hydriert! 💧',
            'Gesundheit ist ein Marathon, kein Sprint! 🏃‍♂️',
            'Du investierst in dich selbst! ⭐'
        ];

        const randomMessage = messages[Math.floor(Math.random() * messages.length)];
        this.showInAppNotification(randomMessage, 'success', 3000);
    }
}

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
        this.notificationManager = new SmartNotificationManager(this);
        this.analytics = new AdvancedAnalytics(this);
        this.progressHub = new ProgressHub(this);
        setTimeout(() => {
    this.progressHub.loadViewData();
}, 1000);
        
        // Initialize charts safely after DOM is ready
        setTimeout(() => this.initializeAllCharts(), 800);

        setTimeout(() => {
        if (this.analytics) {
            this.analytics.showView('heatmap'); // Startet mit Heatmap-View
        }
    }, 2000); // Warte bis alle anderen Initialisierungen fertig sind
    }

    triggerAchievementNotification(message) {
    this.notificationManager.showInAppNotification(message, 'success', 6000);
}

    async initializeAllCharts() {
    try {
        if (typeof Chart === 'undefined') {
            console.warn('Chart.js not available');
            return;
        }
        
        // Destroy all existing charts first
        Object.keys(this.charts).forEach(key => {
            if (this.charts[key]) {
                this.charts[key].destroy();
                delete this.charts[key];
            }
        });
        
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

    // Destroy existing chart first
    if (this.charts.activity) {
        this.charts.activity.destroy();
        delete this.charts.activity;
    }

    const ctx = canvas.getContext('2d');
    
    this.charts.activity = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: [],
            datasets: [
                {
                    label: 'Schritte',
                    data: [],
                    backgroundColor: 'rgba(34, 197, 94, 0.8)',
                    borderColor: 'rgba(34, 197, 94, 1)',
                    borderWidth: 2,
                    borderRadius: 6,
                    yAxisID: 'y'
                },
                {
                    label: 'Wasser (L)',
                    data: [],
                    backgroundColor: 'rgba(59, 130, 246, 0.8)',
                    borderColor: 'rgba(59, 130, 246, 1)',
                    borderWidth: 2,
                    borderRadius: 6,
                    yAxisID: 'y1'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'top'
                },
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
                    grid: {
                        drawOnChartArea: false
                    },
                    ticks: {
                        color: this.theme === 'dark' ? '#9CA3AF' : '#6B7280',
                        callback: function(value) {
                            return value + 'L';
                        }
                    }
                },
                x: {
                    grid: {
                        display: false
                    },
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

    // Destroy existing chart first
    if (this.charts.sleep) {
        this.charts.sleep.destroy();
        delete this.charts.sleep;
    }

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
                legend: {
                    display: false
                },
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
                    grid: {
                        display: false
                    },
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

                this.updateWeeklySummary();
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
            setTimeout(() => {
            if (this.analytics) {
                this.analytics.loadViewData();
            }
        }, 500);
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
            
            // Clear existing data completely
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
            
            // Clear existing data completely
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
    
    modal.showModal();
}

    closeGoalsModal() {
    const modal = document.getElementById('goals-modal');
    if (modal) {
        modal.close();
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
    this.updateModalTheme();
}

    // Update modal theme when theme changes
updateModalTheme() {
    const modal = document.getElementById('goals-modal');
    if (!modal) return;
    
    // Force re-render of icons in modal after theme change
    setTimeout(() => {
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }, 100);
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
            setTimeout(() => {
                if (this.analytics) {
                    this.analytics.loadViewData();
                }
            }, 800);
        }, 500);

            this.resetForm();

        } catch (error) {
            console.error('❌ Fehler beim Speichern:', error);
            this.showToast('Fehler beim Speichern der Daten', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    // Goal Achievement Check
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

        achievements.forEach((achievement, index) => {
    setTimeout(() => {
        this.showToast(achievement, 'success');
        this.notificationManager.sendNotification('Ziel erreicht! 🎯', achievement, 'achievement');
    }, index * 1500);
});
        
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
    
    // Update goal progress indicators
    this.updateGoalProgressIndicators(data);
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

    // Update goal progress indicators
updateGoalProgressIndicators(data) {
    if (data.weight && this.goals.weightGoal) {
        const diff = Math.abs(data.weight - this.goals.weightGoal);
        const maxDiff = this.goals.weightGoal * 0.1; // 10% tolerance
        const progress = Math.max(0, Math.min(100, ((maxDiff - diff) / maxDiff) * 100));
        const progressEl = document.getElementById('weight-goal-progress');
        if (progressEl) {
            progressEl.style.setProperty('--value', Math.round(progress));
            progressEl.textContent = Math.round(progress) + '%';
        }
    }

    if (data.steps) {
        const progress = Math.min((data.steps / this.goals.stepsGoal) * 100, 100);
        const progressEl = document.getElementById('steps-goal-progress');
        if (progressEl) {
            progressEl.style.setProperty('--value', Math.round(progress));
            progressEl.textContent = Math.round(progress) + '%';
        }
    }

    if (data.waterIntake) {
        const progress = Math.min((data.waterIntake / this.goals.waterGoal) * 100, 100);
        const progressEl = document.getElementById('water-goal-progress');
        if (progressEl) {
            progressEl.style.setProperty('--value', Math.round(progress));
            progressEl.textContent = Math.round(progress) + '%';
        }
    }

    if (data.sleepHours) {
        const progress = Math.min((data.sleepHours / this.goals.sleepGoal) * 100, 100);
        const progressEl = document.getElementById('sleep-goal-progress');
        if (progressEl) {
            progressEl.style.setProperty('--value', Math.round(progress));
            progressEl.textContent = Math.round(progress) + '%';
        }
    }
}

// Weekly Summary Methods
async updateWeeklySummary() {
    try {
        let allData = [];
        if (navigator.onLine) {
            const response = await fetch(`/api/health-data/${this.userId}`);
            if (response.ok) {
                allData = await response.json();
            }
        }
        
        if (allData.length === 0) {
            const localData = JSON.parse(localStorage.getItem('healthData') || '[]');
            allData = Array.isArray(localData) ? localData : [];
        }

        this.calculateWeeklyStats(allData);
    } catch (error) {
        console.error('❌ Error updating weekly summary:', error);
    }
}

calculateWeeklyStats(allData) {
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));
    const twoWeeksAgo = new Date(now.getTime() - (14 * 24 * 60 * 60 * 1000));

    // Current week data
    const currentWeek = allData.filter(entry => {
        const entryDate = new Date(entry.date);
        return entryDate >= oneWeekAgo && entryDate <= now;
    });

    // Previous week data for comparison
    const previousWeek = allData.filter(entry => {
        const entryDate = new Date(entry.date);
        return entryDate >= twoWeeksAgo && entryDate < oneWeekAgo;
    });

    // Calculate averages
    const currentStats = this.calculateAverages(currentWeek);
    const previousStats = this.calculateAverages(previousWeek);

    // Update UI
    this.updateWeeklyStatsUI(currentStats, previousStats, currentWeek);
    this.generateWeeklyInsights(currentStats, currentWeek);
}

calculateAverages(weekData) {
    if (weekData.length === 0) return { steps: 0, water: 0, sleep: 0 };

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

updateWeeklyStatsUI(current, previous, currentWeekData) {
    // Update averages
    document.getElementById('avg-steps').textContent = current.steps.toLocaleString();
    document.getElementById('avg-water').textContent = current.water + 'L';
    document.getElementById('avg-sleep').textContent = current.sleep + 'h';

    // Calculate and show trends
    this.updateTrendIndicator('steps-trend', current.steps, previous.steps);
    this.updateTrendIndicator('water-trend', current.water, previous.water);
    this.updateTrendIndicator('sleep-trend', current.sleep, previous.sleep);

    // Calculate goals hit
    const goalsHit = this.calculateGoalsHit(currentWeekData);
    document.getElementById('goals-hit').textContent = `${goalsHit}/${currentWeekData.length}`;
    document.getElementById('goals-percentage').textContent = 
        currentWeekData.length > 0 ? `${Math.round((goalsHit / currentWeekData.length) * 100)}% der Tage` : '0% der Tage';
}

updateTrendIndicator(elementId, current, previous) {
    const element = document.getElementById(elementId);
    if (!element || previous === 0) {
        element.textContent = 'Erste Woche';
        return;
    }

    const change = ((current - previous) / previous) * 100;
    const isPositive = change > 0;
    const icon = isPositive ? '↗️' : change < 0 ? '↘️' : '➡️';
    
    element.textContent = `${icon} ${Math.abs(change).toFixed(1)}% zu letzter Woche`;
    element.className = `stat-desc ${isPositive ? 'text-success' : change < 0 ? 'text-error' : 'text-base-content/60'}`;
}

calculateGoalsHit(weekData) {
    return weekData.reduce((count, entry) => {
        let goalsHit = 0;
        if (entry.steps >= this.goals.stepsGoal) goalsHit++;
        if (entry.waterIntake >= this.goals.waterGoal) goalsHit++;
        if (entry.sleepHours >= this.goals.sleepGoal) goalsHit++;
        return count + (goalsHit >= 2 ? 1 : 0); // Mindestens 2 von 3 Zielen erreicht
    }, 0);
}

generateWeeklyInsights(stats, weekData) {
    const insights = [];
    
    // Steps insights
    if (stats.steps >= this.goals.stepsGoal) {
        insights.push('🚶‍♂️ Großartig! Du erreichst dein Schrittziel konstant.');
    } else if (stats.steps >= this.goals.stepsGoal * 0.8) {
        insights.push('👍 Du bist nah an deinem Schrittziel. Nur noch etwas mehr!');
    } else {
        insights.push('📈 Versuche täglich ein paar mehr Schritte zu gehen.');
    }

    // Water insights
    if (stats.water >= this.goals.waterGoal) {
        insights.push('💧 Perfekte Hydration! Du trinkst ausreichend Wasser.');
    } else {
        insights.push('🥤 Denke daran, regelmäßig zu trinken.');
    }

    // Sleep insights
    if (stats.sleep >= this.goals.sleepGoal) {
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

    document.getElementById('weekly-insights').innerHTML = 
        insights.map(insight => `<p>${insight}</p>`).join('');
}

exportWeeklyData() {
    // Simple CSV export functionality
    this.showToast('📊 Export-Funktion wird entwickelt...', 'info');
}

shareProgress() {
    // Simple share functionality
    if (navigator.share) {
        navigator.share({
            title: 'Mein Health Tracker Fortschritt',
            text: 'Schau dir meine wöchentlichen Gesundheitsziele an!',
            url: window.location.href
        });
    } else {
        this.showToast('📱 Teilen-Funktion in diesem Browser nicht verfügbar', 'warning');
    }
}
}

class ProgressHub {
    constructor(healthTracker) {
        this.healthTracker = healthTracker;
        this.currentView = 'today';
        this.achievements = new Map();
        this.streaks = new Map();
        
        this.initializeAchievements();
        this.loadStreakData();
    }

    showView(viewName) {
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
        document.getElementById(`tab-${viewName}`)?.classList.add('tab-active');
        
        this.currentView = viewName;
        this.loadViewData();
    }

    async loadViewData() {
        const data = await this.getHealthData();
        
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
    }

    async getHealthData() {
        try {
            let allData = [];
            
            if (navigator.onLine) {
                const response = await fetch(`/api/health-data/${this.healthTracker.userId}`);
                if (response.ok) {
                    allData = await response.json();
                }
            }
            
            if (allData.length === 0) {
                const localData = JSON.parse(localStorage.getItem('healthData') || '[]');
                allData = Array.isArray(localData) ? localData : [];
            }
            
            return allData.sort((a, b) => new Date(b.date) - new Date(a.date));
        } catch (error) {
            console.error('❌ Error loading health data:', error);
            return [];
        }
    }

    updateTodayView(data) {
        const today = new Date().toISOString().split('T')[0];
        const todayData = data.find(entry => entry.date === today) || {};
        
        // Update progress cards
        this.updateProgressCard('steps', todayData.steps || 0, this.healthTracker.goals.stepsGoal);
        this.updateProgressCard('water', todayData.waterIntake || 0, this.healthTracker.goals.waterGoal);
        this.updateProgressCard('sleep', todayData.sleepHours || 0, this.healthTracker.goals.sleepGoal);
        
        // Calculate overall score
        const overallScore = this.calculateOverallScore(todayData);
        this.updateProgressCard('score', overallScore, 100);
        
        // Generate quick actions
        this.generateQuickActions(todayData);
    }

    updateProgressCard(type, current, goal) {
        const percentage = Math.min((current / goal) * 100, 100);
        const badge = document.getElementById(`${type}-progress-badge`);
        const display = document.getElementById(`today-${type}-display`);
        const progressBar = document.getElementById(`${type}-progress-bar`);
        const motivation = document.getElementById(`${type}-motivation`);
        
        if (badge) badge.textContent = Math.round(percentage) + '%';
        
        if (display) {
            if (type === 'score') {
                display.textContent = Math.round(current);
            } else {
                const unit = type === 'steps' ? '' : type === 'water' ? 'L' : 'h';
                display.textContent = current.toLocaleString() + unit;
            }
        }
        
        if (progressBar) {
            progressBar.value = percentage;
        }
        
        if (motivation) {
            motivation.textContent = this.getMotivationalMessage(type, percentage);
        }
    }

    calculateOverallScore(todayData) {
        const goals = this.healthTracker.goals;
        let score = 0;
        let maxScore = 0;
        
        // Steps (40 points max)
        if (goals.stepsGoal) {
            maxScore += 40;
            score += Math.min((todayData.steps || 0) / goals.stepsGoal, 1) * 40;
        }
        
        // Water (30 points max)
        if (goals.waterGoal) {
            maxScore += 30;
            score += Math.min((todayData.waterIntake || 0) / goals.waterGoal, 1) * 30;
        }
        
        // Sleep (30 points max)
        if (goals.sleepGoal) {
            maxScore += 30;
            score += Math.min((todayData.sleepHours || 0) / goals.sleepGoal, 1) * 30;
        }
        
        return maxScore > 0 ? (score / maxScore) * 100 : 0;
    }

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

    generateQuickActions(todayData) {
        const container = document.getElementById('today-quick-actions');
        if (!container) return;
        
        const actions = [];
        
        // Check what's missing today
        if (!todayData.steps || todayData.steps < this.healthTracker.goals.stepsGoal * 0.5) {
            actions.push({ text: '🚶‍♂️ Spaziergang machen', action: 'takeWalk' });
        }
        
        if (!todayData.waterIntake || todayData.waterIntake < this.healthTracker.goals.waterGoal * 0.7) {
            actions.push({ text: '💧 Wasser trinken', action: 'drinkWater' });
        }
        
        if (!todayData.weight) {
            actions.push({ text: '⚖️ Gewicht erfassen', action: 'recordWeight' });
        }
        
        if (!todayData.mood) {
            actions.push({ text: '😊 Stimmung festhalten', action: 'recordMood' });
        }
        
        // Always show data entry option
        actions.push({ text: '📊 Daten eingeben', action: 'enterData' });
        
        container.innerHTML = actions.map(action => `
            <button class="btn btn-sm btn-outline gap-2" onclick="window.healthTracker.progressHub.handleQuickAction('${action.action}')">
                ${action.text}
            </button>
        `).join('');
    }

    handleQuickAction(action) {
        switch (action) {
            case 'takeWalk':
                this.healthTracker.notificationManager.showInAppNotification('🚶‍♂️ Zeit für einen Spaziergang! Jeder Schritt bringt dich näher zu deinem Ziel.', 'info');
                break;
            case 'drinkWater':
                this.healthTracker.notificationManager.showInAppNotification('💧 Trinke ein Glas Wasser! Dein Körper wird es dir danken.', 'info');
                break;
            case 'recordWeight':
            case 'recordMood':
            case 'enterData':
                document.getElementById('health-form')?.scrollIntoView({ behavior: 'smooth' });
                break;
        }
    }

    // Weitere Methoden für andere Views...
    updateWeekView(data) {
        // Implementierung für Wochenansicht
        console.log('🗓️ Updating week view...');
    }

    updateAchievementsView(data) {
        // Implementierung für Achievements
        console.log('🏆 Updating achievements view...');
    }

    updateStreaksView(data) {
        // Implementierung für Streaks
        console.log('🔥 Updating streaks view...');
    }

    initializeAchievements() {
        // Achievement-System initialisieren
        console.log('🏆 Initializing achievements...');
    }

    loadStreakData() {
        // Streak-Daten laden
        console.log('🔥 Loading streak data...');
    }

    resetProgress() {
        if (confirm('Möchtest du wirklich den gesamten Fortschritt zurücksetzen?')) {
            localStorage.removeItem('healthData');
            localStorage.removeItem('userGoals');
            this.healthTracker.notificationManager.showInAppNotification('🔄 Fortschritt zurückgesetzt!', 'warning');
            location.reload();
        }
    }

    shareProgress() {
        const today = new Date().toLocaleDateString('de-DE');
        const shareText = `🎯 Mein Health Tracker Fortschritt vom ${today}\n\nBleib gesund und aktiv! 💪`;
        
        if (navigator.share) {
            navigator.share({
                title: 'Health Tracker Fortschritt',
                text: shareText,
                url: window.location.href
            });
        } else {
            navigator.clipboard.writeText(shareText);
            this.healthTracker.notificationManager.showInAppNotification('📋 Fortschritt in Zwischenablage kopiert!', 'success');
        }
    }
}

class AdvancedAnalytics {
    constructor(healthTracker) {
        this.healthTracker = healthTracker;
        this.currentView = 'heatmap';
        this.trendPeriod = 90;
        this.charts = {};
        
        this.initEventListeners();
    }

    initEventListeners() {
        // Heatmap metric selector
    const heatmapSelect = document.getElementById('heatmap-metric');
    if (heatmapSelect) {
        heatmapSelect.addEventListener('change', (e) => {
            console.log('📊 Changing heatmap metric to:', e.target.value);
            this.generateHeatmap(this.currentData || []);
        });
    }
}

    showView(viewName) {
        // Hide all views
        document.querySelectorAll('.analytics-view').forEach(view => {
            view.classList.add('hidden');
        });
        
        // Show selected view
        const targetView = document.getElementById(`view-${viewName}`);
        if (targetView) {
            targetView.classList.remove('hidden');
        }
        
        // Update tab styles
        document.querySelectorAll('.tab').forEach(tab => {
            tab.classList.remove('tab-active');
        });
        document.getElementById(`tab-${viewName}`)?.classList.add('tab-active');
        
        this.currentView = viewName;
        
        // Load view data
        setTimeout(() => this.loadViewData(), 100);
    }

    async loadViewData() {
        const data = await this.getAnalyticsData();
    this.currentData = data; // Für Metrik-Wechsel speichern
    
    switch (this.currentView) {
        case 'heatmap':
            this.generateHeatmap(data);
            break;
            case 'correlation':
                this.generateCorrelationAnalysis(data);
                break;
            case 'trends':
                this.generateTrendAnalysis(data);
                break;
        }
    }

    async getAnalyticsData() {
    try {
        let allData = [];
        
        if (navigator.onLine) {
            const response = await fetch(`/api/health-data/${this.healthTracker.userId}`);
            if (response.ok) {
                allData = await response.json();
                console.log('🌐 Server data loaded:', allData.length, 'entries');
            }
        }
        
        if (allData.length === 0) {
            const localData = JSON.parse(localStorage.getItem('healthData') || '[]');
            allData = Array.isArray(localData) ? localData : [];
            console.log('💾 Local data loaded:', allData.length, 'entries');
        }
        
        // Normalize date formats
        allData = allData.map(entry => ({
            ...entry,
            date: entry.date.includes('T') ? entry.date.split('T')[0] : entry.date
        }));
        
        return allData.sort((a, b) => new Date(b.date) - new Date(a.date));
    } catch (error) {
        console.error('❌ Error loading analytics data:', error);
        return [];
    }
}

    generateHeatmap(data) {
    const container = document.getElementById('activity-heatmap');
    const metric = document.getElementById('heatmap-metric')?.value || 'steps';
    
    if (!container) {
        console.error('❌ Heatmap container not found');
        return;
    }

    console.log('📊 Generating heatmap for metric:', metric, 'with', data.length, 'data points');
    console.log('📊 Sample data:', data.slice(0, 3));

    if (data.length === 0) {
        container.innerHTML = '<p class="text-center text-base-content/60 py-8">Keine Daten verfügbar</p>';
        return;
    }

    // Generate last 12 weeks
    const weeks = this.generateWeekData(data, metric);
    
    const weekdays = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
    
    container.innerHTML = `
        <div class="space-y-2">
            <!-- Weekday headers -->
            <div class="grid grid-cols-7 gap-1 text-xs text-center mb-3 font-medium">
                ${weekdays.map(day => `<span class="text-base-content/70">${day}</span>`).join('')}
            </div>
            
            <!-- Heatmap weeks -->
            <div class="space-y-1">
                ${weeks.map((week, weekIndex) => `
                    <div class="grid grid-cols-7 gap-1" data-week="${weekIndex}">
                        ${week.map((day, dayIndex) => {
                            const colorClass = this.getHeatmapColor(day.value, metric);
                            // Benutze deutsches Datum für Tooltip
                            const tooltipText = `${day.germanDate}: ${day.display}`;
                            
                            return `
                                <div class="w-3 h-3 md:w-4 md:h-4 rounded-sm ${colorClass} 
                                           hover:ring-2 hover:ring-primary/50 cursor-pointer transition-all
                                           tooltip tooltip-top" 
                                     data-tip="${tooltipText}"
                                     data-value="${day.value}"
                                     data-date="${day.date}"
                                     data-raw="${day.rawData ? 'has-data' : 'no-data'}">
                                </div>
                            `;
                        }).join('')}
                    </div>
                `).join('')}
            </div>
            
            <!-- Summary Stats -->
            <div class="mt-4 text-center">
                <div class="text-sm text-base-content/80">
                    ${this.getHeatmapSummary(weeks, metric)}
                </div>
            </div>
        </div>
    `;

    // Debug: Log summary info
    const allDays = weeks.flat();
    const daysWithData = allDays.filter(day => day.value > 0);
    console.log('📊 Heatmap Summary:', {
        totalDays: allDays.length,
        daysWithData: daysWithData.length,
        daysWithRawData: allDays.filter(day => day.rawData).length,
        metric: metric
    });
}

debugHeatmap() {
    console.log('🔍 === HEATMAP DEBUG ===');
    
    // Check data availability
    const localData = JSON.parse(localStorage.getItem('healthData') || '[]');
    console.log('📦 Local storage data:', localData.length, 'entries');
    console.log('📦 Sample local data:', localData.slice(0, 3));
    
    // Check current analytics data
    console.log('📊 Current analytics data:', this.currentData?.length || 0, 'entries');
    
    // Check today's date handling
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    console.log('📅 Today:', {
        date: today,
        string: todayStr,
        dayOfWeek: today.getDay(),
        germanFormat: today.toLocaleDateString('de-DE')
    });
    
    // Check if today's data exists
    const todayData = (this.currentData || localData).find(entry => {
        const entryDate = entry.date.includes('T') ? entry.date.split('T')[0] : entry.date;
        return entryDate === todayStr;
    });
    console.log('📅 Today\'s data found:', !!todayData, todayData);
    
    // Force regenerate with local data if needed
    if (!this.currentData || this.currentData.length === 0) {
        console.log('🔄 Using local data for heatmap');
        this.currentData = localData;
    }
    
    this.generateHeatmap(this.currentData || localData);
}

    generateWeekData(data, metric) {
    const weeks = [];
    const today = new Date();
    
    console.log('📊 Generating week data for metric:', metric);
    console.log('📊 Available data dates:', data.map(d => d.date).slice(0, 10));
    
    // Generate 12 weeks of data (84 days)
    for (let weekOffset = 11; weekOffset >= 0; weekOffset--) {
        const week = [];
        
        // Berechne den Montag der aktuellen Woche
        const startOfCurrentWeek = new Date(today);
        const dayOfWeek = today.getDay(); // 0 = Sonntag, 1 = Montag, etc.
        const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Sonntag = 6 Tage zurück
        startOfCurrentWeek.setDate(today.getDate() - daysToMonday);
        
        // Berechne den Montag der Zielwoche
        const mondayOfWeek = new Date(startOfCurrentWeek);
        mondayOfWeek.setDate(startOfCurrentWeek.getDate() - (weekOffset * 7));
        
        // Generiere 7 Tage ab diesem Montag
        for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
            const date = new Date(mondayOfWeek);
            date.setDate(mondayOfWeek.getDate() + dayOffset);
            
            // Deutsches Datumsformat: YYYY-MM-DD
            const dateStr = date.toISOString().split('T')[0];
            
            // Finde passende Daten in den gespeicherten Daten
            const dayData = data.find(entry => {
                // Normalisiere beide Daten für Vergleich
                const entryDate = entry.date.includes('T') 
                    ? entry.date.split('T')[0] 
                    : entry.date;
                return entryDate === dateStr;
            });
            
            let value = 0;
            let display = 'Keine Daten';
            
            if (dayData) {
                switch (metric) {
                    case 'steps':
                        value = dayData.steps || 0;
                        display = value > 0 ? `${value.toLocaleString()} Schritte` : 'Keine Schritte erfasst';
                        break;
                    case 'water':
                        value = dayData.waterIntake || 0;
                        display = value > 0 ? `${value}L Wasser` : 'Kein Wasser erfasst';
                        break;
                    case 'sleep':
                        value = dayData.sleepHours || 0;
                        display = value > 0 ? `${value}h Schlaf` : 'Kein Schlaf erfasst';
                        break;
                    case 'mood':
                        const moodValues = { terrible: 1, bad: 2, neutral: 3, good: 4, excellent: 5 };
                        value = moodValues[dayData.mood] || 0;
                        display = dayData.mood ? `Stimmung: ${dayData.mood}` : 'Keine Stimmung erfasst';
                        break;
                    default:
                        value = 0;
                        display = 'Unbekannte Metrik';
                }
            }
            
            week.push({ 
                date: dateStr,
                germanDate: date.toLocaleDateString('de-DE'), // Deutsches Format für Anzeige
                value, 
                display,
                dayOfWeek: date.getDay(),
                rawData: dayData || null
            });
        }
        
        weeks.push(week);
    }
    
    console.log('📅 Generated', weeks.length, 'weeks');
    console.log('📅 First week sample:', weeks[0]);
    console.log('📅 Today should be:', today.toLocaleDateString('de-DE'), 'Day:', today.getDay());
    
    return weeks;
}

    getHeatmapColor(value, metric) {
    if (value === 0 || value === null || value === undefined) {
        return 'bg-base-300/50 border border-base-300';
    }
    
    let intensity = 0;
    let goal = 1;
    
    switch (metric) {
        case 'steps':
            goal = this.healthTracker.goals.stepsGoal;
            intensity = Math.min(value / goal, 1.5); // Allow over 100%
            break;
        case 'water':
            goal = this.healthTracker.goals.waterGoal;
            intensity = Math.min(value / goal, 1.5);
            break;
        case 'sleep':
            goal = this.healthTracker.goals.sleepGoal;
            intensity = Math.min(value / goal, 1.2);
            break;
        case 'mood':
            intensity = value / 5; // 1-5 scale
            break;
        default:
            intensity = 0;
    }
    
    // Color intensity based on goal achievement
    if (intensity <= 0.2) return 'bg-success/20 hover:bg-success/30';
    if (intensity <= 0.4) return 'bg-success/40 hover:bg-success/50';
    if (intensity <= 0.6) return 'bg-success/60 hover:bg-success/70';
    if (intensity <= 0.8) return 'bg-success/80 hover:bg-success/90';
    if (intensity < 1.0) return 'bg-success hover:bg-success/90';
    
    // Over-achievement
    return 'bg-emerald-500 hover:bg-emerald-400 ring-1 ring-emerald-400';
}

getHeatmapSummary(weeks, metric) {
    const allDays = weeks.flat();
    const daysWithData = allDays.filter(day => day.value > 0);
    const totalDays = allDays.length;
    const percentage = Math.round((daysWithData.length / totalDays) * 100);
    
    const avg = daysWithData.length > 0 
        ? (daysWithData.reduce((sum, day) => sum + day.value, 0) / daysWithData.length)
        : 0;
    
    let unit = '';
    switch (metric) {
        case 'steps': unit = ' Schritte'; break;
        case 'water': unit = 'L'; break;
        case 'sleep': unit = 'h'; break;
        case 'mood': unit = '/5'; break;
    }
    
    return `${daysWithData.length}/${totalDays} Tage mit Daten (${percentage}%) • Ø ${avg.toFixed(1)}${unit}`;
}

    generateCorrelationAnalysis(data) {
        const insights = this.calculateCorrelations(data);
        
        document.getElementById('correlation-results').innerHTML = insights.map(insight => 
            `<p class="mb-2">${insight}</p>`
        ).join('');

        // Update strongest correlation
        const strongest = this.findStrongestCorrelation(data);
        document.getElementById('strongest-correlation').textContent = strongest.pair;
        document.getElementById('correlation-strength').textContent = strongest.strength;

        this.renderCorrelationChart(data);
    }

    calculateCorrelations(data) {
        if (data.length < 10) return ['Nicht genug Daten für Korrelationsanalyse'];
        
        const insights = [];
        
        // Steps vs Sleep correlation
        const stepsVsSleep = this.pearsonCorrelation(
            data.map(d => d.steps || 0),
            data.map(d => d.sleepHours || 0)
        );
        
        if (Math.abs(stepsVsSleep) > 0.3) {
            insights.push(`🚶‍♂️💤 ${stepsVsSleep > 0 ? 'Positive' : 'Negative'} Korrelation zwischen Schritten und Schlaf (${(stepsVsSleep * 100).toFixed(0)}%)`);
        }
        
        // Water vs Mood correlation
        const waterVsMood = this.pearsonCorrelation(
            data.map(d => d.waterIntake || 0),
            data.map(d => this.moodToNumber(d.mood))
        );
        
        if (Math.abs(waterVsMood) > 0.2) {
            insights.push(`💧😊 Wasserzufuhr korreliert mit Stimmung (${(waterVsMood * 100).toFixed(0)}%)`);
        }
        
        // Sleep vs Mood correlation
        const sleepVsMood = this.pearsonCorrelation(
            data.map(d => d.sleepHours || 0),
            data.map(d => this.moodToNumber(d.mood))
        );
        
        if (Math.abs(sleepVsMood) > 0.2) {
            insights.push(`😴😊 Besserer Schlaf führt zu besserer Stimmung (${(sleepVsMood * 100).toFixed(0)}%)`);
        }
        
        return insights.length > 0 ? insights : ['Keine signifikanten Korrelationen gefunden'];
    }

    pearsonCorrelation(x, y) {
        const n = x.length;
        if (n === 0) return 0;
        
        const sumX = x.reduce((a, b) => a + b, 0);
        const sumY = y.reduce((a, b) => a + b, 0);
        const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
        const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);
        const sumY2 = y.reduce((sum, yi) => sum + yi * yi, 0);
        
        const numerator = n * sumXY - sumX * sumY;
        const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
        
        return denominator === 0 ? 0 : numerator / denominator;
    }

    moodToNumber(mood) {
        const moodMap = { terrible: 1, bad: 2, neutral: 3, good: 4, excellent: 5 };
        return moodMap[mood] || 3;
    }

    findStrongestCorrelation(data) {
        const correlations = [
            { pair: 'Schritte ↔ Schlaf', value: this.pearsonCorrelation(data.map(d => d.steps || 0), data.map(d => d.sleepHours || 0)) },
            { pair: 'Wasser ↔ Stimmung', value: this.pearsonCorrelation(data.map(d => d.waterIntake || 0), data.map(d => this.moodToNumber(d.mood))) },
            { pair: 'Schlaf ↔ Stimmung', value: this.pearsonCorrelation(data.map(d => d.sleepHours || 0), data.map(d => this.moodToNumber(d.mood))) }
        ];
        
        const strongest = correlations.reduce((max, curr) => 
            Math.abs(curr.value) > Math.abs(max.value) ? curr : max
        );
        
        return {
            pair: strongest.pair,
            strength: `${(Math.abs(strongest.value) * 100).toFixed(0)}% ${strongest.value > 0 ? 'positiv' : 'negativ'}`
        };
    }

    renderCorrelationChart(data) {
        const canvas = document.getElementById('correlation-chart');
        if (!canvas || typeof Chart === 'undefined') return;
        
        const ctx = canvas.getContext('2d');
        
        if (this.charts.correlation) {
            this.charts.correlation.destroy();
        }
        
        this.charts.correlation = new Chart(ctx, {
            type: 'scatter',
            data: {
                datasets: [{
                    label: 'Schritte vs Schlaf',
                    data: data.map(d => ({ x: d.steps || 0, y: d.sleepHours || 0 })),
                    backgroundColor: 'rgba(99, 102, 241, 0.6)',
                    borderColor: 'rgba(99, 102, 241, 1)',
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: (context) => `${context.parsed.x} Schritte, ${context.parsed.y}h Schlaf`
                        }
                    }
                },
                scales: {
                    x: { title: { display: true, text: 'Schritte' } },
                    y: { title: { display: true, text: 'Schlaf (Stunden)' } }
                }
            }
        });
    }

    generateTrendAnalysis(data) {
        const periodData = data.slice(0, this.trendPeriod);
        this.renderTrendChart(periodData);
        this.updateTrendStats(periodData);
    }

    renderTrendChart(data) {
        const canvas = document.getElementById('trends-chart');
        if (!canvas || typeof Chart === 'undefined') return;
        
        const ctx = canvas.getContext('2d');
        
        if (this.charts.trends) {
            this.charts.trends.destroy();
        }
        
        const sortedData = data.sort((a, b) => new Date(a.date) - new Date(b.date));
        
        this.charts.trends = new Chart(ctx, {
            type: 'line',
            data: {
                labels: sortedData.map(d => new Date(d.date).toLocaleDateString('de-DE', { month: 'short', day: 'numeric' })),
                datasets: [
                    {
                        label: 'Schritte',
                        data: sortedData.map(d => d.steps || 0),
                        borderColor: 'rgb(34, 197, 94)',
                        backgroundColor: 'rgba(34, 197, 94, 0.1)',
                        tension: 0.4,
                        yAxisID: 'y'
                    },
                    {
                        label: 'Wasser (L)',
                        data: sortedData.map(d => (d.waterIntake || 0) * 1000), // Scale for visibility
                        borderColor: 'rgb(59, 130, 246)',
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                        tension: 0.4,
                        yAxisID: 'y1'
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: false,
            resizeDelay: 0,
            plugins: { 
                legend: { display: true }
            },
            scales: {
                y: { type: 'linear', display: true, position: 'left' },
                y1: { 
                    type: 'linear', 
                    display: true, 
                    position: 'right', 
                    grid: { drawOnChartArea: false } 
                }
            },
            // ➕ RESIZE PROTECTION:
            onResize: () => {
                // Prevent infinite resize loops
                return;
                }
            }
        });
    }

    updateTrendStats(data) {
        const container = document.getElementById('trend-stats');
        if (!container) return;
        
        const avgSteps = data.reduce((sum, d) => sum + (d.steps || 0), 0) / data.length;
        const avgWater = data.reduce((sum, d) => sum + (d.waterIntake || 0), 0) / data.length;
        const avgSleep = data.reduce((sum, d) => sum + (d.sleepHours || 0), 0) / data.length;
        
        container.innerHTML = `
            <div class="stat bg-base-200">
                <div class="stat-title">Ø Schritte</div>
                <div class="stat-value text-success">${Math.round(avgSteps).toLocaleString()}</div>
                <div class="stat-desc">Letzten ${this.trendPeriod} Tage</div>
            </div>
            <div class="stat bg-base-200">
                <div class="stat-title">Ø Wasser</div>
                <div class="stat-value text-info">${avgWater.toFixed(1)}L</div>
                <div class="stat-desc">Täglich</div>
            </div>
            <div class="stat bg-base-200">
                <div class="stat-title">Ø Schlaf</div>
                <div class="stat-value text-warning">${avgSleep.toFixed(1)}h</div>
                <div class="stat-desc">Pro Nacht</div>
            </div>
        `;
    }

    setTrendPeriod(days) {
        this.trendPeriod = days;
        
        // Update button styles
        document.querySelectorAll('#view-trends .btn').forEach(btn => {
            btn.classList.remove('btn-active');
        });
        event.target.classList.add('btn-active');
        
        this.loadViewData();
    }
}

// App initialisieren wenn DOM bereit ist
document.addEventListener('DOMContentLoaded', () => {
    window.healthTracker = new HealthTrackerPro();
    console.log('🚀 Health Tracker Pro mit Goals-System initialisiert');
});
