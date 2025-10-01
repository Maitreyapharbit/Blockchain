-- Add QR code fields to batches table
-- Migration to support unique QR codes for each batch

-- Add QR code related columns to batches table
ALTER TABLE batches 
ADD COLUMN qr_code_data TEXT,
ADD COLUMN qr_code_image_path VARCHAR(500),
ADD COLUMN qr_code_hash VARCHAR(66),
ADD COLUMN qr_code_generated_at TIMESTAMP WITH TIME ZONE;

-- Create index for QR code hash for fast lookups
CREATE INDEX idx_batches_qr_code_hash ON batches(qr_code_hash);

-- Add comment explaining the QR code fields
COMMENT ON COLUMN batches.qr_code_data IS 'QR code data/content (usually a URL or unique identifier)';
COMMENT ON COLUMN batches.qr_code_image_path IS 'Path to the generated QR code image file';
COMMENT ON COLUMN batches.qr_code_hash IS 'Hash of the QR code data for verification';
COMMENT ON COLUMN batches.qr_code_generated_at IS 'Timestamp when QR code was generated';