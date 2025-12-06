# Drug Pricing Transparency & Equipment Calibration Features

## Overview

This document describes the implementation of two major features added to the PharbitChain blockchain system:

1. **Drug Pricing Transparency Platform** - Track drug prices through the entire supply chain with transparency reports
2. **Equipment Calibration Ledger** - Digital blockchain-based equipment calibration tracking with FDA compliance support

## Architecture

### Database Schema

All database tables are defined in `/backend/pricing_calibration_schema.sql` and include:

#### Drug Pricing Tables:
- `pricing_chain_participants` - Supply chain participant registry
- `drug_pricing_ledger` - Core pricing records with 21 tracking columns
- `insurance_price_scenarios` - Insurance plan pricing models
- `cash_price_comparison` - Pharmacy cash price data

#### Equipment Calibration Tables:
- `manufacturing_equipment` - Equipment registry with QR codes
- `equipment_calibration_ledger` - Calibration audit trail
- `calibration_schedule` - Automated scheduling
- `calibration_analytics` - Trends and predictive maintenance
- `calibration_audit_reports` - FDA compliance reports

### Smart Contracts

#### DrugPricingLedger.sol
Location: `/contracts/contracts/PricingCalibration.sol`

**Key Functions:**
- `recordManufacturerPrice()` - Initial drug price recording
- `addPriceCheckpoint()` - Track price at each supply chain stage
- `identifyHiddenMarkups()` - Flag suspicious PBM spreads (>200% markup)
- `calculateTransparencyScore()` - Measure data transparency (0-100)
- `getPatientImpact()` - Calculate final markup percentage

**Events:**
- `PriceRecorded` - Initial drug price recorded
- `PriceCheckpointAdded` - Price checkpoint added
- `HiddenMarkupsIdentified` - Suspicious markups detected

#### EquipmentCalibrationLedger.sol
Location: `/contracts/contracts/PricingCalibration.sol`

**Key Functions:**
- `registerEquipment()` - Register new equipment with calibration frequency
- `recordCalibration()` - Log equipment calibration
- `isCalibrationOverdue()` - Check calibration status
- `daysUntilNextCalibration()` - Get days until next due
- `calculateFailureRisk()` - Predictive maintenance scoring (0-100)
- `getCalibrationHistory()` - Full audit trail

**Events:**
- `EquipmentRegistered` - New equipment registered
- `CalibrationRecorded` - Calibration logged
- `CalibrationOverdue` - Equipment past due
- `CalibrationFailure` - Failed calibration detected

### Backend API Routes

#### Pricing Routes (`/backend/routes/pricing.js`)

**POST /api/pricing/pricing-ledger**
```json
{
  "batch_id": "BATCH-001",
  "drug_name": "Aspirin 500mg",
  "manufacturer_price": 2.50,
  "is_public": true,
  "blockchain_record": true
}
```

**POST /api/pricing/pricing-ledger/:batchId/checkpoint**
```json
{
  "participant_type": "wholesaler",
  "price": 5.75,
  "notes": "Wholesale markup applied",
  "blockchain_record": true
}
```

**GET /api/pricing/pricing-ledger/:batchId**
Returns full pricing chain with:
- All checkpoints from manufacturer to pharmacy
- Markup calculations
- Transparency metrics
- Hidden markup flags

**POST /api/pricing/cash-price-comparison**
```json
{
  "batch_id": "BATCH-001",
  "pharmacy_id": "CVS-12345",
  "cash_price": 12.99,
  "insurance_covered_price": 8.50
}
```

**GET /api/pricing/cash-prices/:batchId**
Returns pharmacy price comparison with:
- Average price across pharmacies
- Price variance percentage
- Potential patient savings
- Lowest/highest prices

**POST /api/pricing/pricing-reports/transparency**
Generates comprehensive transparency report with:
- Full pricing chain
- Cash price comparisons
- Hidden markups identified
- Regulatory compliance metrics

#### Calibration Routes (`/backend/routes/calibration.js`)

**POST /api/calibration/equipment**
```json
{
  "equipment_name": "pH Meter - Lab 1",
  "equipment_type": "Analytical",
  "calibration_frequency_days": 30,
  "blockchain_record": true
}
```
Returns QR code for equipment.

**GET /api/calibration/equipment**
Lists all registered equipment with status.

**POST /api/calibration/calibration-record**
```json
{
  "equipment_id": "EQ-12345",
  "actual_reading": "7.02",
  "expected_reading": "7.00",
  "deviation_basis_points": 28,
  "certificate_hash": "cert-hash-123",
  "passed": true,
  "correction_action": "Equipment stable, no adjustment needed",
  "blockchain_record": true
}
```

**GET /api/calibration/calibration-history/:equipmentId**
Returns calibration history with limit parameter.

**GET /api/calibration/calibration-schedule**
Returns upcoming calibrations with filters:
- `status=overdue` - Past due calibrations
- `status=due_soon` - Due within X days
- `days_until=7` - Due within specified days

**GET /api/calibration/calibration-analytics/:equipmentId**
Returns predictive maintenance analysis:
- Risk score (0-100)
- Failure rate percentage
- Average deviation
- Recommendations for maintenance

**POST /api/calibration/audit-report**
Generates FDA audit report:
- Equipment details
- Calibration history in period
- Pass/fail statistics
- Compliance status
- Failure details for non-compliance

### Frontend Components

#### PricingComparisonDashboard.js
Location: `/frontend/src/components/PricingComparisonDashboard.js`

**Features:**
- Supply chain price journey visualization (line chart)
- Pharmacy price comparison (bar chart)
- Hidden markup detection and flagging
- Savings calculator
- Real-time price statistics
- Transparency report publishing

**Props:**
- `batchId` - Batch ID to display
- `drugName` - Drug name (optional)

#### EquipmentCalibrationTracker.js
Location: `/frontend/src/components/EquipmentCalibrationTracker.js`

**Features:**
- Equipment compliance dashboard
- Real-time calibration alerts
- Calibration history visualization
- Predictive maintenance scoring
- Risk analysis per equipment
- Overdue tracking
- FDA report generation interface

## Integration Steps

### 1. Apply Database Schema

```bash
# Using Supabase SQL editor or psql
psql postgresql://user:password@host:port/database < /backend/pricing_calibration_schema.sql
```

### 2. Deploy Smart Contracts

```bash
cd /contracts
npx hardhat run scripts/deploy-pricing-calibration.js --network localhost
```

This saves contract addresses to `/contracts/deployments/pricing-calibration.json`

### 3. Update Backend

```bash
cd /backend
npm install qrcode
npm start
```

### 4. Update Frontend

Add components to your main application:

```jsx
import PricingComparisonDashboard from './components/PricingComparisonDashboard';
import EquipmentCalibrationTracker from './components/EquipmentCalibrationTracker';

// In your route/component:
<PricingComparisonDashboard batchId={selectedBatchId} drugName={drugName} />
<EquipmentCalibrationTracker />
```

## Environment Configuration

Add to `.env` or `docker.env`:

```bash
# Smart Contract Addresses
PRICING_LEDGER_ADDRESS=0x...
CALIBRATION_LEDGER_ADDRESS=0x...

# Blockchain Configuration
BLOCKCHAIN_RPC_URL=http://localhost:8545
DEPLOYER_PRIVATE_KEY=0x...
```

## Data Flow

### Drug Pricing Workflow

1. Manufacturer records initial drug price on blockchain
2. Each supply chain participant (wholesaler, pharmacy, PBM) adds their price checkpoint
3. System calculates markups and identifies hidden margins (PBM spreads)
4. Pharmacy cash prices are collected from multiple sources
5. Transparency report generated comparing all prices
6. Report is published and accessible to patients/insurers

### Equipment Calibration Workflow

1. Equipment registered with QR code generated
2. QR code attached to physical equipment (via label/engraving)
3. Technician scans QR code to access equipment record
4. Calibration performed and results recorded (blockchain + database)
5. System calculates deviation and pass/fail status
6. Predictive analytics updated based on trend
7. Automatic alerts triggered if overdue or at risk
8. FDA audit reports generated on-demand

## Security & Compliance

### Data Encryption
- All sensitive fields encrypted at rest (RLS policies enforce row-level security)
- API requires Bearer token authentication
- Development mode allows anonymous access for testing

### Blockchain Immutability
- All critical events recorded on blockchain
- Transaction hashes stored in database for audit trail
- Full calibration history cannot be modified after recording

### FDA Compliance
- Equipment calibration records include:
  - Technician identification
  - Exact timestamp
  - Deviation measurements
  - Pass/fail determination
  - Corrective actions taken
- Audit reports generated with regulatory-required fields
- Compliance status automatically calculated

## Error Handling

All API endpoints return standardized error responses:

```json
{
  "success": false,
  "error": "Descriptive error message"
}
```

## Testing

### Test Pricing Flow

```bash
# 1. Create initial price record
curl -X POST http://localhost:3001/api/pricing/pricing-ledger \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "batch_id": "TEST-001",
    "drug_name": "Aspirin",
    "manufacturer_price": 2.50,
    "is_public": true,
    "blockchain_record": true
  }'

# 2. Add price checkpoint
curl -X POST http://localhost:3001/api/pricing/pricing-ledger/TEST-001/checkpoint \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "participant_type": "wholesaler",
    "price": 5.75,
    "notes": "Wholesale markup",
    "blockchain_record": true
  }'

# 3. Get pricing chain
curl -X GET http://localhost:3001/api/pricing/pricing-ledger/TEST-001 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Test Calibration Flow

```bash
# 1. Register equipment
curl -X POST http://localhost:3001/api/calibration/equipment \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "equipment_name": "Analyzer 1",
    "equipment_type": "Lab Equipment",
    "calibration_frequency_days": 30,
    "blockchain_record": true
  }'

# 2. Record calibration
curl -X POST http://localhost:3001/api/calibration/calibration-record \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "equipment_id": "EQ-123456",
    "actual_reading": "7.02",
    "expected_reading": "7.00",
    "passed": true,
    "blockchain_record": true
  }'

# 3. Get analytics
curl -X GET http://localhost:3001/api/calibration/calibration-analytics/EQ-123456 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Performance Optimization

- Database indexes on frequently queried fields
- Pagination support for large result sets
- Caching for analytics calculations
- Batch processing for reports

## Future Enhancements

1. **QR Code Scanning** - Mobile app for equipment QR scanning
2. **Integration with ERP Systems** - Auto-import equipment from inventory
3. **Regulatory Filing** - Auto-generate FDA submissions
4. **Machine Learning** - Predictive maintenance model improvements
5. **Patient Notification** - SMS/Email alerts for price changes
6. **Insurance Integration** - Real-time formulary price updates

## Support & Documentation

- API Documentation: `/api/docs` (in development)
- Database Schema: `/backend/pricing_calibration_schema.sql`
- Smart Contracts: `/contracts/contracts/PricingCalibration.sol`
- Component Examples: `/frontend/src/components/`

## License

[Your License Here]
