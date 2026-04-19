/**
 * ===================================
 * CoCLEAR - API Module
 * ===================================
 * Handles all communication with ThingSpeak API
 * Manages data fetching, error handling, and connection status
 */

class ThingSpeakAPI {
    constructor() {
        this.isConnected = false;
        this.lastFetchTime = null;
        this.fetchAttempts = 0;
        this.maxRetries = 3;
        this.retryDelay = 2000; // 2 seconds
    }

    /**
     * Construct ThingSpeak API URL for latest data
     * @param {number} results - Number of results to fetch
     * @returns {string} API URL
     */
    getApiUrl(results = 1) {
        const { channelId, readApiKey, baseUrl } = CONFIG.thingspeak;
        return `${baseUrl}/channels/${channelId}/feeds.json?api_key=${readApiKey}&results=${results}`;
    }

    /**
     * Fetch latest sensor data from ThingSpeak
     * @returns {Promise<Object|null>} Sensor data or null if failed
     */
    async fetchLatestData() {
        try {
            const url = this.getApiUrl(1);
            console.log('🔄 Fetching data from ThingSpeak...');

            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            // Check if we have valid feed data
            if (!data.feeds || data.feeds.length === 0) {
                throw new Error('No data available from sensor');
            }

            const latestFeed = data.feeds[0];
            
            // Parse sensor data
            const sensorData = {
                timestamp: new Date(latestFeed.created_at),
                noiseLevel: parseFloat(latestFeed[CONFIG.fields.noiseLevel]) || 0,
                volume: parseFloat(latestFeed[CONFIG.fields.volume]) || 0,
                battery: parseFloat(latestFeed[CONFIG.fields.battery]) || 0,
                deviceMode: parseInt(latestFeed[CONFIG.fields.deviceMode]) || 1,
                raw: latestFeed, // Keep raw data for debugging
            };

            // Update connection status
            this.isConnected = true;
            this.lastFetchTime = new Date();
            this.fetchAttempts = 0;

            console.log('✅ Data fetched successfully:', sensorData);
            return sensorData;

        } catch (error) {
            console.error('❌ Error fetching data:', error);
            this.isConnected = false;
            this.fetchAttempts++;

            // Retry logic for transient failures
            if (this.fetchAttempts < this.maxRetries) {
                console.log(`🔄 Retrying... (${this.fetchAttempts}/${this.maxRetries})`);
                await this.delay(this.retryDelay);
                return this.fetchLatestData();
            }

            return null;
        }
    }

    /**
     * Fetch historical data for charting
     * @param {number} results - Number of historical data points
     * @returns {Promise<Array|null>} Array of sensor data or null if failed
     */
    async fetchHistoricalData(results = 50) {
        try {
            const url = this.getApiUrl(results);
            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            if (!data.feeds || data.feeds.length === 0) {
                return [];
            }

            // Parse all feeds into structured data
            const historicalData = data.feeds.map(feed => ({
                timestamp: new Date(feed.created_at),
                noiseLevel: parseFloat(feed[CONFIG.fields.noiseLevel]) || 0,
                volume: parseFloat(feed[CONFIG.fields.volume]) || 0,
                battery: parseFloat(feed[CONFIG.fields.battery]) || 0,
                deviceMode: parseInt(feed[CONFIG.fields.deviceMode]) || 1,
            }));

            console.log(`✅ Fetched ${historicalData.length} historical data points`);
            return historicalData;

        } catch (error) {
            console.error('❌ Error fetching historical data:', error);
            return null;
        }
    }

    /**
     * Get connection status
     * @returns {Object} Connection status information
     */
    getConnectionStatus() {
        return {
            isConnected: this.isConnected,
            lastFetchTime: this.lastFetchTime,
            timeSinceLastFetch: this.lastFetchTime 
                ? Date.now() - this.lastFetchTime.getTime() 
                : null,
        };
    }

    /**
     * Validate current configuration
     * @returns {boolean} True if configuration is valid
     */
    validateConfig() {
        const { channelId, readApiKey } = CONFIG.thingspeak;
        
        if (!channelId || channelId === 'YOUR_CHANNEL_ID') {
            console.warn('⚠️ ThingSpeak Channel ID not configured');
            return false;
        }

        if (!readApiKey || readApiKey === 'YOUR_READ_API_KEY') {
            console.warn('⚠️ ThingSpeak API Key not configured');
            return false;
        }

        return true;
    }

    /**
     * Utility function to add delay
     * @param {number} ms - Milliseconds to delay
     * @returns {Promise}
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Calculate data age for display
     * @param {Date} timestamp - Timestamp to compare
     * @returns {string} Human-readable time difference
     */
    static getTimeAgo(timestamp) {
        const now = new Date();
        const diffMs = now - timestamp;
        const diffSec = Math.floor(diffMs / 1000);
        const diffMin = Math.floor(diffSec / 60);
        const diffHour = Math.floor(diffMin / 60);

        if (diffSec < 60) return `${diffSec}s ago`;
        if (diffMin < 60) return `${diffMin}m ago`;
        if (diffHour < 24) return `${diffHour}h ago`;
        return timestamp.toLocaleDateString();
    }

    /**
     * Format timestamp for display
     * @param {Date} timestamp - Timestamp to format
     * @returns {string} Formatted time string
     */
    static formatTime(timestamp) {
        return timestamp.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
        });
    }

    /**
     * Reset connection state (useful for testing)
     */
    resetConnection() {
        this.isConnected = false;
        this.lastFetchTime = null;
        this.fetchAttempts = 0;
        console.log('🔄 Connection reset');
    }
}

// Create global API instance
const thingSpeakAPI = new ThingSpeakAPI();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ThingSpeakAPI, thingSpeakAPI };
}
