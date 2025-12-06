# Complete API Reference

## Base URL
```
http://localhost:3001/api
```

## Authentication
All endpoints require Bearer token in Authorization header:
```
Authorization: Bearer your_jwt_token_here
```

For development/testing (anonymous user):
```
# Omit Authorization header or use development token
```

---

## 🏷️ PRICING ENDPOINTS

### 1. Record Initial Drug Price
**POST** `/pricing/pricing-ledger`

**Description**: Record the initial manufacturer price for a drug

**Request Body**:
```json
{
  "batch_id": "BATCH-001",
  "drug_name": "Aspirin 500mg",
  "manufacturer_price": 2.50,
  "is_public": true,
  "blockchain_record": true
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": 1,
    "batch_id": "BATCH-001",
    "drug_name": "Aspirin 500mg",
    "manufacturer_price": 2.50,
    "is_public": true,
    "created_by": "user_id",
    "blockchain_tx_hash": "0x123abc...",
    "created_at": "2024-01-15T10:30:00Z"
  },
  "blockchain_tx": "0x123abc..."
}
```

---

### 2. Add Supply Chain Price Checkpoint
**POST** `/pricing/pricing-ledger/:batchId/checkpoint`

**Description**: Record price at each supply chain stage

**Parameters**:
- `batchId` (path): Batch ID to add checkpoint to

**Request Body**:
```json
{
  "participant_type": "wholesaler",
  "price": 5.75,
  "notes": "Standard wholesale markup applied",
  "blockchain_record": true
}
```

**Participant Types**:
- `manufacturer` - Initial recording
- `wholesaler` - Bulk distributor
- `pharmacy` - Retail pharmacy
- `pbm` - Pharmacy Benefit Manager
- `insurance` - Insurance company

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": 2,
    "batch_id": "BATCH-001",
    "participant_type": "wholesaler",
    "participant_price": 5.75,
    "notes": "Standard wholesale markup applied",
    "recorded_by": "user_id",
    "blockchain_tx_hash": "0x456def...",
    "created_at": "2024-01-15T10:31:00Z"
  },
  "blockchain_tx": "0x456def..."
}
```

---

### 3. Get Full Pricing Chain
**GET** `/pricing/pricing-ledger/:batchId`

**Description**: Retrieve complete pricing chain from manufacturer to pharmacy

**Parameters**:
- `batchId` (path): Batch ID to retrieve

**Response** (200 OK):
```json
{
  "success": true,
  "chain": [
    {
      "id": 1,
      "batch_id": "BATCH-001",
      "drug_name": "Aspirin 500mg",
      "manufacturer_price": 2.50,
      "is_public": true,
      "created_at": "2024-01-15T10:30:00Z"
    },
    {
      "id": 2,
      "participant_type": "wholesaler",
      "participant_price": 5.75,
      "notes": "Standard wholesale markup",
      "created_at": "2024-01-15T10:31:00Z"
    }
  ],
  "summary": {
    "drug_name": "Aspirin 500mg",
    "initial_price": 2.50,
    "final_price": 5.75,
    "total_markup": 3.25,
    "markup_percent": "130.00",
    "checkpoints": 1
  }
}
```

---

### 4. Add Pharmacy Cash Price
**POST** `/pricing/cash-price-comparison`

**Description**: Record cash price at a pharmacy for comparison

**Request Body**:
```json
{
  "batch_id": "BATCH-001",
  "pharmacy_id": "CVS-12345",
  "cash_price": 12.99,
  "insurance_covered_price": 8.50
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": 1,
    "batch_id": "BATCH-001",
    "pharmacy_id": "CVS-12345",
    "cash_price": 12.99,
    "insurance_covered_price": 8.50,
    "recorded_by": "user_id",
    "created_at": "2024-01-15T10:32:00Z"
  }
}
```

---

### 5. Compare Pharmacy Prices
**GET** `/pricing/cash-prices/:batchId`

**Description**: Get price comparison across all pharmacies for a drug

**Parameters**:
- `batchId` (path): Batch ID to compare prices

**Response** (200 OK):
```json
{
  "success": true,
  "prices": [
    {
      "id": 1,
      "batch_id": "BATCH-001",
      "pharmacy_id": "CVS-12345",
      "cash_price": 12.99,
      "insurance_covered_price": 8.50
    },
    {
      "id": 2,
      "batch_id": "BATCH-001",
      "pharmacy_id": "Walgreens-789",
      "cash_price": 11.49,
      "insurance_covered_price": 7.99
    }
  ],
  "statistics": {
    "average_price": "12.24",
    "lowest_price": 11.49,
    "highest_price": 12.99,
    "price_variance_percent": "13.04",
    "pharmacy_count": 2,
    "potential_savings": 1.50
  }
}
```

---

### 6. Generate Pricing Transparency Report
**POST** `/pricing/pricing-reports/transparency`

**Description**: Generate comprehensive pricing transparency report

**Request Body**:
```json
{
  "batch_id": "BATCH-001"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "report": {
    "batch_id": "BATCH-001",
    "pricing_chain": [...],
    "cash_price_comparison": [...],
    "hidden_markups": [
      {
        "from": "pbm",
        "to": "pharmacy",
        "markup_percent": "250.00",
        "notes": "Suspicious markup detected"
      }
    ],
    "transparency_metrics": {
      "chain_checkpoints": 4,
      "pharmacy_price_variance": "Calculated",
      "suspicious_markups_detected": 1,
      "report_generated_at": "2024-01-15T10:33:00Z"
    }
  }
}
```

---

## 🔧 CALIBRATION ENDPOINTS

### 1. Register New Equipment
**POST** `/calibration/equipment`

**Description**: Register manufacturing equipment for calibration tracking

**Request Body**:
```json
{
  "equipment_name": "pH Analyzer Model XL1000",
  "equipment_type": "Analytical Instrument",
  "calibration_frequency_days": 30,
  "blockchain_record": true
}
```

**Equipment Types**:
- `Analytical Instrument`
- `Measuring Device`
- `Lab Equipment`
- `Production Equipment`
- `QA Equipment`

**Response** (201 Created):
```json
{
  "success": true,
  "data": {
    "equipment_id": "EQ-1705320600123-abc123",
    "equipment_name": "pH Analyzer Model XL1000",
    "equipment_type": "Analytical Instrument",
    "calibration_frequency_days": 30,
    "qr_code": "data:image/png;base64,iVBORw0KG...",
    "next_calibration_date": "2024-02-14T10:30:00Z",
    "registered_by": "user_id",
    "blockchain_tx_hash": "0x789ghi...",
    "created_at": "2024-01-15T10:30:00Z"
  },
  "qr_code": "data:image/png;base64,iVBORw0KG...",
  "blockchain_tx": "0x789ghi..."
}
```

---

### 2. List All Equipment
**GET** `/calibration/equipment`

**Description**: Get list of all registered equipment

**Query Parameters**:
- `equipment_type` (optional): Filter by type
- `status` (optional): Filter by status

**Response** (200 OK):
```json
{
  "success": true,
  "data": [
    {
      "equipment_id": "EQ-123",
      "equipment_name": "pH Analyzer",
      "equipment_type": "Analytical",
      "calibration_frequency_days": 30,
      "next_calibration_date": "2024-02-14T10:30:00Z",
      "last_calibration_date": "2024-01-15T10:30:00Z"
    }
  ],
  "count": 1
}
```

---

### 3. Get Equipment Details
**GET** `/calibration/equipment/:equipmentId`

**Description**: Get detailed information about specific equipment

**Parameters**:
- `equipmentId` (path): Equipment ID to retrieve

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "equipment_id": "EQ-123",
    "equipment_name": "pH Analyzer",
    "equipment_type": "Analytical",
    "calibration_frequency_days": 30,
    "qr_code": "data:image/png;base64,iVBORw0KG...",
    "next_calibration_date": "2024-02-14T10:30:00Z",
    "last_calibration_date": "2024-01-15T10:30:00Z",
    "registered_by": "user_id",
    "created_at": "2024-01-15T10:30:00Z"
  }
}
```

---

### 4. Record Calibration
**POST** `/calibration/calibration-record`

**Description**: Log equipment calibration with results

**Request Body**:
```json
{
  "equipment_id": "EQ-123",
  "actual_reading": "7.02",
  "expected_reading": "7.00",
  "deviation_basis_points": 28,
  "certificate_hash": "cert-hash-abc123",
  "passed": true,
  "correction_action": "Equipment stable, no adjustment needed",
  "blockchain_record": true
}
```

**Parameters Explained**:
- `deviation_basis_points`: Deviation in basis points (e.g., 50 = 0.5%)
- `certificate_hash`: Hash of calibration certificate
- `passed`: Boolean - true if within tolerance
- `correction_action`: Action taken if failed

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": 1,
    "equipment_id": "EQ-123",
    "actual_reading": "7.02",
    "expected_reading": "7.00",
    "deviation_percent": "0.29",
    "certificate_hash": "cert-hash-abc123",
    "passed": true,
    "recorded_by": "user_id",
    "blockchain_tx_hash": "0x101112...",
    "created_at": "2024-01-15T10:31:00Z"
  },
  "blockchain_tx": "0x101112..."
}
```

---

### 5. Get Calibration History
**GET** `/calibration/calibration-history/:equipmentId`

**Description**: Retrieve calibration history for equipment

**Parameters**:
- `equipmentId` (path): Equipment ID
- `limit` (query, optional): Limit results (default: all)

**Response** (200 OK):
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "equipment_id": "EQ-123",
      "actual_reading": "7.02",
      "expected_reading": "7.00",
      "deviation_percent": "0.29",
      "passed": true,
      "recorded_by": "user_id",
      "created_at": "2024-01-15T10:31:00Z"
    }
  ],
  "count": 1
}
```

---

### 6. Get Calibration Schedule
**GET** `/calibration/calibration-schedule`

**Description**: Get list of upcoming/overdue calibrations

**Query Parameters**:
- `status` (optional): `overdue` or `due_soon`
- `days_until` (optional): Check due within X days (default: 7)

**Response** (200 OK):
```json
{
  "success": true,
  "data": [
    {
      "equipment_id": "EQ-123",
      "equipment_name": "pH Analyzer",
      "next_calibration_date": "2024-01-20T10:30:00Z",
      "calibration_frequency_days": 30
    }
  ],
  "count": 1
}
```

---

### 7. Schedule Calibration
**POST** `/calibration/calibration-schedule`

**Description**: Schedule future calibration

**Request Body**:
```json
{
  "equipment_id": "EQ-123",
  "scheduled_date": "2024-02-14T14:00:00Z",
  "technician_id": "TECH-001",
  "notes": "Annual maintenance inspection"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": 1,
    "equipment_id": "EQ-123",
    "scheduled_date": "2024-02-14T14:00:00Z",
    "technician_id": "TECH-001",
    "status": "scheduled",
    "scheduled_by": "user_id",
    "created_at": "2024-01-15T10:32:00Z"
  }
}
```

---

### 8. Get Calibration Analytics
**GET** `/calibration/calibration-analytics/:equipmentId`

**Description**: Get predictive maintenance analysis

**Parameters**:
- `equipmentId` (path): Equipment ID

**Response** (200 OK):
```json
{
  "success": true,
  "analytics": {
    "total_calibrations": 12,
    "failure_rate_percent": "8.33",
    "average_deviation_percent": "0.45",
    "failure_count": 1,
    "pass_count": 11,
    "predictive_risk_score": "25.00",
    "recommendations": [
      "Equipment performing normally",
      "Continue regular schedule"
    ]
  },
  "trends": {
    "deviation_history": [0.32, 0.28, 0.41, 0.35, ...],
    "pass_history": [1, 1, 1, 0, 1, ...]
  }
}
```

**Risk Score Interpretation**:
- 0-30: Low risk (normal operation)
- 30-60: Medium risk (monitor closely)
- 60-100: High risk (urgent maintenance)

---

### 9. Generate FDA Audit Report
**POST** `/calibration/audit-report`

**Description**: Generate regulatory-compliant calibration audit report

**Request Body**:
```json
{
  "equipment_id": "EQ-123",
  "from_date": "2024-01-01T00:00:00Z",
  "to_date": "2024-01-31T23:59:59Z"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "report": {
    "report_id": "FDA-EQ-123-1705331700",
    "equipment_id": "EQ-123",
    "equipment_name": "pH Analyzer",
    "equipment_type": "Analytical",
    "report_date": "2024-01-15T10:35:00Z",
    "period_start": "2024-01-01T00:00:00Z",
    "period_end": "2024-01-31T23:59:59Z",
    "total_calibrations": 2,
    "passed_calibrations": 2,
    "failed_calibrations": 0,
    "compliance_status": "COMPLIANT",
    "failure_details": [],
    "generated_by": "user_id",
    "signature_required": true
  }
}
```

**Compliance Status Values**:
- `COMPLIANT` - All calibrations passed within period
- `NON-COMPLIANT` - Failures or missed calibrations
- `REQUIRES_ACTION` - Pending or incomplete calibrations

---

### 10. List Audit Reports
**GET** `/calibration/audit-reports`

**Description**: Get list of generated audit reports

**Query Parameters**:
- `equipment_id` (optional): Filter by equipment
- `compliance_status` (optional): Filter by status

**Response** (200 OK):
```json
{
  "success": true,
  "data": [
    {
      "report_id": "FDA-EQ-123-1705331700",
      "equipment_id": "EQ-123",
      "equipment_name": "pH Analyzer",
      "report_date": "2024-01-15T10:35:00Z",
      "compliance_status": "COMPLIANT",
      "total_calibrations": 2,
      "passed_calibrations": 2
    }
  ],
  "count": 1
}
```

---

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "errors": [
    {
      "msg": "Price must be greater than 0",
      "param": "manufacturer_price"
    }
  ]
}
```

### 404 Not Found
```json
{
  "success": false,
  "error": "Equipment not found"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "error": "Database connection failed"
}
```

---

## Status Codes Reference

| Code | Meaning |
|------|---------|
| 200 | Success - Request completed |
| 201 | Created - New resource created |
| 400 | Bad Request - Invalid parameters |
| 401 | Unauthorized - Missing/invalid token |
| 404 | Not Found - Resource doesn't exist |
| 500 | Server Error - Internal error |

---

## Example Usage Scenarios

### Scenario 1: Track Drug Price Through Supply Chain
```bash
# 1. Record initial price
curl -X POST http://localhost:3001/api/pricing/pricing-ledger \
  -H "Content-Type: application/json" \
  -d '{
    "batch_id": "BATCH-001",
    "drug_name": "Aspirin",
    "manufacturer_price": 2.50,
    "blockchain_record": true
  }'

# 2. Add wholesaler checkpoint
curl -X POST http://localhost:3001/api/pricing/pricing-ledger/BATCH-001/checkpoint \
  -H "Content-Type: application/json" \
  -d '{
    "participant_type": "wholesaler",
    "price": 5.75,
    "blockchain_record": true
  }'

# 3. View full chain
curl -X GET http://localhost:3001/api/pricing/pricing-ledger/BATCH-001
```

### Scenario 2: Track Equipment Calibration
```bash
# 1. Register equipment
curl -X POST http://localhost:3001/api/calibration/equipment \
  -H "Content-Type: application/json" \
  -d '{
    "equipment_name": "pH Meter",
    "equipment_type": "Analytical",
    "calibration_frequency_days": 30,
    "blockchain_record": true
  }'
# Returns: equipment_id = "EQ-123"

# 2. Record calibration
curl -X POST http://localhost:3001/api/calibration/calibration-record \
  -H "Content-Type: application/json" \
  -d '{
    "equipment_id": "EQ-123",
    "actual_reading": "7.02",
    "expected_reading": "7.00",
    "passed": true,
    "blockchain_record": true
  }'

# 3. Get analytics
curl -X GET http://localhost:3001/api/calibration/calibration-analytics/EQ-123

# 4. Generate FDA report
curl -X POST http://localhost:3001/api/calibration/audit-report \
  -H "Content-Type: application/json" \
  -d '{
    "equipment_id": "EQ-123",
    "from_date": "2024-01-01T00:00:00Z",
    "to_date": "2024-01-31T23:59:59Z"
  }'
```

---

## Rate Limits

- General API: 100 requests per 15 minutes per IP
- Auth endpoints: 20 requests per 15 minutes per IP
- Report generation: 10 requests per hour per user

---

## Pagination

List endpoints support pagination via query params:
```
?page=1&limit=20
```

---

This API reference is complete and production-ready! 🚀
