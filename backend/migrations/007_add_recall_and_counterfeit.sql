-- Create recall management tables
CREATE TABLE recalls (
    recall_id SERIAL PRIMARY KEY,
    initiator_address VARCHAR(42) NOT NULL,
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('Low', 'Medium', 'High', 'Critical')),
    reason TEXT NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('Initiated', 'InProgress', 'Completed', 'Cancelled')),
    initiated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    additional_info TEXT,
    tx_hash VARCHAR(66),
    block_number BIGINT
);

CREATE TABLE recall_batches (
    recall_id INTEGER REFERENCES recalls(recall_id),
    batch_id INTEGER REFERENCES batches(id),
    affected_units INTEGER,
    distribution_status VARCHAR(20),
    PRIMARY KEY (recall_id, batch_id)
);

CREATE TABLE recall_notifications (
    id SERIAL PRIMARY KEY,
    recall_id INTEGER REFERENCES recalls(recall_id),
    stakeholder_type VARCHAR(20) NOT NULL,
    stakeholder_id VARCHAR(100) NOT NULL,
    notification_type VARCHAR(20) NOT NULL,
    sent_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    delivery_status VARCHAR(20),
    read_at TIMESTAMP
);

-- Create anti-counterfeiting tables
CREATE TABLE security_features (
    id SERIAL PRIMARY KEY,
    batch_id INTEGER REFERENCES batches(id),
    feature_type VARCHAR(20) NOT NULL CHECK (feature_type IN ('QRCode', 'Hologram', 'RFIDTag', 'SerialNumber')),
    feature_hash VARCHAR(66) NOT NULL UNIQUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    valid_until TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    tx_hash VARCHAR(66),
    block_number BIGINT
);

CREATE TABLE counterfeit_reports (
    id SERIAL PRIMARY KEY,
    batch_id INTEGER REFERENCES batches(id),
    reporter_address VARCHAR(42) NOT NULL,
    evidence_type VARCHAR(20) NOT NULL,
    evidence_data TEXT NOT NULL,
    report_status VARCHAR(20) NOT NULL CHECK (report_status IN ('New', 'Investigating', 'Confirmed', 'Rejected')),
    verification_status VARCHAR(20) NOT NULL CHECK (verification_status IN ('Unknown', 'Authentic', 'Suspicious', 'Counterfeit')),
    reported_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP,
    resolution_notes TEXT,
    tx_hash VARCHAR(66),
    block_number BIGINT
);

CREATE TABLE visual_verification_log (
    id SERIAL PRIMARY KEY,
    batch_id INTEGER REFERENCES batches(id),
    verifier_address VARCHAR(42) NOT NULL,
    verification_type VARCHAR(20) NOT NULL,
    verification_result BOOLEAN NOT NULL,
    verification_data JSONB,
    verified_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    location_data JSONB,
    device_info JSONB
);

-- Add indexes for better query performance
CREATE INDEX idx_recalls_status ON recalls(status);
CREATE INDEX idx_recall_batches_batch_id ON recall_batches(batch_id);
CREATE INDEX idx_security_features_batch_hash ON security_features(batch_id, feature_hash);
CREATE INDEX idx_counterfeit_reports_batch_status ON counterfeit_reports(batch_id, report_status);
CREATE INDEX idx_visual_verification_batch ON visual_verification_log(batch_id);

-- Add timestamp columns for auditing
ALTER TABLE recalls ADD COLUMN created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE recalls ADD COLUMN updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE security_features ADD COLUMN updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE counterfeit_reports ADD COLUMN updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Create trigger function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at columns
CREATE TRIGGER update_recalls_updated_at
    BEFORE UPDATE ON recalls
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_security_features_updated_at
    BEFORE UPDATE ON security_features
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_counterfeit_reports_updated_at
    BEFORE UPDATE ON counterfeit_reports
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();