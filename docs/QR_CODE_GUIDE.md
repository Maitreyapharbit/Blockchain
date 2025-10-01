# QR Code Implementation Guide

## Overview
The QR code feature generates unique QR codes for each batch after creation and mining. These QR codes contain comprehensive batch information that can be easily scanned and verified.

## Features
- Automatic QR code generation after batch mining
- High error correction level for reliable scanning
- Contains complete batch information including:
  - Batch ID
  - Name
  - Manufacturer
  - Manufacturing Date
  - Expiry Date
  - Quantity
  - Location
  - Transaction Hash
  - Blockchain Status
  - Blockchain ID

## Technical Implementation

### Backend
The QR code generation is implemented in the following components:

1. **QR Code Service** (`/backend/services/qrCodeService.js`)
   - Handles QR code generation
   - Supports both batch-specific and custom QR codes
   - Uses high error correction level for reliability

2. **Batch Routes** (`/backend/routes/batches.js`)
   - Automatically generates QR code after batch mining
   - Provides endpoint to get QR code for specific batch: `GET /api/batches/:id/qr`

### Frontend
The QR code display is implemented using:

1. **BatchQRCode Component** (`/frontend/src/components/BatchQRCode.js`)
   - Displays QR code image
   - Handles responsive sizing
   - Provides visual feedback for scanning

## Usage

### API Endpoints

1. Get QR Code for Batch:
```
GET /api/batches/:id/qr
```
Response:
```json
{
  "qrCode": "data:image/png;base64,..."
}
```

2. Create Batch (includes QR code in response):
```
POST /api/batches
```
Response includes QR code in the batch data.

### Frontend Integration

Import and use the BatchQRCode component:
```jsx
import BatchQRCode from './components/BatchQRCode';

// In your component:
<BatchQRCode qrCode={batch.qrCode} batchId={batch.id} />
```

## Security Considerations
- QR codes are generated server-side to ensure data integrity
- All batch data is validated before QR code generation
- QR code endpoints require authentication

## Best Practices
1. Always verify the QR code scans correctly after generation
2. Store QR codes securely and control access to sensitive batch information
3. Use the provided BatchQRCode component for consistent display
4. Update QR codes when batch information changes

## Troubleshooting
1. If QR code is not displaying:
   - Check if batch is properly mined
   - Verify authentication status
   - Check network response for QR code data

2. If QR code cannot be scanned:
   - Ensure adequate lighting and scan distance
   - Check if QR code image is complete and not truncated
   - Verify error correction level in QR code service