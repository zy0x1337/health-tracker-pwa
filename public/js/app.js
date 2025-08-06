// Enhanced app.js with Goals and Progress Tracking
class SmartNotificationManager {
    constructor(healthTracker) {
        this.healthTracker = healthTracker;
        this.notificationQueue = [];
        this.activeNotifications = new Map();
        this.reminderIntervals = new Map();
        this.notificationsEnabled = false;
        this.lastNotifications = new Map(); // Duplikat-Schutz
        this.notificationStates = new Map(); // Persistent states
        this.maxNotificationsPerHour = 5;
        this.notificationCounts = new Map();
        
        this.initializeNotifications();
        this.setupReminderSchedule();
        this.startSmartChecks();
        this.loadNotificationState();

        // Save state periodically and on page unload
setInterval(() => this.saveNotificationState(), 300000); // Every 5 minutes
window.addEventListener('beforeunload', () => this.saveNotificationState());
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
        // Duplikat-Schutz: Prüfe ob gleiche Notification kürzlich gesendet wurde
        // Enhanced duplicate prevention with rate limiting
const notificationKey = `${type}-${title}`;
const now = Date.now();
const hour = Math.floor(now / 3600000); // Current hour

// Check rate limit per hour
const hourKey = `${hour}-${type}`;
const currentCount = this.notificationCounts.get(hourKey) || 0;
if (currentCount >= this.maxNotificationsPerHour) {
    console.log(`🚫 Rate limit exceeded for ${type} notifications`);
    return;
}

// Check for recent duplicates (more sophisticated)
const lastSent = this.lastNotifications.get(notificationKey);
const cooldownPeriod = type === 'achievement' ? 300000 : 30000; // 5min for achievements, 30s others

if (lastSent && (now - lastSent) < cooldownPeriod) {
    console.log(`🚫 Blocked duplicate notification: ${title} (cooldown: ${Math.round((cooldownPeriod - (now - lastSent))/1000)}s)`);
    return;
}

// Update counters
this.lastNotifications.set(notificationKey, now);
this.notificationCounts.set(hourKey, currentCount + 1);

// Cleanup old entries
this.cleanupOldNotificationData(now);

        // Browser notification
        if (this.notificationsEnabled && Notification.permission === 'granted') {
            const notification = new Notification(title, {
                body,
                icon: '/icons/icon-192x192.png',
                badge: '/icons/icon-96x96.png',
                tag: type, // Verwende tag um Browser-Duplikate zu vermeiden
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

    cleanupOldNotificationData(now) {
    // Cleanup notifications older than 24 hours
    for (let [key, timestamp] of this.lastNotifications) {
        if (now - timestamp > 86400000) { // 24 hours
            this.lastNotifications.delete(key);
        }
    }
    
    // Cleanup hourly counts older than 24 hours
    const currentHour = Math.floor(now / 3600000);
    for (let [hourKey] of this.notificationCounts) {
        const hour = parseInt(hourKey.split('-')[0]);
        if (currentHour - hour > 24) {
            this.notificationCounts.delete(hourKey);
        }
    }
}

// Persist notification state to localStorage
saveNotificationState() {
    const state = {
        lastNotifications: Array.from(this.lastNotifications.entries()),
        notificationCounts: Array.from(this.notificationCounts.entries()),
        timestamp: Date.now()
    };
    localStorage.setItem('notificationState', JSON.stringify(state));
}

// Load notification state from localStorage
loadNotificationState() {
    try {
        const saved = localStorage.getItem('notificationState');
        if (saved) {
            const state = JSON.parse(saved);
            // Only load if saved within last 24 hours
            if (Date.now() - state.timestamp < 86400000) {
                this.lastNotifications = new Map(state.lastNotifications || []);
                this.notificationCounts = new Map(state.notificationCounts || []);
            }
        }
    } catch (error) {
        console.warn('Failed to load notification state:', error);
    }
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

        // Prüfe auf bereits existierende gleiche Notifications
        const existingNotifications = container.querySelectorAll('.alert');
        for (let notification of existingNotifications) {
            if (notification.textContent.includes(message.split(':')[0])) {
                console.log('🚫 Blocked duplicate in-app notification');
                return; // Verhindere Duplikat
            }
        }

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
        
        // Bereinige alte lastNotifications Einträge (älter als 5 Minuten)
        const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
        for (let [key, timestamp] of this.lastNotifications.entries()) {
            if (timestamp < fiveMinutesAgo) {
                this.lastNotifications.delete(key);
            }
        }
        
        return notificationId;
    }

    startSmartChecks() {
        // Achievement checks every 5 minutes
        setInterval(() => this.checkAchievements(), 5 * 60 * 1000);
        
        // Motivational messages every 2 hours
        setInterval(() => this.sendMotivationalMessage(), 2 * 60 * 60 * 1000);
        
        // Clean up old notifications every 10 minutes
        setInterval(() => this.cleanupNotifications(), 10 * 60 * 1000);
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

        // Check for streaks
        const streak = await this.calculateCurrentStreak();
        if (streak > 0 && streak % 7 === 0) {
            achievements.push(`🔥 ${streak}-Tage Streak erreicht!`);
        }

        achievements.forEach((achievement, index) => {
            setTimeout(() => {
                this.sendNotification('Ziel erreicht! 🎯', achievement, 'achievement');
            }, index * 1500);
        });
    }

    async calculateCurrentStreak() {
        try {
            const localData = JSON.parse(localStorage.getItem('healthData') || '[]');
            if (localData.length === 0) return 0;

            const sortedData = localData.sort((a, b) => new Date(b.date) - new Date(a.date));
            let streak = 0;
            let currentDate = new Date();
            
            for (const entry of sortedData) {
                const entryDate = new Date(entry.date);
                const expectedDate = new Date(currentDate);
                expectedDate.setDate(currentDate.getDate() - streak);
                
                if (entryDate.toDateString() === expectedDate.toDateString()) {
                    streak++;
                } else {
                    break;
                }
            }
            
            return streak;
        } catch (error) {
            console.error('Error calculating streak:', error);
            return 0;
        }
    }

    sendMotivationalMessage() {
        const messages = [
            'Du machst das großartig! 💪',
            'Jeder Schritt zählt! 🚶‍♂️',
            'Bleib hydriert! 💧',
            'Gesundheit ist ein Marathon, kein Sprint! 🏃‍♂️',
            'Du investierst in dich selbst! ⭐',
            'Kleine Schritte führen zu großen Veränderungen! 🌟',
            'Heute ist ein guter Tag für Gesundheit! ☀️',
            'Dein Körper dankt dir für jede gesunde Entscheidung! 🙏'
        ];

        const randomMessage = messages[Math.floor(Math.random() * messages.length)];
        this.showInAppNotification(randomMessage, 'success', 3000);
    }

    cleanupNotifications() {
        // Entferne expired notifications
        const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
        for (let [key, timestamp] of this.lastNotifications.entries()) {
            if (timestamp < fiveMinutesAgo) {
                this.lastNotifications.delete(key);
            }
        }

        // Limitiere aktive Notifications auf maximal 5
        if (this.activeNotifications.size > 5) {
            const oldestKeys = Array.from(this.activeNotifications.keys()).slice(0, -5);
            oldestKeys.forEach(key => {
                const notification = this.activeNotifications.get(key);
                if (notification && notification.parentElement) {
                    notification.remove();
                }
                this.activeNotifications.delete(key);
            });
        }
    }

    // Public methods for manual triggers
    triggerWaterReminder() {
        this.checkWaterIntake();
    }

    triggerStepsReminder() {
        this.checkStepsProgress();
    }

    triggerTrackingReminder() {
        this.checkTodayTracking();
    }

    // Cleanup method
    destroy() {
        // Clear all intervals
        this.reminderIntervals.forEach(interval => clearInterval(interval));
        this.reminderIntervals.clear();
        
        // Clear all active notifications
        this.activeNotifications.forEach(notification => {
            if (notification && notification.parentElement) {
                notification.remove();
            }
        });
        this.activeNotifications.clear();
        
        // Clear notification history
        this.lastNotifications.clear();
        
        console.log('🧹 SmartNotificationManager destroyed');
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

        // Chart management
this.charts = {};
this.resizeObserver = null;
this.initResizeObserver();
        
        this.initTheme();
        this.initEventListeners();
        this.loadGoals();
        this.loadTodaysData();
        this.initAnimations();
        this.notificationManager = new SmartNotificationManager(this);
        this.analytics = new AdvancedAnalytics(this);
        this.progressHub = new ProgressHub(this);
        setTimeout(() => {
    this.progressHub.loadViewData();
}, 1000);
        this.activityFeed = new ActivityFeed(this);
        
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

    this.initApp();
}

initApp() {
        console.log('🚀 Health Tracker Pro wird initialisiert...');
        
        this.initTheme();
        this.setupEventListeners(); // ✅ Verwendet jetzt addEventListenerOnce
        this.loadGoals();
        this.updateGoalsDisplay();
        this.loadTodaysData();
        this.initAnimations();
        
        // Initialize components
        this.notificationManager = new SmartNotificationManager(this);
        this.analytics = new AdvancedAnalytics(this);
        this.progressHub = new ProgressHub(this);
        this.activityFeed = new ActivityFeed(this);
        
        // Load Progress Hub data after initialization
        setTimeout(() => {
            if (this.progressHub) {
                this.progressHub.loadViewData();
            }
        }, 1000);
        
        // Initialize charts safely after DOM is ready
        setTimeout(() => this.initializeAllCharts(), 800);

        // Start analytics
        setTimeout(() => {
            if (this.analytics) {
                this.analytics.showView('heatmap');
            }
        }, 2000);
        
        console.log('✅ Health Tracker Pro erfolgreich initialisiert!');
    }

    setupEventListeners() {
        console.log('🔗 Setting up event listeners...');

        // Form submission
        const healthForm = document.getElementById('health-form');
        if (healthForm) {
            this.addEventListenerOnce(healthForm, 'submit', (e) => this.handleSubmit(e));
        }

        // Theme toggle
        const themeToggle = document.getElementById('theme-toggle');
        if (themeToggle) {
            this.addEventListenerOnce(themeToggle, 'click', () => this.toggleTheme());
        }

        // Goals edit button
        const editGoalsBtn = document.getElementById('edit-goals-btn');
        if (editGoalsBtn) {
            this.addEventListenerOnce(editGoalsBtn, 'click', () => this.openGoalsModal());
        }

        // Goals form submission
        const goalsForm = document.getElementById('goals-form');
        if (goalsForm) {
            this.addEventListenerOnce(goalsForm, 'submit', (e) => this.handleGoalsSubmit(e));
        }

        // Install button (PWA)
        const installBtn = document.getElementById('install-btn');
        if (installBtn) {
            this.addEventListenerOnce(installBtn, 'click', () => this.installPWA());
        }

        // Input event listeners for real-time progress updates
        const stepsInput = document.getElementById('steps');
        if (stepsInput) {
            this.addEventListenerOnce(stepsInput, 'input', (e) => {
                this.updateStepsProgress(e.target.value || 0);
            });
        }

        const waterInput = document.getElementById('water');
        if (waterInput) {
            this.addEventListenerOnce(waterInput, 'input', (e) => {
                this.updateWaterProgress(e.target.value || 0);
            });
        }

        const sleepInput = document.getElementById('sleep');
        if (sleepInput) {
            this.addEventListenerOnce(sleepInput, 'input', (e) => {
                this.updateSleepProgress(e.target.value || 0);
            });
        }

        // Window event listeners
        this.addEventListenerOnce(window, 'resize', () => this.handleResize());
        this.addEventListenerOnce(window, 'online', () => this.updateConnectionStatus(true));
        this.addEventListenerOnce(window, 'offline', () => this.updateConnectionStatus(false));

        // PWA install prompt
        this.addEventListenerOnce(window, 'beforeinstallprompt', (e) => {
            e.preventDefault();
            this.deferredPrompt = e;
            const installBtn = document.getElementById('install-btn');
            if (installBtn) {
                installBtn.classList.remove('hidden');
            }
        });

        console.log('✅ Event listeners setup complete');
    }

    installPWA() {
        if (this.deferredPrompt) {
            this.deferredPrompt.prompt();
            this.deferredPrompt.userChoice.then((choiceResult) => {
                if (choiceResult.outcome === 'accepted') {
                    this.showToast('App wird installiert...', 'success');
                } else {
                    this.showToast('Installation abgebrochen', 'info');
                }
                this.deferredPrompt = null;
            });
        }
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

    async initializeAllCharts() {
    // Verhindere mehrfache gleichzeitige Initialisierung
    if (this.chartInitializing) {
        console.log('🔄 Charts already initializing, skipping...');
        return;
    }
    
    this.chartInitializing = true;
    
    try {
        if (typeof Chart === 'undefined') {
            console.warn('⚠️ Chart.js not available');
            this.chartInitializing = false;
            return;
        }
        
        console.log('🎯 Initializing all charts...');
        
        // Warte auf DOM-Bereitschaft
        if (document.readyState !== 'complete') {
            await new Promise(resolve => {
                if (document.readyState === 'complete') {
                    resolve();
                } else {
                    window.addEventListener('load', resolve, { once: true });
                }
            });
        }
        
        // Destroy ALL Chart.js instances globally first (verhindert Orphaned Charts)
        Chart.helpers.each(Chart.instances, (instance) => {
            console.log(`🔥 Destroying global Chart instance: ${instance.id}`);
            try {
                instance.destroy();
            } catch (error) {
                console.error('Error destroying global chart:', error);
            }
        });
        
        // Destroy tracked charts
        if (this.charts) {
            Object.keys(this.charts).forEach(key => {
                if (this.charts[key] && typeof this.charts[key].destroy === 'function') {
                    console.log(`🔥 Destroying tracked chart: ${key}`);
                    try {
                        this.charts[key].destroy();
                    } catch (error) {
                        console.error(`Error destroying ${key}:`, error);
                    }
                    this.charts[key] = null;
                    delete this.charts[key];
                }
            });
        }
        
        // Reset charts object completely
        this.charts = {};
        
        // Warte auf Stabilität nach Zerstörung
        await new Promise(resolve => setTimeout(resolve, 200));
        
        // Set global Chart.js defaults
        Chart.defaults.responsive = true;
        Chart.defaults.maintainAspectRatio = false;
        Chart.defaults.animation = false;
        Chart.defaults.plugins.legend.display = false;
        
        // Initialize charts sequentially with delays (verhindert Race Conditions)
        console.log('🎯 Initializing weight chart...');
        await this.initWeightChart();
        await new Promise(resolve => setTimeout(resolve, 100));
        
        console.log('🎯 Initializing activity chart...');
        await this.initActivityChart();
        await new Promise(resolve => setTimeout(resolve, 100));
        
        console.log('🎯 Initializing sleep chart...');
        await this.initSleepChart();
        await new Promise(resolve => setTimeout(resolve, 100));
        
        console.log('🎯 Initializing mood chart...');
        await this.initMoodChart();
        
        this.chartInitialized = true;
        this.chartInitializing = false;
        
        console.log('✅ All charts initialized successfully');
        
        // Load data after all charts are ready
        setTimeout(() => {
            console.log('📊 Loading chart data after initialization...');
            this.loadAndUpdateCharts();
        }, 500);
        
    } catch (error) {
        console.error('❌ Chart initialization failed:', error);
        this.chartInitialized = false;
        this.chartInitializing = false;
        
        // Retry initialization after delay
        setTimeout(() => {
            console.log('🔄 Retrying chart initialization...');
            this.initializeAllCharts();
        }, 2000);
    }
}

    async initWeightChart() {
    const canvas = document.getElementById('weightChart');
    if (!canvas) {
        console.warn('Weight chart canvas not found');
        return;
    }

    console.log('🎯 Initializing weight chart...');

    // Get existing chart instance and destroy it
    const existingChart = Chart.getChart(canvas);
    if (existingChart) {
        console.log('🔥 Destroying existing weight chart instance');
        existingChart.destroy();
    }

    // Additional cleanup: remove any Chart.js specific attributes
    canvas.removeAttribute('data-chartjs-id');
    
    const ctx = canvas.getContext('2d');
    
    try {
        this.charts.weight = new Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [
                    {
                        label: 'Gewicht',
                        data: [],
                        borderColor: 'rgba(59, 130, 246, 1)',
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                        borderWidth: 3,
                        tension: 0.4,
                        fill: true,
                        pointBackgroundColor: 'rgba(59, 130, 246, 1)',
                        pointBorderColor: '#ffffff',
                        pointBorderWidth: 2,
                        pointRadius: 6
                    },
                    {
                        label: 'Zielgewicht',
                        data: [],
                        borderColor: 'rgba(239, 68, 68, 0.8)',
                        backgroundColor: 'transparent',
                        borderWidth: 2,
                        borderDash: [5, 5],
                        tension: 0,
                        fill: false,
                        pointRadius: 0
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
                                    return `Gewicht: ${context.parsed.y} kg`;
                                } else {
                                    return `Zielgewicht: ${context.parsed.y} kg`;
                                }
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: false,
                        grid: {
                            color: this.theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
                        },
                        ticks: {
                            color: this.theme === 'dark' ? '#9CA3AF' : '#6B7280',
                            callback: function(value) {
                                return value + ' kg';
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
        
        console.log('✅ Weight chart initialized successfully');
    } catch (error) {
        console.error('❌ Error initializing weight chart:', error);
        throw error;
    }
}

    async initActivityChart() {
    const canvas = document.getElementById('activityChart');
    if (!canvas) {
        console.warn('Activity chart canvas not found');
        return;
    }

    console.log('🎯 Initializing activity chart...');

    // Destroy existing chart
    const existingChart = Chart.getChart(canvas);
    if (existingChart) {
        console.log('🔥 Destroying existing activity chart instance');
        existingChart.destroy();
    }
    
    canvas.removeAttribute('data-chartjs-id');
    const ctx = canvas.getContext('2d');
    
    try {
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
                        borderSkipped: false,
                        yAxisID: 'y'
                    },
                    {
                        label: 'Wasser (L)',
                        data: [],
                        backgroundColor: 'rgba(59, 130, 246, 0.8)',
                        borderColor: 'rgba(59, 130, 246, 1)',
                        borderWidth: 2,
                        borderRadius: 6,
                        borderSkipped: false,
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
                        position: 'top',
                        labels: {
                            usePointStyle: true,
                            padding: 20,
                            color: this.theme === 'dark' ? '#E5E7EB' : '#374151'
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.9)',
                        titleColor: '#fff',
                        bodyColor: '#fff',
                        borderColor: this.theme === 'dark' ? '#4B5563' : '#D1D5DB',
                        borderWidth: 1,
                        callbacks: {
                            label: function(context) {
                                if (context.datasetIndex === 0) {
                                    return `Schritte: ${context.parsed.y.toLocaleString()}`;
                                } else {
                                    return `Wasser: ${context.parsed.y}L`;
                                }
                            },
                            afterLabel: function(context) {
                                const goals = this.goals || {};
                                if (context.datasetIndex === 0) {
                                    const goal = goals.stepsGoal || 10000;
                                    const percentage = Math.round((context.parsed.y / goal) * 100);
                                    return `Ziel: ${goal.toLocaleString()} (${percentage}%)`;
                                } else {
                                    const goal = goals.waterGoal || 2.0;
                                    const percentage = Math.round((context.parsed.y / goal) * 100);
                                    return `Ziel: ${goal}L (${percentage}%)`;
                                }
                            }.bind(this)
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        position: 'left',
                        title: {
                            display: true,
                            text: 'Schritte',
                            color: this.theme === 'dark' ? '#9CA3AF' : '#6B7280'
                        },
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
                        title: {
                            display: true,
                            text: 'Wasser (L)',
                            color: this.theme === 'dark' ? '#9CA3AF' : '#6B7280'
                        },
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
                },
                interaction: {
                    mode: 'index',
                    intersect: false
                }
            }
        });
        
        console.log('✅ Activity chart initialized successfully');
    } catch (error) {
        console.error('❌ Error initializing activity chart:', error);
        throw error;
    }
}

    async initSleepChart() {
    const canvas = document.getElementById('sleepChart');
    if (!canvas) {
        console.warn('Sleep chart canvas not found');
        return;
    }

    console.log('🎯 Initializing sleep chart...');

    const existingChart = Chart.getChart(canvas);
    if (existingChart) {
        console.log('🔥 Destroying existing sleep chart instance');
        existingChart.destroy();
    }
    
    canvas.removeAttribute('data-chartjs-id');
    const ctx = canvas.getContext('2d');
    
    try {
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
                    borderRadius: 8,
                    borderSkipped: false
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
                        backgroundColor: 'rgba(0, 0, 0, 0.9)',
                        titleColor: '#fff',
                        bodyColor: '#fff',
                        borderColor: this.theme === 'dark' ? '#4B5563' : '#D1D5DB',
                        borderWidth: 1,
                        callbacks: {
                            label: function(context) {
                                const hours = context.parsed.y;
                                const goal = this.goals?.sleepGoal || 8;
                                let quality = 'Schlecht';
                                let qualityColor = '🔴';
                                
                                if (hours >= goal) {
                                    quality = 'Ausgezeichnet';
                                    qualityColor = '🟢';
                                } else if (hours >= goal * 0.875) {
                                    quality = 'Gut';
                                    qualityColor = '🟡';
                                } else if (hours >= goal * 0.75) {
                                    quality = 'Durchschnitt';
                                    qualityColor = '🟠';
                                }
                                
                                const percentage = Math.round((hours / goal) * 100);
                                
                                return [
                                    `Schlaf: ${hours}h`,
                                    `Ziel: ${goal}h (${percentage}%)`,
                                    `Qualität: ${qualityColor} ${quality}`
                                ];
                            }.bind(this),
                            afterLabel: function(context) {
                                const hours = context.parsed.y;
                                if (hours >= 9) return '💤 Sehr erholsam!';
                                if (hours >= 7) return '😴 Gut erholt';
                                if (hours >= 6) return '😐 Etwas müde';
                                return '😵 Zu wenig Schlaf';
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: Math.max(10, (this.goals?.sleepGoal || 8) + 2),
                        title: {
                            display: true,
                            text: 'Stunden',
                            color: this.theme === 'dark' ? '#9CA3AF' : '#6B7280'
                        },
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
                },
                interaction: {
                    mode: 'index',
                    intersect: false
                }
            }
        });
        
        console.log('✅ Sleep chart initialized successfully');
    } catch (error) {
        console.error('❌ Error initializing sleep chart:', error);
        throw error;
    }
}

    async initMoodChart() {
    const canvas = document.getElementById('moodChart');
    if (!canvas) {
        console.warn('Mood chart canvas not found');
        return;
    }

    console.log('🎯 Initializing mood chart...');

    const existingChart = Chart.getChart(canvas);
    if (existingChart) {
        console.log('🔥 Destroying existing mood chart instance');
        existingChart.destroy();
    }
    
    canvas.removeAttribute('data-chartjs-id');
    const ctx = canvas.getContext('2d');
    
    try {
        this.charts.mood = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Schrecklich', 'Schlecht', 'Neutral', 'Gut', 'Ausgezeichnet'],
                datasets: [{
                    label: 'Stimmungsverteilung',
                    data: [0, 0, 0, 0, 0],
                    backgroundColor: [
                        'rgba(239, 68, 68, 0.8)',   // Rot - Schrecklich
                        'rgba(245, 101, 101, 0.8)', // Helles Rot - Schlecht
                        'rgba(156, 163, 175, 0.8)', // Grau - Neutral
                        'rgba(34, 197, 94, 0.8)',   // Grün - Gut
                        'rgba(16, 185, 129, 0.8)'   // Dunkelgrün - Ausgezeichnet
                    ],
                    borderColor: [
                        'rgba(239, 68, 68, 1)',
                        'rgba(245, 101, 101, 1)',
                        'rgba(156, 163, 175, 1)',
                        'rgba(34, 197, 94, 1)',
                        'rgba(16, 185, 129, 1)'
                    ],
                    borderWidth: 2,
                    hoverOffset: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: false,
                cutout: '60%',
                plugins: {
                    legend: {
                        display: true,
                        position: 'bottom',
                        labels: {
                            usePointStyle: true,
                            padding: 20,
                            color: this.theme === 'dark' ? '#E5E7EB' : '#374151',
                            generateLabels: function(chart) {
                                const data = chart.data;
                                const labels = data.labels || [];
                                const dataset = data.datasets[0];
                                const emojis = ['😞', '😕', '😐', '😊', '😁'];
                                
                                return labels.map((label, index) => ({
                                    text: `${emojis[index]} ${label}`,
                                    fillStyle: dataset.backgroundColor[index],
                                    strokeStyle: dataset.borderColor[index],
                                    lineWidth: dataset.borderWidth,
                                    hidden: false,
                                    index: index
                                }));
                            }
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.9)',
                        titleColor: '#fff',
                        bodyColor: '#fff',
                        borderColor: this.theme === 'dark' ? '#4B5563' : '#D1D5DB',
                        borderWidth: 1,
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.parsed;
                                const total = context.dataset.data.reduce((sum, val) => sum + val, 0);
                                const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
                                const emojis = ['😞', '😕', '😐', '😊', '😁'];
                                const emoji = emojis[context.dataIndex] || '';
                                
                                if (value === 0) {
                                    return `${emoji} ${label}: Keine Einträge`;
                                }
                                
                                const dayText = value === 1 ? 'Tag' : 'Tage';
                                return [
                                    `${emoji} ${label}`,
                                    `${value} ${dayText} (${percentage}%)`,
                                    total > 0 ? `Von insgesamt ${total} Einträgen` : ''
                                ];
                            },
                            afterLabel: function(context) {
                                const moodTips = [
                                    '💡 Versuche kleine positive Aktivitäten',
                                    '🌱 Jeder Tag ist ein neuer Anfang',
                                    '⚖️ Balance ist der Schlüssel',
                                    '🌟 Großartig! Halte diese Energie',
                                    '🎉 Fantastisch! Du strahlst!'
                                ];
                                return moodTips[context.dataIndex] || '';
                            }
                        }
                    }
                },
                interaction: {
                    mode: 'index',
                    intersect: false
                }
            }
        });
        
        console.log('✅ Mood chart initialized successfully');
    } catch (error) {
        console.error('❌ Error initializing mood chart:', error);
        throw error;
    }
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
    
    if (!allData || !Array.isArray(allData) || allData.length === 0) {
        console.log('⚠️ No valid data provided for charts');
        return;
    }
    
    console.log('📈 Updating charts with', allData.length, 'data points');
    
    const last7Days = allData.slice(-7);
    const labels = last7Days.map(d => {
        if (!d.date) return 'N/A';
        try {
            return new Date(d.date).toLocaleDateString('de-DE', { weekday: 'short' });
        } catch (error) {
            return 'N/A';
        }
    });
    
    try {
        // 1. Weight Chart
        this.safeUpdateChart('weight', () => {
            if (this.charts.weight) {
                const weightData = last7Days
                    .map(d => d.weight || null)
                    .filter(w => w !== null && !isNaN(w));
                
                if (weightData.length > 0) {
                    // KOMPLETT leeren
                    this.charts.weight.data.labels.splice(0, this.charts.weight.data.labels.length);
                    this.charts.weight.data.datasets[0].data.splice(0, this.charts.weight.data.datasets[0].data.length);
                    this.charts.weight.data.datasets[1].data.splice(0, this.charts.weight.data.datasets[1].data.length);
                    
                    // Neue Daten hinzufügen
                    this.charts.weight.data.labels.push(...labels.slice(0, weightData.length));
                    this.charts.weight.data.datasets[0].data.push(...weightData);
                    
                    if (this.goals.weightGoal && !isNaN(this.goals.weightGoal)) {
                        this.charts.weight.data.datasets[1].data.push(...new Array(weightData.length).fill(this.goals.weightGoal));
                    }
                    
                    this.charts.weight.update('none');
                    console.log('✅ Weight chart updated');
                }
            }
        });

        // 2. Activity Chart - KRITISCH FÜR DUPLIKATE
        this.safeUpdateChart('activity', () => {
            if (this.charts.activity) {
                const stepsData = last7Days.map(d => d.steps || 0);
                const waterData = last7Days.map(d => d.waterIntake || 0);
                
                // VOLLSTÄNDIG leeren mit splice
                this.charts.activity.data.labels.splice(0, this.charts.activity.data.labels.length);
                this.charts.activity.data.datasets[0].data.splice(0, this.charts.activity.data.datasets[0].data.length);
                this.charts.activity.data.datasets[1].data.splice(0, this.charts.activity.data.datasets[1].data.length);
                
                // Neue Daten hinzufügen
                this.charts.activity.data.labels.push(...labels);
                this.charts.activity.data.datasets[0].data.push(...stepsData);
                this.charts.activity.data.datasets[1].data.push(...waterData);
                
                this.charts.activity.update('none');
                console.log('✅ Activity chart updated - duplicates prevented');
            }
        });

        // 3. Sleep Chart - KRITISCH FÜR DUPLIKATE
        this.safeUpdateChart('sleep', () => {
            if (this.charts.sleep) {
                const sleepData = last7Days.map(d => d.sleepHours || 0);
                const sleepColors = sleepData.map(hours => {
                    const goal = this.goals.sleepGoal || 8;
                    if (hours >= goal) return 'rgba(34, 197, 94, 0.8)';
                    if (hours >= goal * 0.875) return 'rgba(251, 191, 36, 0.8)';
                    if (hours >= goal * 0.75) return 'rgba(251, 146, 60, 0.8)';
                    return 'rgba(239, 68, 68, 0.8)';
                });
                
                // VOLLSTÄNDIG leeren - alle Arrays
                this.charts.sleep.data.labels.splice(0, this.charts.sleep.data.labels.length);
                this.charts.sleep.data.datasets[0].data.splice(0, this.charts.sleep.data.datasets[0].data.length);
                this.charts.sleep.data.datasets[0].backgroundColor.splice(0, this.charts.sleep.data.datasets[0].backgroundColor.length);
                this.charts.sleep.data.datasets[0].borderColor.splice(0, this.charts.sleep.data.datasets[0].borderColor.length);
                
                // Neue Daten hinzufügen
                this.charts.sleep.data.labels.push(...labels);
                this.charts.sleep.data.datasets[0].data.push(...sleepData);
                this.charts.sleep.data.datasets[0].backgroundColor.push(...sleepColors);
                this.charts.sleep.data.datasets[0].borderColor.push(...sleepColors.map(c => c.replace('0.8', '1')));
                
                this.charts.sleep.update('none');
                console.log('✅ Sleep chart updated - duplicates prevented');
            }
        });

        // 4. Mood Chart
        this.safeUpdateChart('mood', () => {
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
                
                // Direkter Ersatz für Mood Chart
                this.charts.mood.data.datasets[0].data = [...moodCounts];
                this.charts.mood.update('none');
                console.log('✅ Mood chart updated');
            }
        });
        
    } catch (error) {
        console.error('❌ Error updating charts:', error);
        setTimeout(() => {
            console.log('🔄 Attempting to reinitialize charts...');
            this.initializeAllCharts();
        }, 1000);
    }
}

safeUpdateChart(chartName, updateFunction) {
    try {
        const chart = this.charts[chartName];
        const canvas = document.getElementById(chartName + 'Chart');
        
        // Enhanced canvas availability check
        if (!chart || !canvas || !document.contains(canvas)) {
            console.warn(`⚠️ ${chartName} chart or canvas not available - reinitializing`);
            
            // Attempt to reinitialize the specific chart
            setTimeout(() => {
                switch(chartName) {
                    case 'weight': this.initWeightChart(); break;
                    case 'activity': this.initActivityChart(); break;
                    case 'sleep': this.initSleepChart(); break;
                    case 'mood': this.initMoodChart(); break;
                }
            }, 500);
            return;
        }
        
        updateFunction();
        
    } catch (error) {
        console.error(`❌ Error updating ${chartName} chart:`, error);
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

        // Dashboard mit neuen Daten aktualisieren
        this.updateDashboard(formData);
        
        // Goal-Achievements prüfen
        this.checkGoalAchievements(formData);
        
        // Activity Feed aktualisieren
        if (this.activityFeed) {
            this.activityFeed.load();
        }
        
        // Progress Hub aktualisieren (falls vorhanden)
        if (this.progressHub) {
            this.progressHub.loadViewData();
        }
        
        // Charts nach kurzer Verzögerung aktualisieren
        setTimeout(() => {
            console.log('🔄 Reloading charts after data save...');
            this.loadAndUpdateCharts();
            
            // Analytics nach Chart-Update aktualisieren
            setTimeout(() => {
                if (this.analytics) {
                    this.analytics.loadViewData();
                }
            }, 800);
        }, 500);
        
        // Formular zurücksetzen
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

destroyAllCharts() {
    console.log('🔥 Destroying tracked Chart.js instances...');
    if (this.charts) {
        Object.keys(this.charts).forEach(key => {
            if (this.charts[key] && typeof this.charts[key].destroy === 'function') {
                try {
                    this.charts[key].destroy();
                } catch (error) {
                    console.warn(`Failed to destroy chart ${key}:`, error);
                }
                delete this.charts[key];
            }
        });
    }
    // Remove resize observers
    if (this.resizeObserver) {
        this.resizeObserver.disconnect();
        this.resizeObserver = null;
    }
}

initResizeObserver() {
    if ('ResizeObserver' in window) {
        this.resizeObserver = new ResizeObserver(entries => {
            entries.forEach(entry => {
                const chartCanvas = entry.target.querySelector('canvas');
                if (chartCanvas) {
                    const chartId = Object.keys(this.charts).find(key => 
                        this.charts[key]?.canvas === chartCanvas
                    );
                    if (chartId && this.charts[chartId]) {
                        clearTimeout(this.charts[chartId]._resizeTimeout);
                        this.charts[chartId]._resizeTimeout = setTimeout(() => {
                            this.charts[chartId].resize();
                        }, 150);
                    }
                }
            });
        });
        
        // Observe chart containers
        document.querySelectorAll('.chart-container').forEach(container => {
            this.resizeObserver.observe(container);
        });
    }
}

// Verhindere doppelte Event Listener
addEventListenerOnce(element, event, handler, options = {}) {
    if (!element) return;
    
    // Entferne existierende Listener vom gleichen Typ
    element.removeEventListener(event, handler);
    
    // Füge neuen Listener hinzu
    element.addEventListener(event, handler, options);
}
}

class ProgressHub {
    constructor(healthTracker) {
        this.healthTracker = healthTracker;
        this.currentView = 'today';
        this.achievements = new Map();
        this.streaks = new Map();
        this.dailyChallenge = null;
        this.sparklineCharts = {};
        
        // Warte kurz und prüfe dann, ob Progress Hub HTML vorhanden ist
        setTimeout(() => this.initialize(), 500);
    }

    initialize() {
        // Prüfe ob Progress Hub HTML existiert
        if (!document.getElementById('view-today')) {
            console.warn('⚠️ Progress Hub HTML nicht gefunden - überspringe Initialisierung');
            return;
        }
        
        console.log('✅ Progress Hub wird initialisiert');
        this.generateDailyChallenge();
        this.initSparklineCharts();
        this.showView(this.currentView);
    }

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
        this.loadViewData();
    }

    async loadViewData() {
        try {
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
            
            // Update tab badges
            this.updateTabBadges(data);
            
        } catch (error) {
            console.error('❌ Error loading Progress Hub data:', error);
        }
    }

    async getHealthData() {
        try {
            let allData = [];
            
            if (navigator.onLine) {
                try {
                    const response = await fetch(`/api/health-data/${this.healthTracker.userId}`);
                    if (response.ok) {
                        allData = await response.json();
                    }
                } catch (error) {
                    console.log('Server data not available, using local data');
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
        const last7Days = data.slice(0, 7);
        
        console.log('📊 Updating Progress Hub with today data:', todayData);
        
        // Update progress cards with enhanced features
        this.updateProgressCard('steps', todayData.steps || 0, this.healthTracker.goals.stepsGoal, last7Days);
        this.updateProgressCard('water', todayData.waterIntake || 0, this.healthTracker.goals.waterGoal, last7Days);
        this.updateProgressCard('sleep', todayData.sleepHours || 0, this.healthTracker.goals.sleepGoal, last7Days);
        
        // Update mood
        this.updateMoodCard(todayData.mood);
        
        // Calculate and update overall score with animation
        const overallScore = this.calculateOverallScore(todayData);
        this.updateOverallScore(overallScore);
        
        // Generate smart actions
        this.generateSmartActions(todayData, data);
        
        // Update daily challenge
        this.updateDailyChallenge(todayData);
        
        // Update sparkline charts
        this.updateSparklines(last7Days);
        
        // Update quick stats summary
        this.updateQuickStatsSummary(todayData, data);
    }

    updateProgressCard(type, current, goal, historyData = []) {
        if (!goal || goal <= 0) return;
        
        const percentage = Math.min((current / goal) * 100, 100);
        
        // Basic updates
        const badge = document.getElementById(`${type}-progress-badge`);
        const display = document.getElementById(`today-${type}-display`);
        const progressBar = document.getElementById(`${type}-progress-bar`);
        const motivation = document.getElementById(`${type}-motivation`);
        const goalDisplay = document.getElementById(`${type}-goal-display`);
        const status = document.getElementById(`${type}-status`);
        
        if (badge) badge.textContent = Math.round(percentage) + '%';
        
        if (display) {
            const unit = type === 'steps' ? '' : type === 'water' ? 'L' : 'h';
            display.textContent = current.toLocaleString() + unit;
        }
        
        if (progressBar) {
            progressBar.value = percentage;
            // Add animation
            progressBar.style.transition = 'all 0.5s ease-in-out';
        }
        
        if (goalDisplay) {
            const unit = type === 'steps' ? '' : type === 'water' ? 'L' : 'h';
            goalDisplay.textContent = goal.toLocaleString() + unit;
        }
        
        if (motivation) {
            motivation.textContent = this.getMotivationalMessage(type, percentage);
        }
        
        // Enhanced status updates
        if (status) {
            status.textContent = this.getStatusMessage(type, percentage);
            status.className = `text-xs mt-1 ${this.getStatusColor(type, percentage)}`;
        }
        
        // Special visualizations
        if (type === 'water') {
            this.updateWaterGlasses(current, goal);
        } else if (type === 'sleep') {
            this.updateSleepQuality(current, goal);
        }
    }

    updateWaterGlasses(current, goal) {
        const container = document.getElementById('water-glasses');
        if (!container) return;
        
        const glassCount = 8; // 8 glasses
        const perGlass = goal / glassCount;
        let html = '';
        
        for (let i = 0; i < glassCount; i++) {
            const filled = current > (i * perGlass);
            const fillLevel = Math.min(1, Math.max(0, (current - i * perGlass) / perGlass));
            
            html += `
                <div class="relative w-3 h-4 border border-cyan-300 rounded-sm ${filled ? 'bg-cyan-200' : 'bg-transparent'}">
                    ${filled ? `<div class="absolute bottom-0 left-0 right-0 bg-cyan-500 rounded-sm" style="height: ${fillLevel * 100}%"></div>` : ''}
                </div>
            `;
        }
        
        container.innerHTML = html;
    }

    updateSleepQuality(current, goal) {
        const container = document.getElementById('sleep-quality');
        if (!container) return;
        
        const quality = Math.min(5, Math.max(1, Math.round((current / goal) * 5)));
        const dots = container.querySelectorAll('div');
        
        dots.forEach((dot, index) => {
            if (index < quality) {
                dot.className = 'w-2 h-2 rounded-full bg-indigo-500';
            } else {
                dot.className = 'w-2 h-2 rounded-full bg-indigo-200';
            }
        });
    }

    updateMoodCard(mood) {
        const emojiDisplay = document.getElementById('mood-emoji-display');
        const moodDisplay = document.getElementById('current-mood-display');
        const moodBadge = document.getElementById('mood-badge');
        const moodStreak = document.getElementById('mood-streak');
        
        const moodConfig = {
            'excellent': { emoji: '😄', text: 'Ausgezeichnet', color: 'text-green-500', badge: 'badge-success' },
            'good': { emoji: '😊', text: 'Gut', color: 'text-blue-500', badge: 'badge-info' },
            'neutral': { emoji: '😐', text: 'Neutral', color: 'text-gray-500', badge: 'badge-neutral' },
            'bad': { emoji: '😔', text: 'Schlecht', color: 'text-orange-500', badge: 'badge-warning' },
            'terrible': { emoji: '😞', text: 'Schrecklich', color: 'text-red-500', badge: 'badge-error' }
        };
        
        const config = moodConfig[mood] || moodConfig['neutral'];
        
        if (emojiDisplay) {
            emojiDisplay.innerHTML = `<span class="text-lg">${config.emoji}</span>`;
        }
        
        if (moodDisplay) {
            moodDisplay.textContent = config.text;
            moodDisplay.className = `text-lg font-bold ${config.color} mb-2`;
        }
        
        if (moodBadge) {
            moodBadge.textContent = config.text;
            moodBadge.className = `badge badge-sm ${config.badge}`;
        }
        
        if (moodStreak) {
            // TODO: Calculate mood streak
            moodStreak.textContent = mood ? 'Heute erfasst ✓' : 'Heute tracken';
        }
    }

    updateOverallScore(score) {
        const display = document.getElementById('overall-score-display');
        const circle = document.getElementById('overall-progress-circle');
        const motivation = document.getElementById('overall-motivation');
        
        if (display) {
            // Animate number counting up
            this.animateNumber(display, 0, score, '%', 1000);
        }
        
        if (circle) {
            const circumference = 2 * Math.PI * 56; // radius = 56
            const offset = circumference - (score / 100) * circumference;
            circle.style.strokeDashoffset = offset;
        }
        
        if (motivation) {
            motivation.textContent = this.getOverallMotivation(score);
        }
    }

    animateNumber(element, start, end, suffix = '', duration = 1000) {
        const startTime = performance.now();
        const range = end - start;
        
        function updateNumber(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const easeProgress = 1 - Math.pow(1 - progress, 3); // Ease out cubic
            
            const current = start + (range * easeProgress);
            element.textContent = Math.round(current) + suffix;
            
            if (progress < 1) {
                requestAnimationFrame(updateNumber);
            }
        }
        
        requestAnimationFrame(updateNumber);
    }

    generateSmartActions(todayData, allData) {
        const container = document.getElementById('today-quick-actions');
        if (!container) return;
        
        const actions = [];
        const goals = this.healthTracker.goals;
        
        // AI-powered smart suggestions based on data patterns
        const recentAvg = this.calculateRecentAverages(allData.slice(0, 7));
        
        // Steps suggestions
        if (!todayData.steps || todayData.steps < goals.stepsGoal * 0.3) {
            actions.push({
                text: '🚶‍♂️ Kurzer Spaziergang',
                action: 'takeWalk',
                priority: 'high',
                description: 'Starte mit 10 Minuten'
            });
        } else if (todayData.steps < goals.stepsGoal * 0.8) {
            const needed = goals.stepsGoal - todayData.steps;
            actions.push({
                text: `🎯 ${needed.toLocaleString()} Schritte fehlen`,
                action: 'finishSteps',
                priority: 'medium',
                description: 'Fast geschafft!'
            });
        }
        
        // Water suggestions with timing
        const hour = new Date().getHours();
        if (!todayData.waterIntake || todayData.waterIntake < goals.waterGoal * 0.6) {
            if (hour < 12) {
                actions.push({
                    text: '☀️ Morgendliche Hydration',
                    action: 'drinkWater',
                    priority: 'high',
                    description: 'Starte den Tag mit Wasser'
                });
            } else {
                actions.push({
                    text: '💧 Wasserpause einlegen',
                    action: 'drinkWater',
                    priority: 'medium',
                    description: 'Dein Körper braucht Flüssigkeit'
                });
            }
        }
        
        // Sleep suggestions (evening)
        if (hour >= 21 && (!todayData.sleepHours || recentAvg.sleep < goals.sleepGoal * 0.9)) {
            actions.push({
                text: '🌙 Schlafenszeit vorbereiten',
                action: 'prepareSleep',
                priority: 'medium',
                description: 'Für erholsamen Schlaf'
            });
        }
        
        // Data entry reminders
        if (!todayData.weight && Math.random() > 0.7) { // 30% chance
            actions.push({
                text: '⚖️ Gewicht erfassen',
                action: 'recordWeight',
                priority: 'low',
                description: 'Tracke deinen Fortschritt'
            });
        }
        
        if (!todayData.mood) {
            actions.push({
                text: '😊 Stimmung festhalten',
                action: 'recordMood',
                priority: 'medium',
                description: 'Wie fühlst du dich heute?'
            });
        }
        
        // Always show data entry
        actions.push({
            text: '📊 Alle Daten eingeben',
            action: 'enterData',
            priority: 'low',
            description: 'Vollständiges Tracking'
        });
        
        // Sort by priority and render
        const sortedActions = actions.sort((a, b) => {
            const priorities = { high: 3, medium: 2, low: 1 };
            return priorities[b.priority] - priorities[a.priority];
        });
        
        container.innerHTML = sortedActions.map(action => `
            <div class="relative group">
                <button class="btn btn-sm ${this.getActionButtonClass(action.priority)} gap-2 w-full" 
                        onclick="window.healthTracker.progressHub.handleQuickAction('${action.action}')">
                    ${action.text}
                </button>
                <div class="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-black text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity z-10 whitespace-nowrap">
                    ${action.description}
                </div>
            </div>
        `).join('');
    }

    getActionButtonClass(priority) {
        switch (priority) {
            case 'high': return 'btn-primary';
            case 'medium': return 'btn-secondary';
            case 'low': return 'btn-outline';
            default: return 'btn-outline';
        }
    }

    generateDailyChallenge() {
        const challenges = [
            { desc: 'Erreiche 10.000 Schritte', type: 'steps', target: 10000, reward: 50 },
            { desc: 'Trinke 2.5L Wasser', type: 'water', target: 2.5, reward: 30 },
            { desc: 'Schlafe 8 Stunden', type: 'sleep', target: 8, reward: 40 },
            { desc: 'Tracke alle Daten heute', type: 'complete', target: 4, reward: 75 },
            { desc: '15 Minuten Spaziergang', type: 'steps', target: 2000, reward: 25 }
        ];
        
        // Select random challenge or based on user's weak points
        this.dailyChallenge = challenges[Math.floor(Math.random() * challenges.length)];
        console.log('🎯 Daily challenge generated:', this.dailyChallenge);
    }

    updateDailyChallenge(todayData) {
        if (!this.dailyChallenge) return;
        
        const desc = document.getElementById('challenge-description');
        const reward = document.getElementById('challenge-reward');
        const progress = document.getElementById('challenge-progress');
        
        if (desc) desc.textContent = this.dailyChallenge.desc;
        if (reward) reward.textContent = `+${this.dailyChallenge.reward} XP`;
        
        if (progress) {
            let currentProgress = 0;
            
            switch (this.dailyChallenge.type) {
                case 'steps':
                    currentProgress = Math.min(100, (todayData.steps || 0) / this.dailyChallenge.target * 100);
                    break;
                case 'water':
                    currentProgress = Math.min(100, (todayData.waterIntake || 0) / this.dailyChallenge.target * 100);
                    break;
                case 'sleep':
                    currentProgress = Math.min(100, (todayData.sleepHours || 0) / this.dailyChallenge.target * 100);
                    break;
                case 'complete':
                    const tracked = [todayData.steps, todayData.waterIntake, todayData.sleepHours, todayData.mood].filter(x => x !== undefined && x !== null).length;
                    currentProgress = Math.min(100, tracked / this.dailyChallenge.target * 100);
                    break;
            }
            
            progress.value = currentProgress;
        }
    }

    initSparklineCharts() {
        // Initialize mini sparkline charts for progress cards
        const stepsCanvas = document.getElementById('steps-sparkline');
        if (stepsCanvas && typeof Chart !== 'undefined') {
            this.sparklineCharts.steps = new Chart(stepsCanvas.getContext('2d'), {
                type: 'line',
                data: {
                    labels: ['', '', '', '', '', '', ''],
                    datasets: [{
                        data: [0, 0, 0, 0, 0, 0, 0],
                        borderColor: 'rgba(34, 197, 94, 0.8)',
                        borderWidth: 1,
                        fill: false,
                        pointRadius: 0,
                        tension: 0.3
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                        x: { display: false },
                        y: { display: false }
                    },
                    animation: false
                }
            });
        }
    }

    updateSparklines(last7Days) {
        if (!this.sparklineCharts.steps) return;
        
        const stepsData = last7Days.reverse().map(d => d.steps || 0);
        this.sparklineCharts.steps.data.datasets[0].data = stepsData;
        this.sparklineCharts.steps.update('none');
    }

    calculateRecentAverages(recentData) {
        if (recentData.length === 0) return { steps: 0, water: 0, sleep: 0 };
        
        return {
            steps: recentData.reduce((sum, d) => sum + (d.steps || 0), 0) / recentData.length,
            water: recentData.reduce((sum, d) => sum + (d.waterIntake || 0), 0) / recentData.length,
            sleep: recentData.reduce((sum, d) => sum + (d.sleepHours || 0), 0) / recentData.length
        };
    }

    updateTabBadges(data) {
        const today = new Date().toISOString().split('T')[0];
        const todayData = data.find(entry => entry.date === today) || {};
        
        // Today badge - overall score
        const overallScore = this.calculateOverallScore(todayData);
        const todayBadge = document.getElementById('today-badge');
        if (todayBadge) todayBadge.textContent = Math.round(overallScore) + '%';
        
        // Week badge - weekly average
        const last7Days = data.slice(0, 7);
        const weeklyAvg = last7Days.length > 0 ? 
            last7Days.reduce((sum, d) => sum + this.calculateOverallScore(d), 0) / last7Days.length : 0;
        const weekBadge = document.getElementById('week-badge');
        if (weekBadge) weekBadge.textContent = Math.round(weeklyAvg) + '%';
        
        // Achievements badge - count
        const achievementsBadge = document.getElementById('achievements-badge');
        if (achievementsBadge) achievementsBadge.textContent = this.achievements.size;
        
        // Streaks badge - longest streak
        const streaksBadge = document.getElementById('streaks-badge');
        if (streaksBadge) {
            const longestStreak = this.calculateLongestStreak(data);
            streaksBadge.textContent = longestStreak;
        }
    }

    quickMoodUpdate(mood) {
        // Quick mood update without opening the full form
        const formData = {
            userId: this.healthTracker.userId,
            date: new Date().toISOString().split('T')[0],
            mood: mood
        };
        
        // Update locally first
        this.updateLocalMoodData(formData);
        
        // Update UI immediately
        this.updateMoodCard(mood);
        
        // Show feedback
        this.healthTracker.notificationManager.showInAppNotification(
            `😊 Stimmung als "${mood}" erfasst!`, 'success', 3000
        );
        
        // Save to server in background
        if (navigator.onLine) {
            this.healthTracker.saveToServer(formData).catch(console.error);
        }
    }

    updateLocalMoodData(formData) {
        let healthData = JSON.parse(localStorage.getItem('healthData') || '[]');
        const existingIndex = healthData.findIndex(entry => 
            entry.userId === formData.userId && entry.date === formData.date
        );
        
        if (existingIndex >= 0) {
            healthData[existingIndex].mood = formData.mood;
        } else {
            healthData.push(formData);
        }
        
        localStorage.setItem('healthData', JSON.stringify(healthData));
    }

    exportProgress() {
        // Export progress data as JSON
        const data = {
            userData: {
                userId: this.healthTracker.userId,
                goals: this.healthTracker.goals,
                exportDate: new Date().toISOString()
            },
            healthData: JSON.parse(localStorage.getItem('healthData') || '[]'),
            achievements: Array.from(this.achievements.entries()),
            streaks: Array.from(this.streaks.entries())
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `health-tracker-export-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        this.healthTracker.notificationManager.showInAppNotification(
            '📁 Fortschritt erfolgreich exportiert!', 'success'
        );
    }

    refreshActions() {
        // Regenerate daily challenge and smart actions
        this.generateDailyChallenge();
        this.loadViewData();
        
        this.healthTracker.notificationManager.showInAppNotification(
            '🔄 Aktionen aktualisiert!', 'info', 2000
        );
    }

    // Existing methods remain the same...
    calculateOverallScore(todayData) {
        const goals = this.healthTracker.goals;
        let score = 0;
        let maxScore = 0;
        
        if (goals.stepsGoal) {
            maxScore += 30;
            score += Math.min((todayData.steps || 0) / goals.stepsGoal, 1) * 30;
        }
        
        if (goals.waterGoal) {
            maxScore += 25;
            score += Math.min((todayData.waterIntake || 0) / goals.waterGoal, 1) * 25;
        }
        
        if (goals.sleepGoal) {
            maxScore += 25;
            score += Math.min((todayData.sleepHours || 0) / goals.sleepGoal, 1) * 25;
        }
        
        if (todayData.mood) {
            maxScore += 20;
            const moodValues = { terrible: 0.2, bad: 0.4, neutral: 0.6, good: 0.8, excellent: 1.0 };
            score += (moodValues[todayData.mood] || 0) * 20;
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
            }
        };
        
        const level = percentage < 30 ? 'low' : percentage < 80 ? 'medium' : 'high';
        return messages[type]?.[level] || 'Bleib dran!';
    }

    getStatusMessage(type, percentage) {
        const statusMessages = {
            steps: {
                low: 'Inaktiv', medium: 'Aktiv', high: 'Sehr aktiv'
            },
            water: {
                low: 'Dehydriert', medium: 'Hydriert', high: 'Optimal'
            },
            sleep: {
                low: 'Müde', medium: 'Ausgeruht', high: 'Erholt'
            }
        };
        
        const level = percentage < 50 ? 'low' : percentage < 90 ? 'medium' : 'high';
        return statusMessages[type]?.[level] || 'Normal';
    }

    getStatusColor(type, percentage) {
        if (percentage < 50) return 'text-red-600';
        if (percentage < 90) return 'text-yellow-600';
        return 'text-green-600';
    }

    getOverallMotivation(score) {
        if (score < 30) return 'Heute ist ein neuer Tag - du schaffst das! 💪';
        if (score < 60) return 'Du bist auf einem guten Weg! 🚀';
        if (score < 90) return 'Fantastischer Fortschritt! 🌟';
        return 'Du bist heute ein echter Gesundheits-Champion! 🏆';
    }

    calculateLongestStreak(data) {
        // Simplified streak calculation
        let maxStreak = 0;
        let currentStreak = 0;
        
        for (let i = 0; i < data.length; i++) {
            const entry = data[i];
            if (entry.steps || entry.waterIntake || entry.sleepHours) {
                currentStreak++;
                maxStreak = Math.max(maxStreak, currentStreak);
            } else {
                currentStreak = 0;
            }
        }
        
        return maxStreak;
    }

    updateQuickStatsSummary(todayData, allData) {
        const completedGoals = document.getElementById('completed-goals');
        const currentStreak = document.getElementById('current-streak');
        const weeklyAvg = document.getElementById('weekly-avg');
        
        // Calculate completed goals today
        let completed = 0;
        let total = 0;
        
        if (this.healthTracker.goals.stepsGoal) {
            total++;
            if ((todayData.steps || 0) >= this.healthTracker.goals.stepsGoal) completed++;
        }
        if (this.healthTracker.goals.waterGoal) {
            total++;
            if ((todayData.waterIntake || 0) >= this.healthTracker.goals.waterGoal) completed++;
        }
        if (this.healthTracker.goals.sleepGoal) {
            total++;
            if ((todayData.sleepHours || 0) >= this.healthTracker.goals.sleepGoal) completed++;
        }
        if (todayData.mood) {
            total++;
            completed++;
        }
        
        if (completedGoals) completedGoals.textContent = `${completed}/${total} Ziele`;
        
        // Calculate current streak
        const streak = this.calculateLongestStreak(allData);
        if (currentStreak) currentStreak.textContent = `${streak} Tage Streak`;
        
        // Calculate weekly average
        const last7Days = allData.slice(0, 7);
        const weekAvg = last7Days.length > 0 ? 
            last7Days.reduce((sum, d) => sum + this.calculateOverallScore(d), 0) / last7Days.length : 0;
        if (weeklyAvg) weeklyAvg.textContent = `Ø ${Math.round(weekAvg)}% diese Woche`;
    }

    // Handle actions
    handleQuickAction(action) {
        switch (action) {
            case 'takeWalk':
                this.healthTracker.notificationManager.showInAppNotification('🚶‍♂️ Zeit für einen Spaziergang! Jeder Schritt bringt dich näher zu deinem Ziel.', 'info');
                break;
            case 'drinkWater':
                this.healthTracker.notificationManager.showInAppNotification('💧 Trinke ein Glas Wasser! Dein Körper wird es dir danken.', 'info');
                break;
            case 'prepareSleep':
                this.healthTracker.notificationManager.showInAppNotification('🌙 Zeit, sich auf den Schlaf vorzubereiten. Schalte Geräte aus und entspanne dich.', 'info');
                break;
            case 'recordWeight':
            case 'recordMood':
            case 'enterData':
            case 'finishSteps':
                document.getElementById('health-form')?.scrollIntoView({ behavior: 'smooth' });
                break;
        }
    }

    // Placeholder methods for other views
    updateWeekView(data) {
        console.log('🗓️ Updating week view...', data.length, 'entries');
        // TODO: Implement enhanced week view
    }

    updateAchievementsView(data) {
        console.log('🏆 Updating achievements view...', data.length, 'entries');
        // TODO: Implement achievements system
    }

    updateStreaksView(data) {
        console.log('🔥 Updating streaks view...', data.length, 'entries');
        // TODO: Implement streaks visualization
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

    initRefreshButton() {
        const refreshBtn = document.getElementById('refresh-activities-btn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                this.load();
                this.showRefreshAnimation(refreshBtn);
            });
        }
    }

    showRefreshAnimation(btn) {
        const icon = btn.querySelector('i');
        if (icon) {
            icon.style.animation = 'spin 0.5s linear';
            setTimeout(() => {
                icon.style.animation = '';
            }, 500);
        }
    }

    async load() {
        try {
            let activities = [];
            
            // Versuche Server-Daten zu laden
            if (navigator.onLine) {
                try {
                    const response = await fetch(`/api/health-data/${this.healthTracker.userId}`);
                    if (response.ok) {
                        const serverData = await response.json();
                        activities = this.parseActivities(serverData);
                    }
                } catch (error) {
                    console.log('Server data not available:', error.message);
                }
            }
            
            // Fallback auf lokale Daten
            if (activities.length === 0) {
                const localData = JSON.parse(localStorage.getItem('healthData') || '[]');
                activities = this.parseActivities(localData);
            }
            
            this.render(activities.slice(0, 10)); // Nur die letzten 10
            
        } catch (error) {
            console.error('Error loading activities:', error);
            this.render([]);
        }
    }

    parseActivities(data) {
        if (!Array.isArray(data)) return [];
        
        const activities = [];
        
        // Sortiere nach Datum (neueste zuerst)
        const sortedData = data.sort((a, b) => new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date));
        
        sortedData.forEach(entry => {
            const date = new Date(entry.date);
            const timeStr = this.formatTime(date);
            
            // Erstelle Aktivitäten für jeden Datentyp
            if (entry.steps && entry.steps > 0) {
                activities.push({
                    type: 'steps',
                    label: `${entry.steps.toLocaleString()} Schritte erfasst`,
                    time: timeStr,
                    value: entry.steps,
                    date: date
                });
            }
            
            if (entry.waterIntake && entry.waterIntake > 0) {
                activities.push({
                    type: 'water',
                    label: `${entry.waterIntake}L Wasser getrunken`,
                    time: timeStr,
                    value: entry.waterIntake,
                    date: date
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
                    date: date
                });
            }
            
            if (entry.weight && entry.weight > 0) {
                activities.push({
                    type: 'weight',
                    label: `Gewicht: ${entry.weight}kg erfasst`,
                    time: timeStr,
                    value: entry.weight,
                    date: date
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
                    date: date
                });
            }
        });
        
        // Nach Datum sortieren (neueste zuerst)
        return activities.sort((a, b) => b.date - a.date);
    }

    formatTime(date) {
        const now = new Date();
        const diffMs = now - date;
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        
        if (diffDays === 0) {
            return `Heute • ${date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}`;
        } else if (diffDays === 1) {
            return 'Gestern';
        } else if (diffDays < 7) {
            return `${diffDays} Tage her`;
        } else {
            return date.toLocaleDateString('de-DE');
        }
    }

    render(activities = []) {
        if (!this.rootEl) return;
        
        // Container leeren
        this.rootEl.innerHTML = '';
        
        if (!activities.length) {
            this.showEmpty();
            return;
        }
        
        this.hideEmpty();
        
        // Timeline-Linie hinzufügen
        const timeline = document.createElement('div');
        timeline.className = 'absolute left-3 top-0 bottom-0 w-px bg-base-300';
        this.rootEl.appendChild(timeline);
        
        activities.forEach((activity, index) => {
            const item = this.createActivityItem(activity, index === 0);
            this.rootEl.appendChild(item);
        });
    }

    createActivityItem(activity, isLatest = false) {
        const item = document.createElement('div');
        item.className = 'relative flex items-start gap-4 pb-6';
        
        const colorMap = {
            steps: 'success',
            water: 'info', 
            sleep: 'warning',
            weight: 'secondary',
            mood: 'accent'
        };
        
        const color = colorMap[activity.type] || 'primary';
        const pingClass = isLatest ? 'animate-ping' : '';
        
        item.innerHTML = `
            <span class="absolute -left-[9px] top-1.5 flex h-3 w-3">
                ${isLatest ? `<span class="absolute inline-flex h-full w-full rounded-full bg-${color} opacity-75 animate-ping"></span>` : ''}
                <span class="relative inline-flex rounded-full h-3 w-3 bg-${color}"></span>
            </span>
            
            <div class="flex-1">
                <p class="font-medium text-base-content">${activity.label}</p>
                <p class="text-xs text-base-content/60">${activity.time}</p>
            </div>
            
            <div class="badge badge-${color} badge-outline text-xs shrink-0">
                ${activity.type.charAt(0).toUpperCase() + activity.type.slice(1)}
            </div>
        `;
        
        return item;
    }

    showEmpty() {
        if (this.emptyEl) {
            this.emptyEl.classList.remove('hidden');
        }
    }

    hideEmpty() {
        if (this.emptyEl) {
            this.emptyEl.classList.add('hidden');
        }
    }

    // Neue Aktivität hinzufügen (wird vom HealthTracker aufgerufen)
    addActivity(type, data) {
        // Reload aktivieren
        setTimeout(() => this.load(), 500);
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
            // ✅ Verwende sichere Event-Listener-Registrierung
            this.addEventListenerOnce(heatmapSelect, 'change', (e) => {
                console.log('📊 Changing heatmap metric to:', e.target.value);
                this.generateHeatmap(this.currentData || []);
            });
        }
    }

    addEventListenerOnce(element, event, handler, options = {}) {
        if (!element) return;
        element.removeEventListener(event, handler, options);
        element.addEventListener(event, handler, options);
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
            // RESIZE PROTECTION:
            onResize: (chart, size) => {
    // Debounce resize to prevent loops
    clearTimeout(chart._resizeTimeout);
    chart._resizeTimeout = setTimeout(() => {
        chart.resize();
    }, 100);
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
