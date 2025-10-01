-- Pharmaceutical Blockchain System Database Schema

-- Recall Management Tables
CREATE TABLE recalls (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recall_id VARCHAR(50) UNIQUE NOT NULL,
    severity_level VARCHAR(20) NOT NULL CHECK (severity_level IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    reason TEXT NOT NULL,
    initiated_by VARCHAR(100) NOT NULL,
    initiated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'RESOLVED', 'CANCELLED')),
    resolution_notes TEXT,
    resolved_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE recall_batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recall_id UUID REFERENCES recalls(id) ON DELETE CASCADE,
    batch_id VARCHAR(50) NOT NULL,
    product_name VARCHAR(200) NOT NULL,
    lot_number VARCHAR(50) NOT NULL,
    expiry_date DATE NOT NULL,
    quantity_affected INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE distribution_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_id VARCHAR(50) NOT NULL,
    distributor_name VARCHAR(200) NOT NULL,
    distributor_address TEXT NOT NULL,
    quantity_shipped INTEGER NOT NULL,
    shipped_date DATE NOT NULL,
    received_date DATE,
    status VARCHAR(20) DEFAULT 'SHIPPED' CHECK (status IN ('SHIPPED', 'IN_TRANSIT', 'DELIVERED', 'RETURNED')),
    blockchain_tx_hash VARCHAR(66),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Anti-Counterfeiting Tables
CREATE TABLE security_features (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_id VARCHAR(50) UNIQUE NOT NULL,
    qr_code_hash VARCHAR(64) NOT NULL,
    hologram_id VARCHAR(100) NOT NULL,
    serial_number VARCHAR(50) UNIQUE NOT NULL,
    security_pattern TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE counterfeit_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_id VARCHAR(50) NOT NULL,
    reporter_name VARCHAR(200) NOT NULL,
    reporter_email VARCHAR(255) NOT NULL,
    report_type VARCHAR(50) NOT NULL CHECK (report_type IN ('SUSPICIOUS_PACKAGING', 'INVALID_QR', 'MISSING_HOLOGRAM', 'OTHER')),
    description TEXT NOT NULL,
    evidence_urls TEXT[],
    location VARCHAR(200),
    reported_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'INVESTIGATING', 'CONFIRMED', 'FALSE_ALARM')),
    investigator_notes TEXT,
    resolved_at TIMESTAMP
);

CREATE TABLE verification_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_id VARCHAR(50) NOT NULL,
    verification_type VARCHAR(50) NOT NULL CHECK (verification_type IN ('QR_SCAN', 'HOLOGRAM_CHECK', 'SERIAL_VERIFICATION')),
    verification_result BOOLEAN NOT NULL,
    verification_details JSONB,
    verified_by VARCHAR(100),
    verified_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ip_address INET,
    user_agent TEXT
);

-- Indexes for performance
CREATE INDEX idx_recalls_status ON recalls(status);
CREATE INDEX idx_recalls_initiated_at ON recalls(initiated_at);
CREATE INDEX idx_recall_batches_batch_id ON recall_batches(batch_id);
CREATE INDEX idx_distribution_tracking_batch_id ON distribution_tracking(batch_id);
CREATE INDEX idx_security_features_batch_id ON security_features(batch_id);
CREATE INDEX idx_counterfeit_reports_batch_id ON counterfeit_reports(batch_id);
CREATE INDEX idx_counterfeit_reports_status ON counterfeit_reports(status);
CREATE INDEX idx_verification_logs_batch_id ON verification_logs(batch_id);
CREATE INDEX idx_verification_logs_verified_at ON verification_logs(verified_at);

-- Triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_recalls_updated_at BEFORE UPDATE ON recalls
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_distribution_tracking_updated_at BEFORE UPDATE ON distribution_tracking
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_security_features_updated_at BEFORE UPDATE ON security_features
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();