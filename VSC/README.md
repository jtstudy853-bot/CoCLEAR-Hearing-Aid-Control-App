# CoCLEAR - Smart Hearing Aid Monitoring System

A production-quality web application for monitoring smart hearing aids using IoT data from ThingSpeak. Built with modern web technologies and designed with accessibility and medical-grade UX principles.

![CoCLEAR Dashboard](https://img.shields.io/badge/Status-Production%20Ready-brightgreen)
![License](https://img.shields.io/badge/License-MIT-blue)

## 🎯 Overview

CoCLEAR (Cochlear Clear) is an advanced hearing health monitoring system that provides:
- **Real-time noise level monitoring** with safety alerts
- **Intelligent risk assessment** based on exposure duration and intensity
- **Daily health reports** with personalized recommendations
- **Historical tracking** with interactive charts
- **Accessibility-first design** for hearing-impaired users

## 🌟 Features

### Core Functionality
✅ **Live Dashboard**
- Real-time noise level display (dB)
- Volume, battery, and device mode monitoring
- Auto-refresh every 15 seconds (ThingSpeak free tier compatible)
- Connection status indicator

✅ **Dangerous Noise Detection**
- Three-tier alert system (Caution, Danger, Emergency)
- Smart cooldown logic to prevent alert spam
- Visual, audio, and vibration notifications
- In-app alert modal with detailed information

✅ **Health Risk Scoring**
- iOS-style daily risk assessment (0-100 scale)
- Based on exposure duration and peak noise levels
- Visual circular progress indicator
- Real-time risk classification

✅ **Daily Reports**
- Automatic daily summary generation
- Average exposure, peak noise, and high-noise time tracking
- Personalized insights and recommendations
- Report history retention (30 days)

✅ **Alert History**
- Complete log of all noise alerts
- Severity classification and timestamps
- Searchable and filterable interface

✅ **Interactive Charts**
- Real-time noise exposure timeline
- Customizable time ranges (1h, 6h, 24h)
- Threshold indicators for danger zones
- Chart.js powered visualization

### Accessibility Features
♿ **WCAG Compliant Design**
- High contrast UI with clear typography
- Large tap targets (minimum 44x44px)
- ARIA labels and semantic HTML
- Screen reader friendly
- Keyboard navigation support
- Reduced motion preferences respected

## 🛠️ Technical Stack

- **Frontend**: HTML5, Modern CSS (Flexbox/Grid), Vanilla JavaScript (ES6+)
- **Charts**: Chart.js 4.4.0
- **Fonts**: DM Sans, Outfit (Google Fonts)
- **API**: ThingSpeak REST API
- **Storage**: localStorage / IndexedDB
- **Notifications**: Web Notifications API

## 📦 Installation

### Prerequisites
- Modern web browser (Chrome, Firefox, Safari, Edge)
- ThingSpeak account with configured channel
- Basic web server (or use Live Server, Python SimpleHTTPServer, etc.)

### Setup Steps

1. **Clone or Download the Project**
   ```bash
   # Download all files to a directory
   coclear/
   ├── index.html
   ├── styles.css
   ├── config.js
   ├── api.js
   ├── alerts.js
   ├── reports.js
   ├── dashboard.js
   ├── main.js
   └── README.md
   ```

2. **Configure ThingSpeak**
   
   Create a ThingSpeak channel with these fields:
   - **Field 1**: Noise Level (dB) - Numeric value 0-120
   - **Field 2**: Volume (%) - Numeric value 0-100
   - **Field 3**: Battery (%) - Numeric value 0-100
   - **Field 4**: Device Mode - Integer (1=Normal, 2=Quiet, 3=Loud, etc.)

   Note your:
   - Channel ID (e.g., 2738307)
   - Read API Key (e.g., VAYUR95VK2VGTYFD)

3. **Update Configuration**
   
   Option A: Edit `config.js` directly
   ```javascript
   thingspeak: {
       channelId: 'YOUR_CHANNEL_ID',
       readApiKey: 'YOUR_READ_API_KEY',
       // ... rest of config
   }
   ```

   Option B: Use Settings panel in the app
   - Launch the app
   - Navigate to Settings tab
   - Enter Channel ID and API Key
   - Click "Save Configuration"

4. **Launch the Application**
   
   **Option 1: Python Simple Server**
   ```bash
   # Python 3
   python -m http.server 8000
   
   # Then open: http://localhost:8000
   ```

   **Option 2: VS Code Live Server**
   - Install Live Server extension
   - Right-click `index.html`
   - Select "Open with Live Server"

   **Option 3: Node.js http-server**
   ```bash
   npx http-server -p 8000
   ```

5. **Enable Notifications (Optional)**
   - Click "Settings" tab
   - Click "Request Notification Permission"
   - Allow notifications when prompted

## 🎮 Usage

### Dashboard Tab
- View real-time noise levels and device metrics
- Monitor your daily risk score
- See noise exposure timeline
- Get immediate alerts for dangerous noise

### History Tab
- Review all past noise alerts
- Filter by severity level
- Clear history when needed

### Report Tab
- Generate daily health reports
- View detailed statistics and insights
- Get personalized recommendations

### Settings Tab
- Configure ThingSpeak credentials
- Adjust alert thresholds
- Enable/disable notifications
- Export health data
- Manage stored data

## ⚙️ Configuration

### Alert Thresholds (Customizable)
```javascript
thresholds: {
    safe: 70,        // Under 70 dB
    caution: 70,     // 70-85 dB
    danger: 85,      // 85-100 dB (NIOSH limit)
    emergency: 100,  // Over 100 dB
}
```

### Alert Cooldowns
```javascript
alertCooldown: {
    caution: 300000,    // 5 minutes
    danger: 180000,     // 3 minutes
    emergency: 60000,   // 1 minute
}
```

### Risk Scoring Weights
```javascript
riskScoring: {
    durationWeight: 0.6,  // 60% based on time
    peakWeight: 0.4,      // 40% based on peak noise
}
```

## 📊 Data Management

### Local Storage Keys
- `coclear_config` - App configuration
- `coclear_tracking` - Current day tracking data
- `coclear_alerts` - Alert history
- `coclear_reports` - Daily report history
- `coclear_last_alert` - Last triggered alert

### Export Data
Export your health data as JSON:
1. Go to Settings tab
2. Click "Export Health Data"
3. Download `coclear-health-data-YYYY-MM-DD.json`

### Clear Data
Remove all stored data:
1. Go to Settings tab
2. Click "Clear All Data"
3. Confirm the action

## 🔔 Notifications

### Browser Notifications
- Requires user permission
- Triggers on dangerous noise levels
- Shows noise level and safety message
- Optional daily reports at 8:00 PM

### In-App Alerts
- Modal popup for dangerous noise
- Severity-based icons (⚠️ 🔴 🚨)
- Detailed information and recommendations
- Vibration feedback for emergency alerts (mobile)

## 🧪 Testing & Debugging

### Debug Console
Access debug tools in browser console:
```javascript
// Trigger test alert
window.CoCLEAR.debug.triggerTestAlert('danger');

// Generate test report
window.CoCLEAR.debug.generateTestReport();

// Export data
window.CoCLEAR.debug.exportData();

// Clear all data
window.CoCLEAR.debug.clearAllData();
```

### Troubleshooting

**No data appearing?**
- Check ThingSpeak credentials in Settings
- Verify channel has recent data
- Check browser console for errors
- Ensure CORS is enabled on ThingSpeak

**Notifications not working?**
- Check browser notification permissions
- Enable notifications in Settings
- Try requesting permission again
- Some browsers block notifications in incognito mode

**Chart not displaying?**
- Ensure Chart.js is loaded (check console)
- Verify historical data is available
- Try refreshing the page

## 🚀 Future Enhancements

Potential features for expansion:
- [ ] Cloud sync across devices
- [ ] Doctor/audiologist sharing
- [ ] AI-powered noise prediction
- [ ] Multi-device support
- [ ] Geolocation-based noise mapping
- [ ] Integration with smart home devices
- [ ] Custom alert sounds
- [ ] Weekly/monthly reports
- [ ] Medication reminders
- [ ] Appointment scheduling

## 📱 Mobile Responsiveness

- Fully responsive design (320px - 1920px)
- Touch-friendly interface
- Mobile-first approach
- Optimized for smartphones and tablets
- Progressive Web App (PWA) ready

## ♿ Accessibility

CoCLEAR follows WCAG 2.1 Level AA guidelines:
- Semantic HTML structure
- ARIA labels and landmarks
- Keyboard navigation
- Focus indicators
- High contrast mode support
- Screen reader compatibility
- Adjustable text size
- No color-only indicators

## 🔒 Privacy & Security

- All data stored locally on device
- No cloud storage without user consent
- ThingSpeak credentials stored securely
- No tracking or analytics
- Export data anytime
- Full data deletion support

## 📄 License

This project is open source and available under the MIT License.

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

## 👨‍💻 Author

Built with ❤️ for better hearing health monitoring.

## 📞 Support

For issues or questions:
1. Check this README
2. Review browser console for errors
3. Verify ThingSpeak configuration
4. Check notification permissions

## 🙏 Acknowledgments

- ThingSpeak for IoT platform
- Chart.js for data visualization
- Google Fonts for typography
- Web Notifications API
- WCAG guidelines for accessibility

---

**Note**: This is a monitoring tool and not a medical device. Always consult with a hearing healthcare professional for medical advice.

## 🎓 Educational Use

This project is designed as a high-quality demonstration of:
- Modern web development practices
- IoT data integration
- Accessible design principles
- Health monitoring systems
- Real-time data visualization
- Progressive web app features

Perfect for:
- Computer Science projects
- IoT demonstrations
- Health tech portfolios
- Accessibility studies
- Web development education
