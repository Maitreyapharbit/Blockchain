# Pharmaceutical Blockchain Frontend

A comprehensive React frontend application for pharmaceutical blockchain systems, featuring recall management and anti-counterfeiting capabilities.

## Features

### Recall Management
- **Recall Dashboard**: Overview of all recalls with statistics and filtering
- **Recall Initiation**: Multi-step form for creating new recalls
- **Affected Batch List**: Management of batches affected by recalls
- **Distribution Tracker**: Real-time tracking of distribution nodes with map view
- **Notification Center**: Centralized notification management
- **Recall Status Cards**: Detailed recall information with progress tracking

### Anti-Counterfeit System
- **Counterfeit Dashboard**: Overview of counterfeit reports and suspicious activities
- **Security Feature Verifier**: Multi-step verification process for product authenticity
- **Reporting Form**: Comprehensive form for reporting counterfeit products
- **Batch Authenticity**: Detailed batch verification with blockchain integration
- **Suspicious Activity List**: Management of detected suspicious activities
- **Verification History**: Complete history of all verification attempts

## Technology Stack

- **React 18** with TypeScript
- **Material-UI (MUI)** for UI components
- **Redux Toolkit** for state management
- **React Router** for navigation
- **Framer Motion** for animations
- **Leaflet** for maps
- **React Query** for data fetching
- **Jest** and **React Testing Library** for testing

## Project Structure

```
frontend/
├── src/
│   ├── components/
│   │   ├── RecallManagement/
│   │   │   ├── RecallDashboard.tsx
│   │   │   ├── RecallInitiation.tsx
│   │   │   ├── AffectedBatchList.tsx
│   │   │   ├── DistributionTracker.tsx
│   │   │   ├── NotificationCenter.tsx
│   │   │   └── RecallStatusCard.tsx
│   │   └── AntiCounterfeit/
│   │       ├── CounterfeitDashboard.tsx
│   │       ├── SecurityFeatureVerifier.tsx
│   │       ├── ReportingForm.tsx
│   │       ├── BatchAuthenticity.tsx
│   │       ├── SuspiciousActivityList.tsx
│   │       └── VerificationHistory.tsx
│   ├── store/
│   │   ├── recallSlice.ts
│   │   ├── counterfeitSlice.ts
│   │   ├── notificationSlice.ts
│   │   ├── index.ts
│   │   └── hooks.ts
│   ├── utils/
│   │   ├── recallService.ts
│   │   ├── counterfeitService.ts
│   │   ├── blockchainValidation.ts
│   │   └── notificationService.ts
│   ├── types/
│   │   └── index.ts
│   ├── hooks/
│   └── __tests__/
│       ├── components/
│       └── utils/
├── package.json
└── README.md
```

## Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env
```

3. Configure the following environment variables:
```env
REACT_APP_API_BASE_URL=http://localhost:3001/api
REACT_APP_BLOCKCHAIN_API_URL=http://localhost:8545
REACT_APP_NOTIFICATION_URL=http://localhost:3001
```

## Development

Start the development server:
```bash
npm start
```

The application will be available at `http://localhost:3000`.

## Testing

Run tests:
```bash
npm test
```

Run tests with coverage:
```bash
npm test -- --coverage
```

## Building for Production

Build the application:
```bash
npm run build
```

## Key Features

### Real-time Updates
- WebSocket integration for real-time notifications
- Live status updates for recalls and verifications
- Real-time distribution tracking

### Blockchain Integration
- QR code scanning and verification
- Hologram verification
- Serial number validation
- Blockchain transaction verification
- Tamper evidence checking

### Advanced UI/UX
- Responsive design for all screen sizes
- Dark/light theme support
- Smooth animations and transitions
- Accessibility features (WCAG 2.1 compliant)
- Interactive maps for distribution tracking

### Data Management
- Redux for centralized state management
- Optimistic updates for better UX
- Caching with React Query
- Offline support with service workers

### Security
- JWT token authentication
- Role-based access control
- Input validation and sanitization
- Secure file upload handling

## Component Architecture

### Recall Management Components

#### RecallDashboard
- Displays recall statistics and metrics
- Filterable and searchable recall list
- Real-time updates
- Quick action buttons

#### RecallInitiation
- Multi-step form wizard
- Batch selection and management
- Action planning and assignment
- Validation and error handling

#### AffectedBatchList
- Batch management interface
- Status updates and actions
- Search and filtering
- Bulk operations

#### DistributionTracker
- Interactive map view
- Node status management
- Real-time tracking
- Compliance monitoring

#### NotificationCenter
- Centralized notification hub
- Real-time updates
- Action management
- Settings and preferences

#### RecallStatusCard
- Detailed recall information
- Progress tracking
- Action buttons
- Status indicators

### Anti-Counterfeit Components

#### CounterfeitDashboard
- Report overview and statistics
- Suspicious activity monitoring
- Verification metrics
- Quick actions

#### SecurityFeatureVerifier
- Multi-step verification process
- QR code scanning
- Hologram verification
- Blockchain validation

#### ReportingForm
- Comprehensive reporting interface
- Evidence upload
- Location tracking
- Contact information

#### BatchAuthenticity
- Batch verification interface
- Security feature display
- Verification history
- Real-time status

#### SuspiciousActivityList
- Activity monitoring
- Status management
- Filtering and search
- Action handling

#### VerificationHistory
- Complete verification log
- Statistics and analytics
- Export capabilities
- Detailed reporting

## State Management

The application uses Redux Toolkit for state management with the following slices:

### Recall Slice
- Manages recall data and operations
- Handles batch management
- Distribution node tracking
- Action management

### Counterfeit Slice
- Manages counterfeit reports
- Suspicious activity tracking
- Verification results
- Evidence management

### Notification Slice
- Real-time notifications
- User preferences
- Connection status
- Local storage management

## API Integration

### Recall Service
- CRUD operations for recalls
- Batch management
- Distribution tracking
- Action management

### Counterfeit Service
- Report management
- Verification processes
- Evidence handling
- Activity monitoring

### Blockchain Validation
- Transaction verification
- Ownership chain validation
- Security feature verification
- Real-time status updates

### Notification Service
- Real-time notifications
- WebSocket integration
- Local storage management
- User preferences

## Testing

The application includes comprehensive tests:

### Unit Tests
- Component testing with React Testing Library
- Service testing with Jest
- Utility function testing
- Redux slice testing

### Integration Tests
- API integration testing
- User flow testing
- Error handling testing

### E2E Tests
- Complete user journey testing
- Cross-browser compatibility
- Performance testing

## Performance Optimization

- Code splitting with React.lazy
- Memoization with React.memo
- Virtual scrolling for large lists
- Image optimization
- Bundle size optimization

## Accessibility

- WCAG 2.1 AA compliance
- Keyboard navigation
- Screen reader support
- High contrast mode
- Focus management

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions, please contact the development team or create an issue in the repository.