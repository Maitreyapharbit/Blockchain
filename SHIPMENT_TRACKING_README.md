# Shipment Tracking System with Supabase Realtime

A comprehensive pharmaceutical shipment tracking system built with React, Supabase, and real-time monitoring capabilities. This system provides temperature excursion alerts, delay detection, and anomaly monitoring for pharmaceutical supply chains.

## Features

### 🚚 Real-time Shipment Tracking
- Live shipment status updates
- Temperature and humidity monitoring
- Location tracking and updates
- Delivery progress visualization

### 🌡️ Temperature Monitoring
- Real-time temperature readings
- Automatic excursion detection
- Configurable temperature ranges
- Historical temperature data

### 🚨 Alert System
- Temperature excursion alerts
- Delivery delay notifications
- Anomaly detection
- Browser notifications and sound alerts
- Alert severity levels (low, medium, high, critical)

### 📊 Timeline View
- Interactive product journey timeline
- Event filtering and search
- Detailed event data visualization
- Collapsible event details

### 🔄 Real-time Updates
- Supabase Realtime subscriptions
- Live data synchronization
- Optimized for free tier limits
- Automatic reconnection handling

## Architecture

### Frontend (React)
- **Components**: ShipmentDashboard, ShipmentTimeline, ShipmentTrackingApp
- **Services**: realtimeService, alertService
- **Context**: SupabaseContext for state management
- **Styling**: Styled-components with responsive design

### Backend (Node.js/Express)
- **API Routes**: `/api/shipments/*` for shipment management
- **Database**: Supabase PostgreSQL with RLS policies
- **Realtime**: Supabase Realtime for live updates
- **Authentication**: Supabase Auth integration

### Database Schema
- **shipments**: Main shipment records
- **shipment_events**: Journey timeline events
- **shipment_alerts**: Alert notifications
- **temperature_readings**: Temperature monitoring data

## Setup Instructions

### 1. Supabase Setup

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Get your project URL and API keys from the project settings
3. Run the database migration:

```sql
-- Run the migration file
\i backend/migrations/005_shipment_tracking.sql
```

### 2. Environment Configuration

#### Frontend (.env)
```env
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-anon-key
REACT_APP_API_URL=http://localhost:3000
```

#### Backend (.env)
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
PORT=3000
NODE_ENV=development
```

### 3. Install Dependencies

```bash
# Frontend
cd frontend
npm install

# Backend
cd backend
npm install
```

### 4. Start the Application

```bash
# Start backend (Terminal 1)
cd backend
npm run dev

# Start frontend (Terminal 2)
cd frontend
npm start
```

## Usage

### Creating a Shipment

1. Navigate to `/shipments` in the frontend
2. Click "New Shipment" button
3. Fill in shipment details:
   - Tracking number
   - Origin and destination locations
   - Expected delivery date
   - Temperature ranges (optional)
   - Batch ID (if applicable)

### Monitoring Shipments

1. View all shipments in the main dashboard
2. Click on a shipment to view detailed tracking
3. Monitor real-time temperature readings
4. View timeline of events and updates

### Managing Alerts

1. Alerts appear automatically when issues are detected
2. View active alerts in the sidebar
3. Click on alerts to navigate to relevant shipments
4. Resolve alerts when issues are addressed

## API Endpoints

### Shipments
- `POST /api/shipments` - Create new shipment
- `GET /api/shipments` - List user's shipments
- `GET /api/shipments/:id` - Get shipment details
- `PATCH /api/shipments/:id/status` - Update shipment status

### Temperature Monitoring
- `POST /api/shipments/:id/temperature` - Record temperature reading
- `POST /api/shipments/:id/location` - Update location

### Alerts
- `GET /api/shipments/:id/alerts` - Get shipment alerts
- `PATCH /api/shipments/alerts/:alertId/resolve` - Resolve alert

## Free Tier Optimizations

### Database Optimizations
- Efficient indexing for common queries
- Row Level Security (RLS) for data isolation
- Optimized queries with proper filtering
- Limited data retention policies

### Realtime Optimizations
- Maximum 5 concurrent subscriptions
- Event batching to reduce API calls
- Connection timeout handling
- Automatic subscription cleanup

### Frontend Optimizations
- Lazy loading of components
- Efficient state management
- Local storage for offline alerts
- Optimized re-renders

## Monitoring and Alerts

### Temperature Excursions
- Automatic detection when temperature exceeds ranges
- Configurable severity levels based on deviation
- Real-time notifications and alerts

### Delivery Delays
- Automatic detection of overdue deliveries
- Escalating alert severity based on delay duration
- Integration with shipment status updates

### Anomaly Detection
- Pattern recognition for unusual events
- Location-based anomaly detection
- Custom alert rules and thresholds

## Security Features

- Row Level Security (RLS) policies
- User-based data isolation
- Secure API authentication
- Input validation and sanitization

## Performance Considerations

- Optimized database queries
- Efficient realtime subscriptions
- Client-side caching
- Responsive UI design

## Troubleshooting

### Common Issues

1. **Realtime not working**: Check Supabase project settings and API keys
2. **Alerts not showing**: Verify RLS policies and user authentication
3. **Temperature readings not recorded**: Check API endpoint and data validation
4. **Slow performance**: Review subscription limits and query optimization

### Debug Mode

Enable debug logging by setting:
```env
NODE_ENV=development
DEBUG=supabase:*
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For support and questions:
- Create an issue in the repository
- Check the documentation
- Review the troubleshooting section

---

**Note**: This system is optimized for Supabase's free tier. For production use with high volume, consider upgrading to a paid plan or implementing additional optimizations.