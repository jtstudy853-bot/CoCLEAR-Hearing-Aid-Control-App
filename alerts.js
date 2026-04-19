/**
 * ===================================
 * CoCLEAR - Alerts Module
 * ===================================
 * Handles dangerous noise detection, alerts,
 * notifications, and alert history management
 */

class AlertSystem {
    constructor() {
        this.lastAlertTimes = {
            caution: 0,
            danger: 0,
            emergency: 0,
        };
        this.currentNoiseLevel = null;
        this.alertHistory = [];
        this.notificationPermission = 'default';
        this.loadAlertHistory();
        this.checkNotificationPermission();
    }

    /**
     * Analyze noise level and trigger appropriate alerts
     * @param {number} noiseLevel - Current noise level in dB
     * @returns {Object|null} Alert information if triggered, null otherwise
     */
    analyzeNoiseLevel(noiseLevel) {
        this.currentNoiseLevel = noiseLevel;
        const { safe, caution, danger, emergency } = CONFIG.thresholds;

        let alertLevel = null;
        let message = '';
        let severity = 'safe';

        // Determine alert level
        if (noiseLevel >= emergency) {
            alertLevel = 'emergency';
            severity = 'emergency';
            message = 'IMMEDIATE ALERT: Extremely dangerous sound levels detected. Leave the area immediately or use hearing protection. Prolonged exposure can cause permanent hearing damage.';
        } else if (noiseLevel >= danger) {
            alertLevel = 'danger';
            severity = 'danger';
            message = 'Dangerous sound levels detected. Consider lowering volume or leaving the area to reduce risk of hearing damage. Exposure should be limited to prevent long-term hearing loss.';
        } else if (noiseLevel >= caution) {
            alertLevel = 'caution';
            severity = 'caution';
            message = 'Elevated noise levels detected. Monitor your hearing environment. Extended exposure may increase risk of hearing fatigue.';
        }

        // Check if we should trigger an alert (cooldown logic)
        if (alertLevel && this.shouldTriggerAlert(alertLevel)) {
            const alert = {
                level: alertLevel,
                severity: severity,
                noiseLevel: noiseLevel,
                message: message,
                timestamp: new Date(),
                id: Date.now(),
            };

            this.triggerAlert(alert);
            return alert;
        }

        return null;
    }

    /**
     * Check if enough time has passed since last alert of this type
     * @param {string} level - Alert level (caution, danger, emergency)
     * @returns {boolean} True if alert should be triggered
     */
    shouldTriggerAlert(level) {
        const now = Date.now();
        const lastAlert = this.lastAlertTimes[level];
        const cooldown = CONFIG.alertCooldown[level];

        // Emergency alerts have shorter cooldown and can escalate from danger
        if (level === 'emergency') {
            return (now - lastAlert) > cooldown;
        }

        return (now - lastAlert) > cooldown;
    }

    /**
     * Trigger an alert - show modal and send notification
     * @param {Object} alert - Alert information
     */
    triggerAlert(alert) {
        console.log(`⚠️ ALERT TRIGGERED: ${alert.level.toUpperCase()}`, alert);

        // Update last alert time
        this.lastAlertTimes[alert.level] = Date.now();

        // Add to history
        this.addToHistory(alert);

        // Show alert modal
        this.showAlertModal(alert);

        // Send browser notification
        this.sendNotification(alert);

        // Trigger vibration for emergency alerts (if supported)
        if (alert.level === 'emergency' && 'vibrate' in navigator) {
            navigator.vibrate([200, 100, 200, 100, 200]);
        }

        // Log to localStorage for persistence
        this.saveLastAlert(alert);
    }

    /**
     * Display alert modal to user
     * @param {Object} alert - Alert information
     */
    showAlertModal(alert) {
        const modal = document.getElementById('alertModal');
        const title = document.getElementById('alertTitle');
        const message = document.getElementById('alertMessage');
        const details = document.getElementById('alertDetails');
        const icon = document.getElementById('alertIcon');

        // Set icon based on severity
        const icons = {
            caution: '⚠️',
            danger: '🔴',
            emergency: '🚨',
        };
        icon.textContent = icons[alert.severity] || '⚠️';

        // Set title based on level
        const titles = {
            caution: 'Elevated Noise Detected',
            danger: 'Dangerous Noise Detected',
            emergency: 'EMERGENCY: Critical Noise Level',
        };
        title.textContent = titles[alert.level];

        // Set message
        message.textContent = alert.message;

        // Set details
        details.innerHTML = `
            <strong>Noise Level:</strong> ${alert.noiseLevel.toFixed(1)} dB<br>
            <strong>Time:</strong> ${alert.timestamp.toLocaleTimeString()}<br>
            <strong>Safe Limit:</strong> ${CONFIG.thresholds.danger} dB
        `;

        // Add severity class to modal
        const modalContent = modal.querySelector('.modal-content');
        modalContent.className = 'modal-content alert-modal-content';
        modalContent.classList.add(`alert-${alert.severity}`);

        // Show modal
        modal.hidden = false;
        modal.setAttribute('aria-hidden', 'false');

        // Focus on dismiss button for accessibility
        setTimeout(() => {
            document.getElementById('dismissAlertBtn').focus();
        }, 100);
    }

    /**
     * Send browser notification
     * @param {Object} alert - Alert information
     */
    async sendNotification(alert) {
        // Check if notifications are enabled and permitted
        if (!CONFIG.notifications.enabled || this.notificationPermission !== 'granted') {
            return;
        }

        try {
            const titles = {
                caution: '⚠️ CoCLEAR: Elevated Noise',
                danger: '🔴 CoCLEAR: Dangerous Noise',
                emergency: '🚨 CoCLEAR: EMERGENCY',
            };

            const notification = new Notification(titles[alert.level], {
                body: `Noise level: ${alert.noiseLevel.toFixed(1)} dB. ${alert.message}`,
                icon: '/icon.png', // Add your app icon path
                badge: '/badge.png', // Add your badge icon path
                tag: 'coclear-alert',
                requireInteraction: alert.level === 'emergency',
                vibrate: alert.level === 'emergency' ? [200, 100, 200] : [100],
            });

            notification.onclick = () => {
                window.focus();
                notification.close();
            };

        } catch (error) {
            console.error('❌ Error sending notification:', error);
        }
    }

    /**
     * Add alert to history
     * @param {Object} alert - Alert information
     */
    addToHistory(alert) {
        this.alertHistory.unshift(alert);

        // Limit history size
        if (this.alertHistory.length > CONFIG.dataRetention.maxHistoryItems) {
            this.alertHistory = this.alertHistory.slice(0, CONFIG.dataRetention.maxHistoryItems);
        }

        this.saveAlertHistory();
        this.renderAlertHistory();
    }

    /**
     * Render alert history to UI
     */
    renderAlertHistory() {
        const container = document.getElementById('alertHistoryContainer');
        
        if (!this.alertHistory || this.alertHistory.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon" aria-hidden="true">✓</div>
                    <p>No alerts recorded</p>
                    <small>Your hearing environment has been safe</small>
                </div>
            `;
            return;
        }

        container.innerHTML = this.alertHistory.map(alert => `
            <div class="alert-item ${alert.severity}" role="article">
                <div class="alert-item-header">
                    <h3 class="alert-item-title">
                        ${alert.level === 'emergency' ? '🚨' : alert.level === 'danger' ? '🔴' : '⚠️'}
                        ${alert.noiseLevel.toFixed(1)} dB
                    </h3>
                    <span class="alert-item-time">${ThingSpeakAPI.getTimeAgo(alert.timestamp)}</span>
                </div>
                <p class="alert-item-details">${alert.message}</p>
            </div>
        `).join('');
    }

    /**
     * Clear all alert history
     */
    clearHistory() {
        if (confirm('Are you sure you want to clear all alert history?')) {
            this.alertHistory = [];
            this.saveAlertHistory();
            this.renderAlertHistory();
            console.log('✅ Alert history cleared');
        }
    }

    /**
     * Save alert history to localStorage
     */
    saveAlertHistory() {
        try {
            localStorage.setItem(
                CONFIG.storageKeys.alertHistory,
                JSON.stringify(this.alertHistory.map(alert => ({
                    ...alert,
                    timestamp: alert.timestamp.toISOString(),
                })))
            );
        } catch (error) {
            console.error('❌ Error saving alert history:', error);
        }
    }

    /**
     * Load alert history from localStorage
     */
    loadAlertHistory() {
        try {
            const saved = localStorage.getItem(CONFIG.storageKeys.alertHistory);
            if (saved) {
                this.alertHistory = JSON.parse(saved).map(alert => ({
                    ...alert,
                    timestamp: new Date(alert.timestamp),
                }));
                console.log(`✅ Loaded ${this.alertHistory.length} alerts from history`);
            }
        } catch (error) {
            console.error('❌ Error loading alert history:', error);
            this.alertHistory = [];
        }
    }

    /**
     * Save last alert to localStorage
     * @param {Object} alert - Alert information
     */
    saveLastAlert(alert) {
        try {
            localStorage.setItem(
                CONFIG.storageKeys.lastAlert,
                JSON.stringify({
                    ...alert,
                    timestamp: alert.timestamp.toISOString(),
                })
            );
        } catch (error) {
            console.error('❌ Error saving last alert:', error);
        }
    }

    /**
     * Request notification permission from user
     * @returns {Promise<string>} Permission status
     */
    async requestNotificationPermission() {
        if (!('Notification' in window)) {
            console.warn('⚠️ This browser does not support notifications');
            return 'denied';
        }

        try {
            const permission = await Notification.requestPermission();
            this.notificationPermission = permission;
            CONFIG.notifications.enabled = permission === 'granted';
            configManager.saveConfig();

            if (permission === 'granted') {
                console.log('✅ Notification permission granted');
                // Send test notification
                new Notification('CoCLEAR Notifications Enabled', {
                    body: 'You will now receive alerts for dangerous noise levels.',
                    icon: '/icon.png',
                });
            } else {
                console.log('⚠️ Notification permission denied');
            }

            return permission;
        } catch (error) {
            console.error('❌ Error requesting notification permission:', error);
            return 'denied';
        }
    }

    /**
     * Check current notification permission
     */
    checkNotificationPermission() {
        if ('Notification' in window) {
            this.notificationPermission = Notification.permission;
            CONFIG.notifications.enabled = this.notificationPermission === 'granted';
        }
    }

    /**
     * Get noise level classification
     * @param {number} noiseLevel - Noise level in dB
     * @returns {Object} Classification information
     */
    static classifyNoiseLevel(noiseLevel) {
        const { caution, danger, emergency } = CONFIG.thresholds;

        if (noiseLevel < caution) {
            return { level: 'safe', label: 'Safe', color: 'var(--accent-safe)' };
        } else if (noiseLevel < danger) {
            return { level: 'caution', label: 'Caution', color: 'var(--accent-caution)' };
        } else if (noiseLevel < emergency) {
            return { level: 'danger', label: 'Dangerous', color: 'var(--accent-danger)' };
        } else {
            return { level: 'emergency', label: 'Emergency', color: 'var(--accent-emergency)' };
        }
    }
}

// Create global alert system instance
const alertSystem = new AlertSystem();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { AlertSystem, alertSystem };
}
