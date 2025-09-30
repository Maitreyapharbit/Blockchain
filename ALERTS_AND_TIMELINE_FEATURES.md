# Enhanced Alerts and Timeline Features

This document describes the new alert monitoring and timeline visualization features added to the PharbitChain pharmaceutical supply chain management system.

## 🚨 Enhanced Alert System

### Features
- **Real-time Alert Monitoring**: Automatic detection of temperature excursions, delays, and anomalies
- **Multi-level Severity**: Low, Medium, High, and Critical alert levels
- **Sound Notifications**: Custom alert sounds based on severity
- **Browser Notifications**: Native browser notifications with click-to-navigate
- **Toast Notifications**: In-app toast notifications with severity-based styling
- **Alert Resolution**: One-click alert resolution with audit trail

### Alert Types
1. **Temperature Excursions**: When temperature readings fall outside acceptable ranges
2. **Delivery Delays**: When shipments exceed expected delivery times
3. **Humidity Excursions**: When humidity readings fall outside acceptable ranges
4. **Location Anomalies**: When shipments remain at the same location for suspicious periods
5. **Damage Detection**: When damage is reported during transit
6. **General Anomalies**: Other unexpected events during shipment

### Components
- `EnhancedAlerts.js`: Main alerts component with filtering and management
- `AlertDashboard.js`: Comprehensive alert monitoring dashboard
- `alertMonitoringService.js`: Backend service for automatic alert detection
- `notificationService.js`: Frontend service for notifications and sounds

## 📊 Product Journey Timeline

### Features
- **Complete Journey Visualization**: From manufacturing to end-point delivery
- **Phase-based Organization**: Events grouped by journey phases
- **Interactive Timeline**: Expandable/collapsible event details
- **Real-time Updates**: Live updates as new events occur
- **Filtering and Search**: Filter by event type and search through events
- **Export Capabilities**: Export timeline data for reporting

### Journey Phases
1. **Manufacturing**: Product creation and initial quality control
2. **Packaging**: Product packaging and labeling
3. **Dispatch**: Product leaves manufacturing facility
4. **In Transit**: Product journey to destination
5. **Delivery**: Product reaches final destination

### Components
- `ProductJourneyTimeline.js`: Main timeline visualization component
- `ShipmentTimeline.js`: Enhanced timeline with filtering capabilities

## 🔧 Technical Implementation

### Backend Services
- **Alert Monitoring Service**: Continuous monitoring of all active shipments
- **Database Triggers**: Automatic alert creation on temperature excursions and delays
- **REST API**: Complete CRUD operations for alerts
- **Real-time Subscriptions**: WebSocket connections for live updates

### Frontend Services
- **Notification Service**: Handles all notification types and sound alerts
- **Alert Service**: Manages alert data and API interactions
- **Realtime Service**: Manages WebSocket connections for live updates

### Database Schema
- `shipment_alerts`: Stores all alert information
- `temperature_readings`: Detailed temperature monitoring data
- `shipment_events`: Complete event log for timeline visualization

## 🚀 Usage

### Accessing Alerts
1. Navigate to `/alerts` for the comprehensive alert dashboard
2. Use the shipment dashboard's "Enhanced Alerts" tab for shipment-specific alerts
3. Alerts are automatically created when anomalies are detected

### Timeline View
1. Navigate to any shipment detail page
2. The timeline shows the complete product journey
3. Use filters to focus on specific event types
4. Click on events to expand detailed information

### Alert Management
1. **Resolve Alerts**: Click the "Resolve" button on any alert
2. **Filter Alerts**: Use the filter dropdown to show specific alert types
3. **Sound Control**: Toggle sound notifications on/off
4. **Browser Notifications**: Enable/disable browser notifications

## 📈 Monitoring and Analytics

### Alert Statistics
- Total alerts count
- Unresolved alerts count
- Critical alerts count
- Temperature-related alerts count
- Alert trends over time

### Real-time Monitoring
- Automatic monitoring every minute
- Configurable alert thresholds
- Escalation based on severity
- Audit trail for all alert actions

## 🔔 Notification Features

### Sound Alerts
- Different sounds for different severity levels
- Volume control based on severity
- Toggle on/off functionality
- Web Audio API implementation

### Visual Notifications
- Toast notifications with severity-based styling
- Browser notifications with click-to-navigate
- Tab title updates for critical alerts
- Persistent alert storage

### Alert Thresholds
- **Temperature**: 2°C (medium), 3°C (high), 5°C (critical)
- **Delay**: 12 hours (medium), 24 hours (high), 48 hours (critical)
- **Humidity**: 10% (medium), 15% (high), 20% (critical)

## 🛠️ Configuration

### Environment Variables
The system uses the existing environment variables from your `.env` file:
- `SUPABASE_URL` and `SUPABASE_ANON_KEY` for database access
- `REACT_APP_API_URL` for API communication
- `REACT_APP_WS_URL` for WebSocket connections

### Customization
- Alert thresholds can be adjusted via the API
- Sound preferences are stored in localStorage
- Notification preferences are managed per user
- Alert severity levels can be customized

## 📱 Mobile Responsiveness

All components are fully responsive and work on:
- Desktop computers
- Tablets
- Mobile phones
- Different screen orientations

## 🔒 Security Features

- Row Level Security (RLS) policies for data access
- User-based alert filtering
- Secure API endpoints
- Input validation and sanitization

## 🚀 Future Enhancements

- Machine learning for anomaly detection
- Predictive alerting based on historical data
- Integration with external monitoring systems
- Advanced analytics and reporting
- Mobile app notifications
- Email/SMS alert integration

## 📞 Support

For technical support or feature requests, please refer to the main project documentation or contact the development team.

---

**Note**: This feature set is designed to work seamlessly with the existing PharbitChain infrastructure and requires no additional external dependencies beyond what's already configured in your environment.