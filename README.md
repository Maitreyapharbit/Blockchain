# Pharmaceutical Blockchain System

A comprehensive Recall Management and Anti-Counterfeiting system for pharmaceutical blockchain applications built with React, TypeScript, Node.js, Express, Solidity, and PostgreSQL.

## Features

### 🔄 Recall Management System
- **Quick Recall Initiation**: Create recalls with severity levels (LOW, MEDIUM, HIGH, CRITICAL)
- **Batch Search & Selection**: Search and select multiple batches for recall
- **Distribution Chain Tracking**: Track affected distribution channels
- **Real-time Notifications**: Notify stakeholders automatically
- **Status Management**: Track recall status from initiation to resolution

### 🛡️ Anti-Counterfeiting System
- **Visual Security Features**: QR code and hologram verification
- **Authenticity Checking**: Multi-layer verification system
- **Suspicious Activity Reporting**: Report and investigate counterfeit activities
- **Real-time Verification**: Instant verification status updates
- **Security Feature Generation**: Create unique security identifiers

### 🔗 Blockchain Integration
- **Smart Contracts**: Solidity contracts for immutable record keeping
- **Event Emission**: Real-time blockchain events for recalls and suspicious activities
- **Transparent Audit Trail**: Complete transaction history
- **Decentralized Verification**: Distributed verification system

## Tech Stack

### Frontend
- **React 18** with TypeScript
- **Material-UI** for modern UI components
- **Web3.js** for blockchain integration
- **QR Code** generation and scanning
- **Data Grid** for tabular data display

### Backend
- **Node.js** with Express
- **TypeScript** for type safety
- **PostgreSQL** database
- **Sequelize** ORM
- **Winston** logging
- **Joi** validation

### Blockchain
- **Solidity** smart contracts
- **Hardhat** development framework
- **Web3.js** for blockchain interaction
- **OpenZeppelin** security libraries

### Testing
- **Jest** for unit testing
- **Hardhat** for smart contract testing
- **Comprehensive test coverage**

## Project Structure

```
pharma-blockchain-system/
├── frontend/                 # React frontend application
│   ├── src/
│   │   ├── components/      # React components
│   │   │   ├── RecallManagement/
│   │   │   └── AntiCounterfeit/
│   │   ├── services/        # API services
│   │   ├── types/           # TypeScript type definitions
│   │   └── App.tsx
│   └── package.json
├── backend/                  # Node.js backend API
│   ├── src/
│   │   ├── services/        # Business logic services
│   │   ├── routes/          # API routes
│   │   ├── database/        # Database schema and models
│   │   ├── utils/           # Utility functions
│   │   └── index.ts
│   └── package.json
├── contracts/                # Solidity smart contracts
│   ├── contracts/           # Smart contract source code
│   ├── test/                # Smart contract tests
│   ├── scripts/             # Deployment scripts
│   └── hardhat.config.js
└── README.md
```

## Quick Start

### Prerequisites
- Node.js 16+ and npm
- PostgreSQL 12+
- Git

### 1. Clone the Repository
```bash
git clone <repository-url>
cd pharma-blockchain-system
```

### 2. Install Dependencies
```bash
# Install root dependencies
npm install

# Install frontend dependencies
cd frontend && npm install && cd ..

# Install backend dependencies
cd backend && npm install && cd ..

# Install contract dependencies
cd contracts && npm install && cd ..
```

### 3. Database Setup
```bash
# Create PostgreSQL database
createdb pharma_blockchain

# Run database schema
psql -d pharma_blockchain -f backend/src/database/schema.sql
```

### 4. Environment Configuration
```bash
# Copy environment files
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# Edit the environment files with your configuration
```

### 5. Deploy Smart Contracts
```bash
cd contracts

# Start local blockchain (in one terminal)
npx hardhat node

# Deploy contracts (in another terminal)
npx hardhat run scripts/deploy.js --network localhost
```

### 6. Start the Application
```bash
# Start backend (in one terminal)
cd backend && npm run dev

# Start frontend (in another terminal)
cd frontend && npm start
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- Health Check: http://localhost:3001/health

## API Documentation

### Recall Management Endpoints

#### Initiate Recall
```http
POST /api/recalls/initiate
Content-Type: application/json

{
  "batchIds": ["BATCH-001", "BATCH-002"],
  "severity": "HIGH",
  "reason": "Contaminated batch detected",
  "initiatedBy": "manufacturer@pharma.com"
}
```

#### Get Recall Status
```http
GET /api/recalls/{recallId}/status
```

#### Update Recall Status
```http
PATCH /api/recalls/{recallId}/status
Content-Type: application/json

{
  "status": "RESOLVED",
  "resolutionNotes": "All affected batches recovered"
}
```

### Anti-Counterfeiting Endpoints

#### Verify Authenticity
```http
POST /api/counterfeit/verify
Content-Type: application/json

{
  "batchId": "BATCH-001",
  "verificationType": "QR_SCAN",
  "providedData": "qr_code_data"
}
```

#### Report Suspicious Activity
```http
POST /api/counterfeit/report
Content-Type: application/json

{
  "batchId": "BATCH-001",
  "reporterName": "John Doe",
  "reporterEmail": "john@example.com",
  "reportType": "SUSPICIOUS_PACKAGING",
  "description": "Packaging appears tampered with",
  "evidenceUrls": ["https://example.com/evidence.jpg"],
  "location": "New York, NY"
}
```

## Smart Contracts

### RecallManagement Contract
- `initiateRecall()`: Create new recall
- `addBatchToRecall()`: Add batch to existing recall
- `updateRecallStatus()`: Update recall status
- `recordDistribution()`: Record distribution information
- `getRecall()`: Get recall details
- `isBatchInRecall()`: Check if batch is recalled

### AntiCounterfeitVerification Contract
- `createSecurityFeature()`: Generate security features
- `verifyAuthenticity()`: Verify product authenticity
- `reportSuspiciousActivity()`: Report suspicious activities
- `updateReportStatus()`: Update report investigation status
- `getSecurityFeature()`: Get security feature details
- `getFlaggedBatches()`: Get list of flagged batches

## Database Schema

### Core Tables
- **recalls**: Recall information and metadata
- **recall_batches**: Batches affected by recalls
- **distribution_tracking**: Distribution chain tracking
- **security_features**: Product security features
- **counterfeit_reports**: Suspicious activity reports
- **verification_logs**: Authentication verification history

## Testing

### Run All Tests
```bash
# Run frontend tests
cd frontend && npm test

# Run backend tests
cd backend && npm test

# Run smart contract tests
cd contracts && npm test
```

### Test Coverage
- Unit tests for all services
- Integration tests for API endpoints
- Smart contract functionality tests
- End-to-end user flow tests

## Security Features

### Smart Contract Security
- Access control with role-based permissions
- Reentrancy protection
- Input validation and sanitization
- Event emission for transparency

### API Security
- Input validation with Joi
- SQL injection prevention with Sequelize
- CORS configuration
- Helmet security headers
- Rate limiting (recommended for production)

### Frontend Security
- Input sanitization
- XSS protection
- Secure API communication
- Environment variable protection

## Deployment

### Production Deployment
1. Set up production database
2. Deploy smart contracts to mainnet/testnet
3. Configure environment variables
4. Set up reverse proxy (nginx)
5. Enable HTTPS
6. Set up monitoring and logging

### Docker Deployment
```bash
# Build and run with Docker Compose
docker-compose up -d
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation

## Roadmap

### Phase 1 (Current)
- ✅ Basic recall management
- ✅ Anti-counterfeiting verification
- ✅ Smart contract implementation
- ✅ Web interface

### Phase 2 (Planned)
- 🔄 Mobile application
- 🔄 Advanced analytics dashboard
- 🔄 Integration with existing pharma systems
- 🔄 Machine learning for counterfeit detection

### Phase 3 (Future)
- 🔄 IoT device integration
- 🔄 Supply chain optimization
- 🔄 Regulatory compliance automation
- 🔄 Multi-blockchain support