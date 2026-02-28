/**
 * ===================================
 * CoCLEAR - Main Application
 * ===================================
 * Application initialization, navigation,
 * and event handling
 */

class App {
    constructor() {
        this.currentTab = 'dashboard';
        this.isInitialized = false;
    }

    /**
     * Initialize the application
     */
    async init() {
        console.log('🚀 CoCLEAR Starting...');

        try {
            // Show loading screen
            this.showLoadingScreen();

            // Validate configuration
            if (!thingSpeakAPI.validateConfig()) {
                this.showConfigWarning();
            }

            // Initialize dashboard
            await dashboard.initialize();

            // Setup event listeners
            this.setupEventListeners();

            // Setup navigation
            this.setupNavigation();

            // Check notification permission
            this.updateNotificationToggle();

            // Hide loading screen and show app
            setTimeout(() => {
                this.hideLoadingScreen();
                this.isInitialized = true;
                console.log('✅ CoCLEAR Ready!');
            }, 1500);

        } catch (error) {
            console.error('❌ Initialization error:', error);
            this.showError('Failed to initialize application. Please check your configuration.');
        }
    }

    /**
     * Setup navigation between tabs
     */
    setupNavigation() {
        const tabButtons = document.querySelectorAll('.tab-button');
        const panels = document.querySelectorAll('.panel');

        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                const targetTab = button.getAttribute('data-tab');
                this.switchTab(targetTab, tabButtons, panels);
            });
        });
    }

    /**
     * Switch between tabs
     * @param {string} tabName - Name of tab to switch to
     * @param {NodeList} buttons - Tab button elements
     * @param {NodeList} panels - Panel elements
     */
    switchTab(tabName, buttons, panels) {
        // Update buttons
        buttons.forEach(btn => {
            const isActive = btn.getAttribute('data-tab') === tabName;
            btn.classList.toggle('active', isActive);
            btn.setAttribute('aria-selected', isActive);
        });

        // Update panels
        panels.forEach(panel => {
            const isActive = panel.id === `${tabName}-panel`;
            panel.classList.toggle('active', isActive);
            panel.hidden = !isActive;
        });

        this.currentTab = tabName;

        // Trigger specific actions for certain tabs
        if (tabName === 'history') {
            alertSystem.renderAlertHistory();
        }
    }

    /**
     * Setup all event listeners
     */
    setupEventListeners() {
        // Alert modal dismiss
        document.getElementById('dismissAlertBtn')?.addEventListener('click', () => {
            this.hideAlertModal();
        });

        // Settings - Save configuration
        document.getElementById('saveConfigBtn')?.addEventListener('click', () => {
            this.saveConfiguration();
        });

        // Settings - Request notification permission
        document.getElementById('requestNotificationBtn')?.addEventListener('click', async () => {
            const permission = await alertSystem.requestNotificationPermission();
            this.updateNotificationToggle();
            
            if (permission === 'granted') {
                alert('✅ Notifications enabled! You will receive alerts for dangerous noise levels.');
            } else {
                alert('⚠️ Notifications blocked. Please enable them in your browser settings.');
            }
        });

        // Settings - Notification toggle
        document.getElementById('notificationsToggle')?.addEventListener('change', (e) => {
            CONFIG.notifications.enabled = e.target.checked;
            configManager.saveConfig();
        });

        // Settings - Daily report toggle
        document.getElementById('dailyReportToggle')?.addEventListener('change', (e) => {
            // Save preference
            localStorage.setItem('dailyReportEnabled', e.target.checked);
        });

        // Settings - Threshold changes
        ['cautionThreshold', 'dangerThreshold', 'emergencyThreshold'].forEach(id => {
            document.getElementById(id)?.addEventListener('change', (e) => {
                const value = parseInt(e.target.value);
                const key = id.replace('Threshold', '');
                CONFIG.thresholds[key] = value;
                configManager.saveConfig();
                console.log(`✅ ${key} threshold updated to ${value} dB`);
            });
        });

        // Settings - Export data
        document.getElementById('exportDataBtn')?.addEventListener('click', () => {
            reportSystem.exportHealthData();
            alert('✅ Health data exported successfully!');
        });

        // Settings - Clear data
        document.getElementById('clearDataBtn')?.addEventListener('click', () => {
            reportSystem.clearAllData();
        });

        // Report - Generate report
        document.getElementById('generateReportBtn')?.addEventListener('click', () => {
            reportSystem.generateReport();
        });

        // History - Clear history
        document.getElementById('clearHistoryBtn')?.addEventListener('click', () => {
            alertSystem.clearHistory();
        });

        // Chart time range selector
        document.getElementById('chartTimeRange')?.addEventListener('change', (e) => {
            dashboard.changeChartTimeRange(e.target.value);
        });

        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.hideAlertModal();
            }
        });

        // Visibility change - pause/resume updates when tab is hidden
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                console.log('📴 App hidden - updates continue in background');
            } else {
                console.log('👁️ App visible - updates active');
                dashboard.fetchAndUpdate(); // Immediate update when returning
            }
        });

        console.log('✅ Event listeners setup complete');
    }

    /**
     * Save ThingSpeak configuration
     */
    saveConfiguration() {
        const channelId = document.getElementById('channelIdInput')?.value;
        const apiKey = document.getElementById('apiKeyInput')?.value;

        if (!channelId || !apiKey) {
            alert('⚠️ Please enter both Channel ID and API Key');
            return;
        }

        const success = configManager.updateThingSpeakConfig(channelId, apiKey);

        if (success) {
            alert('✅ Configuration saved! The app will reload to apply changes.');
            setTimeout(() => location.reload(), 1000);
        } else {
            alert('❌ Failed to save configuration. Please try again.');
        }
    }

    /**
     * Update notification toggle based on permission
     */
    updateNotificationToggle() {
        const toggle = document.getElementById('notificationsToggle');
        const requestBtn = document.getElementById('requestNotificationBtn');

        if (toggle) {
            toggle.checked = CONFIG.notifications.enabled;
            toggle.disabled = Notification.permission !== 'granted';
        }

        if (requestBtn) {
            requestBtn.style.display = 
                Notification.permission === 'granted' ? 'none' : 'block';
        }
    }

    /**
     * Show configuration warning
     */
    showConfigWarning() {
        const warning = document.createElement('div');
        warning.className = 'config-warning';
        warning.style.cssText = `
            position: fixed;
            top: 80px;
            left: 50%;
            transform: translateX(-50%);
            background: #FFB800;
            color: #2B2D42;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            z-index: 1000;
            max-width: 90%;
            text-align: center;
            animation: slideDown 0.3s ease;
        `;
        warning.innerHTML = `
            <strong>⚠️ Configuration Required</strong><br>
            <small>Please enter your ThingSpeak credentials in Settings</small>
        `;
        document.body.appendChild(warning);

        setTimeout(() => {
            warning.style.animation = 'slideUp 0.3s ease';
            setTimeout(() => warning.remove(), 300);
        }, 5000);
    }

    /**
     * Show error message
     * @param {string} message - Error message
     */
    showError(message) {
        alert(`❌ Error: ${message}`);
    }

    /**
     * Show loading screen
     */
    showLoadingScreen() {
        const loadingScreen = document.getElementById('loadingScreen');
        if (loadingScreen) {
            loadingScreen.style.display = 'flex';
        }
    }

    /**
     * Hide loading screen
     */
    hideLoadingScreen() {
        const loadingScreen = document.getElementById('loadingScreen');
        const app = document.getElementById('app');

        if (loadingScreen) {
            loadingScreen.style.animation = 'fadeOut 0.5s ease';
            setTimeout(() => {
                loadingScreen.style.display = 'none';
            }, 500);
        }

        if (app) {
            app.style.display = 'flex';
        }
    }

    /**
     * Hide alert modal
     */
    hideAlertModal() {
        const modal = document.getElementById('alertModal');
        if (modal) {
            modal.hidden = true;
            modal.setAttribute('aria-hidden', 'true');
        }
    }

    /**
     * Load saved threshold values into settings
     */
    loadSettingsValues() {
        document.getElementById('cautionThreshold').value = CONFIG.thresholds.caution;
        document.getElementById('dangerThreshold').value = CONFIG.thresholds.danger;
        document.getElementById('emergencyThreshold').value = CONFIG.thresholds.emergency;
    }
}

// ===================================
// Application Entry Point
// ===================================

// Wait for DOM to be ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    initializeApp();
}

/**
 * Initialize the application
 */
function initializeApp() {
    // Create app instance
    const app = new App();
    
    // Load settings values
    app.loadSettingsValues();
    
    // Initialize app
    app.init();

    // Make app globally accessible for debugging
    window.CoCLEAR = {
        app,
        dashboard,
        alertSystem,
        reportSystem,
        thingSpeakAPI,
        configManager,
        CONFIG,
        
        // Utility functions for debugging
        debug: {
            triggerTestAlert: (level = 'danger') => {
                const testLevels = {
                    caution: 75,
                    danger: 90,
                    emergency: 105,
                };
                alertSystem.analyzeNoiseLevel(testLevels[level]);
            },
            generateTestReport: () => {
                reportSystem.generateReport();
            },
            clearAllData: () => {
                reportSystem.clearAllData();
            },
            exportData: () => {
                reportSystem.exportHealthData();
            },
        }
    };

    console.log('🎉 CoCLEAR initialized! Access debug tools via window.CoCLEAR');
}

// Handle page unload
window.addEventListener('beforeunload', () => {
    // Save any pending data
    reportSystem.saveTodayData();
    console.log('💾 Data saved before page unload');
});

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideDown {
        from {
            opacity: 0;
            transform: translateX(-50%) translateY(-20px);
        }
        to {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
        }
    }
    
    @keyframes slideUp {
        from {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
        }
        to {
            opacity: 0;
            transform: translateX(-50%) translateY(-20px);
        }
    }
    
    @keyframes fadeOut {
        from {
            opacity: 1;
        }
        to {
            opacity: 0;
        }
    }
    
    .risk-badge-large {
        display: inline-block;
        padding: 0.75rem 1.5rem;
        border-radius: 9999px;
        font-weight: 700;
        font-size: 1.125rem;
        margin: 1rem 0;
        text-transform: uppercase;
        letter-spacing: 0.05em;
    }
    
    .risk-badge-large.safe {
        background: var(--accent-safe);
        color: white;
    }
    
    .risk-badge-large.moderate {
        background: var(--accent-caution);
        color: white;
    }
    
    .risk-badge-large.high {
        background: var(--accent-danger);
        color: white;
    }
    
    .risk-assessment {
        text-align: center;
        padding: 2rem;
        background: var(--bg-tertiary);
        border-radius: var(--radius-md);
        margin: 2rem 0;
    }
    
    .risk-recommendation {
        margin-top: 1rem;
        color: var(--text-secondary);
        line-height: 1.6;
    }
    
    .report-insights {
        margin-top: 2rem;
        padding-top: 2rem;
        border-top: 1px solid var(--border-color);
    }
    
    .insights-list {
        list-style: none;
        padding: 0;
    }
    
    .insights-list li {
        padding: 1rem;
        margin-bottom: 0.75rem;
        background: var(--bg-tertiary);
        border-radius: var(--radius-sm);
        border-left: 3px solid var(--primary-color);
    }
    
    .report-footer {
        margin-top: 2rem;
        padding-top: 1rem;
        border-top: 1px solid var(--border-color);
        text-align: center;
        color: var(--text-tertiary);
    }
`;
document.head.appendChild(style);
