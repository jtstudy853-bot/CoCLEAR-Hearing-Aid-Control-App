/**
 * ===================================
 * CoCLEAR - Dashboard Module
 * ===================================
 * Handles dashboard UI updates, chart rendering,
 * and real-time data display
 */

class Dashboard {
    constructor() {
        this.chart = null;
        this.chartData = [];
        this.updateInterval = null;
        this.isInitialized = false;
    }

    /**
     * Initialize dashboard
     */
    async initialize() {
        console.log('🎯 Initializing dashboard...');

        // Setup chart
        this.initializeChart();

        // Load historical data for chart
        await this.loadChartData();

        // Start auto-update cycle
        this.startAutoUpdate();

        // Render initial alert history
        alertSystem.renderAlertHistory();

        this.isInitialized = true;
        console.log('✅ Dashboard initialized');
    }

    /**
     * Initialize Chart.js chart
     */
    initializeChart() {
        const ctx = document.getElementById('noiseChart');
        
        if (!ctx) {
            console.error('❌ Chart canvas not found');
            return;
        }

        this.chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Noise Level (dB)',
                    data: [],
                    borderColor: 'rgb(8, 131, 149)',
                    backgroundColor: 'rgba(8, 131, 149, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 3,
                    pointHoverRadius: 6,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                interaction: {
                    mode: 'index',
                    intersect: false,
                },
                plugins: {
                    legend: {
                        display: false,
                    },
                    tooltip: {
                        backgroundColor: 'rgba(10, 77, 104, 0.95)',
                        padding: 12,
                        titleFont: {
                            size: 14,
                            weight: 'bold',
                        },
                        bodyFont: {
                            size: 13,
                        },
                        callbacks: {
                            label: function(context) {
                                return `${context.parsed.y.toFixed(1)} dB`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        display: true,
                        title: {
                            display: true,
                            text: 'Time',
                            font: {
                                size: 12,
                                weight: '500',
                            }
                        },
                        grid: {
                            display: false,
                        },
                        ticks: {
                            maxTicksLimit: 8,
                        }
                    },
                    y: {
                        display: true,
                        title: {
                            display: true,
                            text: 'Noise Level (dB)',
                            font: {
                                size: 12,
                                weight: '500',
                            }
                        },
                        min: 0,
                        max: 120,
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)',
                        },
                        ticks: {
                            stepSize: 20,
                        }
                    }
                },
                // Add threshold lines
                plugins: {
                    annotation: {
                        annotations: {
                            dangerLine: {
                                type: 'line',
                                yMin: CONFIG.thresholds.danger,
                                yMax: CONFIG.thresholds.danger,
                                borderColor: 'rgba(255, 107, 107, 0.5)',
                                borderWidth: 2,
                                borderDash: [5, 5],
                            },
                            emergencyLine: {
                                type: 'line',
                                yMin: CONFIG.thresholds.emergency,
                                yMax: CONFIG.thresholds.emergency,
                                borderColor: 'rgba(230, 57, 70, 0.5)',
                                borderWidth: 2,
                                borderDash: [5, 5],
                            }
                        }
                    }
                }
            }
        });
    }

    /**
     * Load historical data for chart
     */
    async loadChartData() {
        const historicalData = await thingSpeakAPI.fetchHistoricalData(
            CONFIG.dataRetention.chartDataPoints
        );

        if (historicalData && historicalData.length > 0) {
            this.chartData = historicalData;
            this.updateChart();
            console.log(`✅ Loaded ${historicalData.length} data points for chart`);
        }
    }

    /**
     * Update chart with current data
     */
    updateChart() {
        if (!this.chart || !this.chartData.length) return;

        const labels = this.chartData.map(d => 
            d.timestamp.toLocaleTimeString('en-US', { 
                hour: '2-digit', 
                minute: '2-digit' 
            })
        );

        const data = this.chartData.map(d => d.noiseLevel);

        this.chart.data.labels = labels;
        this.chart.data.datasets[0].data = data;
        this.chart.update('none'); // Update without animation for performance
    }

    /**
     * Update dashboard with new sensor data
     * @param {Object} data - Sensor data from ThingSpeak
     */
    updateDashboard(data) {
        if (!data) return;

        // Update primary metrics
        this.updateNoiseLevel(data.noiseLevel);
        this.updateVolume(data.volume);
        this.updateBattery(data.battery);
        this.updateDeviceMode(data.deviceMode);

        // Update timestamp
        this.updateTimestamp(data.timestamp);

        // Add to chart data
        this.addChartDataPoint(data);

        // Update risk score display
        this.updateRiskScore();

        // Check for alerts
        alertSystem.analyzeNoiseLevel(data.noiseLevel);

        // Track reading for reports
        reportSystem.trackReading(data);
    }

    /**
     * Update noise level display
     * @param {number} noiseLevel - Noise level in dB
     */
    updateNoiseLevel(noiseLevel) {
        const valueElement = document.querySelector('#noiseValue .value-number');
        const labelElement = document.getElementById('noiseLabel');
        const barElement = document.getElementById('noiseBar');
        const cardElement = document.getElementById('noiseLevelCard');

        if (valueElement) {
            valueElement.textContent = noiseLevel.toFixed(1);
        }

        // Update classification label
        const classification = AlertSystem.classifyNoiseLevel(noiseLevel);
        if (labelElement) {
            labelElement.textContent = classification.label;
        }

        // Update noise bar width (0-120 dB scale)
        if (barElement) {
            const percentage = Math.min((noiseLevel / 120) * 100, 100);
            barElement.style.width = `${percentage}%`;
        }

        // Update card background for high noise
        if (cardElement) {
            if (classification.level === 'emergency') {
                cardElement.style.background = 'linear-gradient(135deg, #E63946 0%, #D62828 100%)';
            } else if (classification.level === 'danger') {
                cardElement.style.background = 'linear-gradient(135deg, #FF6B6B 0%, #EE5A6F 100%)';
            } else if (classification.level === 'caution') {
                cardElement.style.background = 'linear-gradient(135deg, #FFB800 0%, #FF9500 100%)';
            } else {
                cardElement.style.background = 'linear-gradient(135deg, var(--primary-color) 0%, var(--primary-light) 100%)';
            }
        }
    }

    /**
     * Update volume display
     * @param {number} volume - Volume percentage
     */
    updateVolume(volume) {
        const valueElement = document.getElementById('volumeValue');
        if (valueElement) {
            valueElement.textContent = Math.round(volume);
        }
    }

    /**
     * Update battery display
     * @param {number} battery - Battery percentage
     */
    updateBattery(battery) {
        const valueElement = document.getElementById('batteryValue');
        const levelElement = document.getElementById('batteryLevel');
        const iconElement = document.getElementById('batteryIcon');

        if (valueElement) {
            valueElement.textContent = Math.round(battery);
        }

        if (levelElement) {
            levelElement.style.width = `${battery}%`;
        }

        // Update battery color based on level
        if (iconElement) {
            iconElement.classList.remove('low', 'medium');
            if (battery <= 20) {
                iconElement.classList.add('low');
            } else if (battery <= 50) {
                iconElement.classList.add('medium');
            }
        }
    }

    /**
     * Update device mode display
     * @param {number} mode - Device mode number
     */
    updateDeviceMode(mode) {
        const valueElement = document.getElementById('modeValue');
        if (valueElement) {
            const modeName = CONFIG.deviceModes[mode] || 'Unknown';
            valueElement.textContent = modeName;
        }
    }

    /**
     * Update timestamp display
     * @param {Date} timestamp - Data timestamp
     */
    updateTimestamp(timestamp) {
        const timeElement = document.getElementById('noiseUpdateTime');
        if (timeElement) {
            timeElement.textContent = ThingSpeakAPI.getTimeAgo(timestamp);
        }
    }

    /**
     * Add new data point to chart
     * @param {Object} data - Sensor data
     */
    addChartDataPoint(data) {
        this.chartData.push(data);

        // Keep only last N data points
        if (this.chartData.length > CONFIG.dataRetention.chartDataPoints) {
            this.chartData.shift();
        }

        this.updateChart();
    }

    /**
     * Update risk score display
     */
    updateRiskScore() {
        const scoreElement = document.getElementById('riskScore');
        const circleElement = document.getElementById('riskCircle');
        const statusElement = document.getElementById('riskStatus');
        const avgElement = document.getElementById('avgExposure');
        const timeElement = document.getElementById('highNoiseTime');
        const peakElement = document.getElementById('peakNoise');

        const { riskScore, avgNoise, highNoiseDuration, peakNoise } = reportSystem.todayData;
        const riskLevel = reportSystem.getRiskLevel(riskScore);

        // Update score
        if (scoreElement) {
            scoreElement.textContent = riskScore;
        }

        // Update circular progress
        if (circleElement) {
            const circumference = 534.07; // 2 * π * 85
            const offset = circumference - (riskScore / 100) * circumference;
            circleElement.style.strokeDashoffset = offset;
            
            circleElement.classList.remove('moderate', 'high');
            if (riskLevel.level === 'moderate') {
                circleElement.classList.add('moderate');
            } else if (riskLevel.level === 'high') {
                circleElement.classList.add('high');
            }
        }

        // Update status badge
        if (statusElement) {
            statusElement.innerHTML = `<span class="status-badge ${riskLevel.level}">${riskLevel.label}</span>`;
        }

        // Update stats
        if (avgElement) {
            avgElement.textContent = avgNoise > 0 ? `${avgNoise.toFixed(1)} dB` : '-- dB';
        }
        if (timeElement) {
            timeElement.textContent = `${Math.round(highNoiseDuration)} min`;
        }
        if (peakElement) {
            peakElement.textContent = peakNoise > 0 ? `${peakNoise.toFixed(1)} dB` : '-- dB';
        }
    }

    /**
     * Update connection status indicator
     * @param {boolean} isConnected - Connection status
     */
    updateConnectionStatus(isConnected) {
        const dotElement = document.getElementById('statusDot');
        const textElement = document.getElementById('statusText');

        if (dotElement) {
            dotElement.classList.remove('online', 'offline');
            dotElement.classList.add(isConnected ? 'online' : 'offline');
        }

        if (textElement) {
            textElement.textContent = isConnected ? 'Connected' : 'Offline';
        }
    }

    /**
     * Start automatic data updates
     */
    startAutoUpdate() {
        // Initial fetch
        this.fetchAndUpdate();

        // Setup interval for regular updates
        this.updateInterval = setInterval(() => {
            this.fetchAndUpdate();
        }, CONFIG.thingspeak.updateInterval);

        console.log(`✅ Auto-update started (every ${CONFIG.thingspeak.updateInterval / 1000}s)`);
    }

    /**
     * Fetch data and update dashboard
     */
    async fetchAndUpdate() {
        try {
            const data = await thingSpeakAPI.fetchLatestData();
            const status = thingSpeakAPI.getConnectionStatus();

            this.updateConnectionStatus(status.isConnected);

            if (data) {
                this.updateDashboard(data);
            }
        } catch (error) {
            console.error('❌ Error updating dashboard:', error);
            this.updateConnectionStatus(false);
        }
    }

    /**
     * Stop automatic updates
     */
    stopAutoUpdate() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
            console.log('⏸️ Auto-update stopped');
        }
    }

    /**
     * Change chart time range
     * @param {string} range - Time range (1h, 6h, 24h)
     */
    async changeChartTimeRange(range) {
        const resultsMap = {
            '1h': 4,     // 4 data points for 1 hour (15min intervals)
            '6h': 24,    // 24 data points for 6 hours
            '24h': 96,   // 96 data points for 24 hours
        };

        const results = resultsMap[range] || 50;
        const historicalData = await thingSpeakAPI.fetchHistoricalData(results);

        if (historicalData && historicalData.length > 0) {
            this.chartData = historicalData;
            this.updateChart();
        }
    }
}

// Create global dashboard instance
const dashboard = new Dashboard();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Dashboard, dashboard };
}
