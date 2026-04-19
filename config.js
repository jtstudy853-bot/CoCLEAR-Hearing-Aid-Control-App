/**
 * ===================================
 * CoCLEAR - Configuration Module
 * ===================================
 * Manages app configuration, ThingSpeak API settings,
 * and threshold values
 */

const CONFIG = {
    // ThingSpeak API Configuration
    // Replace these with your actual ThingSpeak channel details
    thingspeak: {
        channelId: '2738307', // Default demo channel - REPLACE WITH YOUR CHANNEL
        readApiKey: 'VAYUR95VK2VGTYFD', // Default demo key - REPLACE WITH YOUR KEY
        baseUrl: 'https://api.thingspeak.com',
        updateInterval: 15000, // 15 seconds (ThingSpeak free tier limit)
    },

    // Field mappings from ThingSpeak
    fields: {
        noiseLevel: 'field1',     // Noise Level in dB
        volume: 'field2',         // Hearing Aid Volume %
        battery: 'field3',        // Battery Percentage
        deviceMode: 'field4',     // Device Mode (1=Normal, 2=Quiet, 3=Loud)
    },

    // Noise safety thresholds (in dB)
    thresholds: {
        safe: 70,           // Under 70 dB is safe
        caution: 70,        // 70-85 dB is caution zone
        danger: 85,         // 85-100 dB is dangerous
        emergency: 100,     // Over 100 dB requires immediate action
    },

    // Alert cooldown settings (milliseconds)
    alertCooldown: {
        caution: 300000,    // 5 minutes between caution alerts
        danger: 180000,     // 3 minutes between danger alerts
        emergency: 60000,   // 1 minute between emergency alerts
    },

    // Risk scoring weights
    riskScoring: {
        durationWeight: 0.6,    // 60% based on time in loud environments
        peakWeight: 0.4,        // 40% based on peak noise levels
        maxScore: 100,
        safeDuration: 480,      // Safe duration in minutes (8 hours)
        dangerDuration: 60,     // Dangerous duration threshold in minutes
    },

    // Data retention settings
    dataRetention: {
        chartDataPoints: 50,     // Number of data points to show on chart
        maxHistoryItems: 100,    // Maximum alert history items to store
        reportHistoryDays: 30,   // Days of report history to keep
    },

    // Device mode labels
    deviceModes: {
        1: 'Normal',
        2: 'Quiet Mode',
        3: 'Loud Environment',
        4: 'Music Mode',
        5: 'Phone Call',
    },

    // Notification settings
    notifications: {
        enabled: false,  // Will be set based on user permission
        dailyReportTime: '20:00', // 8 PM daily report
    },

    // Local storage keys
    storageKeys: {
        config: 'coclear_config',
        trackingData: 'coclear_tracking',
        alertHistory: 'coclear_alerts',
        reportHistory: 'coclear_reports',
        lastAlert: 'coclear_last_alert',
        preferences: 'coclear_preferences',
    },
};

/**
 * Configuration Manager
 * Handles loading and saving configuration from localStorage
 */
class ConfigManager {
    constructor() {
        this.loadConfig();
    }

    /**
     * Load configuration from localStorage
     * Merges with defaults if custom config exists
     */
    loadConfig() {
        try {
            const savedConfig = localStorage.getItem(CONFIG.storageKeys.config);
            if (savedConfig) {
                const parsed = JSON.parse(savedConfig);
                // Merge saved config with defaults
                if (parsed.thingspeak) {
                    CONFIG.thingspeak = { ...CONFIG.thingspeak, ...parsed.thingspeak };
                }
                if (parsed.thresholds) {
                    CONFIG.thresholds = { ...CONFIG.thresholds, ...parsed.thresholds };
                }
                if (parsed.notifications) {
                    CONFIG.notifications = { ...CONFIG.notifications, ...parsed.notifications };
                }
                console.log('✅ Configuration loaded from storage');
            }
        } catch (error) {
            console.error('❌ Error loading configuration:', error);
        }
    }

    /**
     * Save current configuration to localStorage
     */
    saveConfig() {
        try {
            const configToSave = {
                thingspeak: CONFIG.thingspeak,
                thresholds: CONFIG.thresholds,
                notifications: CONFIG.notifications,
            };
            localStorage.setItem(CONFIG.storageKeys.config, JSON.stringify(configToSave));
            console.log('✅ Configuration saved');
            return true;
        } catch (error) {
            console.error('❌ Error saving configuration:', error);
            return false;
        }
    }

    /**
     * Update ThingSpeak credentials
     * @param {string} channelId - ThingSpeak channel ID
     * @param {string} apiKey - ThingSpeak read API key
     */
    updateThingSpeakConfig(channelId, apiKey) {
        CONFIG.thingspeak.channelId = channelId;
        CONFIG.thingspeak.readApiKey = apiKey;
        return this.saveConfig();
    }

    /**
     * Update alert thresholds
     * @param {Object} thresholds - Object containing threshold values
     */
    updateThresholds(thresholds) {
        CONFIG.thresholds = { ...CONFIG.thresholds, ...thresholds };
        return this.saveConfig();
    }

    /**
     * Get current configuration
     * @returns {Object} Current CONFIG object
     */
    getConfig() {
        return CONFIG;
    }

    /**
     * Reset configuration to defaults
     */
    resetConfig() {
        localStorage.removeItem(CONFIG.storageKeys.config);
        console.log('⚠️ Configuration reset to defaults');
        location.reload(); // Reload to apply defaults
    }
}

// Create global config manager instance
const configManager = new ConfigManager();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { CONFIG, ConfigManager, configManager };
}
