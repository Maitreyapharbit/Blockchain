# QR Code Implementation for Pharmaceutical Batches

## Overview
This implementation adds unique QR code generation and verification capabilities to the pharmaceutical batch management system. Each batch will have a unique QR code that can be scanned to verify its authenticity and retrieve batch information.

## Features Implemented

### 1. Database Schema Updates
- Added QR code fields to the `batches` table:
  - `qr_code_data`: Stores the QR code data/content
  - `qr_code_image_path`: Path to the generated QR code image file
  - `qr_code_hash`: Hash of the QR code data for verification
  - `qr_code_generated_at`: Timestamp when QR code was generated

### 2. Backend Services
- **QR Code Service** (`backend/services/qrCodeService.js`):
  - Generates unique QR codes for each batch
  - Creates QR code images and data URLs
  - Validates QR code data
  - Manages QR code file storage

### 3. API Endpoints
- **Batch Creation** (`POST /api/batches`):
  - Automatically generates QR code when creating a new batch
  - Returns QR code data in the response
- **Batch Retrieval** (`GET /api/batches/{batchId}`):
  - Includes QR code information in batch details
- **QR Code Endpoint** (`GET /api/batches/{batchId}/qr-code`):
  - Dedicated endpoint to get QR code for a specific batch

### 4. Frontend Components
- **BatchCreator**: Displays QR code after batch creation
- **BatchVerifier**: Shows QR code when verifying batches
- **QRCodeScanner**: New component for scanning QR codes

## Manual Database Migration Required

Since the automated migration couldn't be executed, you need to manually add the QR code columns to your Supabase database:

### Option 1: Supabase Dashboard
1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Run the following SQL commands:

```sql
-- Add QR code columns to batches table
ALTER TABLE batches 
ADD COLUMN qr_code_data TEXT,
ADD COLUMN qr_code_image_path VARCHAR(500),
ADD COLUMN qr_code_hash VARCHAR(66),
ADD COLUMN qr_code_generated_at TIMESTAMP WITH TIME ZONE;

-- Create index for QR code hash
CREATE INDEX idx_batches_qr_code_hash ON batches(qr_code_hash);

-- Add comments
COMMENT ON COLUMN batches.qr_code_data IS 'QR code data/content (usually a URL or unique identifier)';
COMMENT ON COLUMN batches.qr_code_image_path IS 'Path to the generated QR code image file';
COMMENT ON COLUMN batches.qr_code_hash IS 'Hash of the QR code data for verification';
COMMENT ON COLUMN batches.qr_code_generated_at IS 'Timestamp when QR code was generated';
```

### Option 2: Using psql (if available)
```bash
psql "postgresql://postgres:IndianBrotherhood@01@db.nyclipuoeyefmnmkyyfk.supabase.co:5432/postgres" -c "
ALTER TABLE batches 
ADD COLUMN qr_code_data TEXT,
ADD COLUMN qr_code_image_path VARCHAR(500),
ADD COLUMN qr_code_hash VARCHAR(66),
ADD COLUMN qr_code_generated_at TIMESTAMP WITH TIME ZONE;

CREATE INDEX idx_batches_qr_code_hash ON batches(qr_code_hash);
"
```

## Installation Steps

### 1. Install Dependencies
```bash
cd backend
npm install qrcode
```

### 2. Environment Variables
Make sure your `.env` file includes:
```env
BASE_URL=https://your-domain.com  # For QR code URLs
```

### 3. Create Upload Directory
```bash
mkdir -p backend/uploads/qr-codes
```

## How It Works

### Batch Creation Flow
1. User creates a new batch through the frontend
2. Backend creates batch on blockchain
3. QR code service generates unique QR code with:
   - Batch ID
   - Drug name
   - Manufacturer
   - Timestamp
   - Verification URL
4. QR code data is stored in database
5. Frontend displays QR code to user

### Batch Verification Flow
1. User scans QR code or enters batch ID
2. System retrieves batch information
3. QR code is displayed with batch details
4. User can download QR code image

### QR Code Structure
Each QR code contains:
- **Data URL**: Direct link to verification page
- **Batch URL**: `https://your-domain.com/verify/{batchId}`
- **Hash**: SHA-256 hash for verification
- **Image**: Base64 encoded PNG image

## API Usage Examples

### Create Batch with QR Code
```javascript
const response = await fetch('/api/batches', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + token
  },
  body: JSON.stringify({
    drugName: 'Aspirin 100mg',
    quantity: 1000,
    manufacturer: '0x...',
    // ... other batch data
  })
});

const result = await response.json();
console.log('QR Code:', result.qrCode);
```

### Get Batch QR Code
```javascript
const response = await fetch(`/api/batches/${batchId}/qr-code`, {
  headers: {
    'Authorization': 'Bearer ' + token
  }
});

const result = await response.json();
console.log('QR Code Data:', result.qrCode);
```

## Frontend Components

### BatchCreator
- Automatically displays QR code after successful batch creation
- Shows QR code image, URL, and hash
- Provides download functionality

### BatchVerifier
- Displays QR code when batch is found
- Shows verification status
- Includes QR code information in batch details

### QRCodeScanner
- Camera-based QR code scanning
- Manual batch ID input option
- Real-time verification results

## Security Features

1. **Unique QR Codes**: Each batch gets a unique QR code with timestamp
2. **Hash Verification**: QR codes include SHA-256 hash for integrity
3. **URL Validation**: QR codes contain verification URLs that can be validated
4. **Secure Storage**: QR code data is stored securely in the database

## Testing

### Test QR Code Generation
1. Create a new batch through the frontend
2. Verify QR code is generated and displayed
3. Check that QR code data is stored in database
4. Test QR code scanning functionality

### Test Batch Verification
1. Scan a generated QR code
2. Verify batch information is retrieved correctly
3. Test manual batch ID input
4. Verify QR code display in verification results

## Troubleshooting

### Common Issues
1. **QR Code Not Generated**: Check if database columns exist
2. **Image Not Displaying**: Verify base64 encoding and image path
3. **Scanner Not Working**: Check camera permissions and browser compatibility
4. **Database Errors**: Ensure all required columns are added

### Debug Steps
1. Check browser console for errors
2. Verify API responses include QR code data
3. Test database queries directly
4. Check file permissions for QR code storage

## Future Enhancements

1. **QR Code Scanning Library**: Integrate a proper QR code scanning library like `jsQR`
2. **Mobile App**: Create mobile app for easier QR code scanning
3. **Batch History**: Track QR code scans and verification history
4. **Custom QR Codes**: Allow custom QR code designs and branding
5. **Analytics**: Track QR code usage and verification statistics

## Files Modified/Created

### Backend
- `backend/migrations/006_add_qr_codes.sql` - Database migration
- `backend/services/qrCodeService.js` - QR code generation service
- `backend/routes/batches.js` - Updated batch routes
- `backend/package.json` - Added qrcode dependency

### Frontend
- `frontend/src/components/BatchCreator.js` - Added QR code display
- `frontend/src/components/BatchVerifier.js` - Added QR code display
- `frontend/src/components/QRCodeScanner.js` - New QR code scanner
- `frontend/src/App.js` - Added QR code scanner to main app

This implementation provides a complete QR code system for pharmaceutical batch verification, ensuring each batch has a unique, verifiable identifier that can be easily scanned and validated.