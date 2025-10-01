-- Complete PharbitChain Database Schema

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Drop existing types if they exist
DO $$ BEGIN
    DROP TYPE IF EXISTS user_role CASCADE;
    DROP TYPE IF EXISTS batch_status CASCADE;
    DROP TYPE IF EXISTS compliance_check_type CASCADE;
    DROP TYPE IF EXISTS file_type CASCADE;
EXCEPTION
    WHEN others THEN null;
END $$;

-- Custom types
CREATE TYPE user_role AS ENUM (
    'manufacturer',
    'distributor', 
    'pharmacy',
    'regulator',
    'auditor',
    'admin'
);

CREATE TYPE batch_status AS ENUM (
    'CREATED',
    'IN_TRANSIT',
    'RECEIVED',
    'IN_STORAGE',
    'DISPENSED',
    'RECALLED'
);

CREATE TYPE compliance_check_type AS ENUM (
    'FDA_APPROVAL',
    'QUALITY_CONTROL',
    'TEMPERATURE_CHECK',
    'PACKAGING_INSPECTION',
    'EXPIRY_VERIFICATION',
    'AUTHENTICITY_CHECK',
    'CUSTOM'
);

CREATE TYPE file_type AS ENUM (
    'CERTIFICATE',
    'INVOICE',
    'MANIFEST',
    'QUALITY_REPORT',
    'COMPLIANCE_DOCUMENT',
    'IMAGE',
    'OTHER'
);

-- Core Tables

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role user_role NOT NULL DEFAULT 'manufacturer',
    wallet_address VARCHAR(42) UNIQUE,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    company_name VARCHAR(255),
    phone VARCHAR(20),
    is_active BOOLEAN DEFAULT true,
    email_verified BOOLEAN DEFAULT false,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Batches table
CREATE TABLE batches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    batch_id VARCHAR(100) UNIQUE NOT NULL,
    drug_name VARCHAR(255) NOT NULL,
    manufacturer_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    current_owner_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    manufacture_date DATE NOT NULL,
    expiry_date DATE NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    remaining_quantity INTEGER NOT NULL CHECK (remaining_quantity >= 0),
    status batch_status NOT NULL DEFAULT 'CREATED',
    batch_number VARCHAR(100),
    description TEXT,
    drug_code VARCHAR(50),
    dosage_form VARCHAR(100),
    strength VARCHAR(100),
    lot_number VARCHAR(100),
    serial_number VARCHAR(100),
    temperature_range JSONB,
    storage_conditions TEXT,
    qr_code_data TEXT,
    qr_code_image_path VARCHAR(500),
    qr_code_hash VARCHAR(66),
    qr_code_generated_at TIMESTAMP WITH TIME ZONE,
    blockchain_tx_hash VARCHAR(66),
    blockchain_block_number BIGINT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Batch ownership history
CREATE TABLE batch_ownership_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    batch_id UUID NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
    from_owner_id UUID REFERENCES users(id) ON DELETE SET NULL,
    to_owner_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    transfer_reason TEXT,
    blockchain_tx_hash VARCHAR(66),
    blockchain_block_number BIGINT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Compliance logs
CREATE TABLE compliance_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    batch_id UUID NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
    check_type compliance_check_type NOT NULL,
    passed BOOLEAN NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    auditor_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    notes TEXT,
    document_hash VARCHAR(66),
    blockchain_tx_hash VARCHAR(66),
    blockchain_block_number BIGINT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Files Management
CREATE TABLE files (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    filename VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_type file_type NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    file_size BIGINT NOT NULL CHECK (file_size > 0),
    file_hash VARCHAR(66) NOT NULL,
    s3_bucket VARCHAR(100),
    s3_key VARCHAR(500),
    uploaded_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Batch files relationship
CREATE TABLE batch_files (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    batch_id UUID NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
    file_id UUID NOT NULL REFERENCES files(id) ON DELETE CASCADE,
    file_purpose VARCHAR(100),
    is_required BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(batch_id, file_id)
);

-- Compliance files relationship
CREATE TABLE compliance_files (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    compliance_log_id UUID NOT NULL REFERENCES compliance_logs(id) ON DELETE CASCADE,
    file_id UUID NOT NULL REFERENCES files(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(compliance_log_id, file_id)
);

-- Audit and System Tables
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50) NOT NULL,
    resource_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- System settings
CREATE TABLE system_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key VARCHAR(100) UNIQUE NOT NULL,
    value JSONB NOT NULL,
    description TEXT,
    is_public BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Recall Management
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

-- Verification System
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

-- Shipment Tracking
CREATE TABLE shipments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shipment_id VARCHAR(50) UNIQUE NOT NULL,
    batch_id UUID REFERENCES batches(id) ON DELETE CASCADE,
    origin_address TEXT NOT NULL,
    destination_address TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'CREATED' CHECK (status IN ('CREATED', 'IN_TRANSIT', 'DELIVERED', 'DELAYED', 'CANCELLED')),
    estimated_delivery TIMESTAMP WITH TIME ZONE,
    actual_delivery TIMESTAMP WITH TIME ZONE,
    carrier VARCHAR(100),
    tracking_number VARCHAR(100),
    temperature_requirements JSONB,
    created_by UUID REFERENCES users(id),
    metadata JSONB DEFAULT '{}'::jsonb
);

CREATE TABLE shipment_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shipment_id UUID REFERENCES shipments(id) ON DELETE CASCADE,
    event_type VARCHAR(50) NOT NULL CHECK (event_type IN (
        'created', 'dispatched', 'in_transit', 'temperature_check', 
        'location_update', 'delay', 'delivered', 'damaged', 'lost'
    )),
    event_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    location VARCHAR(255),
    temperature DECIMAL(5,2),
    humidity DECIMAL(5,2),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    metadata JSONB DEFAULT '{}'::jsonb
);

CREATE TABLE temperature_readings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shipment_id UUID REFERENCES shipments(id) ON DELETE CASCADE,
    temperature DECIMAL(5,2) NOT NULL,
    humidity DECIMAL(5,2),
    location VARCHAR(255),
    sensor_id VARCHAR(100),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_wallet_address ON users(wallet_address);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_company_name ON users(company_name);

CREATE INDEX idx_batches_batch_id ON batches(batch_id);
CREATE INDEX idx_batches_manufacturer_id ON batches(manufacturer_id);
CREATE INDEX idx_batches_current_owner_id ON batches(current_owner_id);
CREATE INDEX idx_batches_status ON batches(status);
CREATE INDEX idx_batches_drug_name ON batches(drug_name);
CREATE INDEX idx_batches_manufacture_date ON batches(manufacture_date);
CREATE INDEX idx_batches_expiry_date ON batches(expiry_date);
CREATE INDEX idx_batches_blockchain_tx_hash ON batches(blockchain_tx_hash);
CREATE INDEX idx_batches_qr_code_hash ON batches(qr_code_hash);

CREATE INDEX idx_batch_ownership_history_batch_id ON batch_ownership_history(batch_id);
CREATE INDEX idx_batch_ownership_history_from_owner_id ON batch_ownership_history(from_owner_id);
CREATE INDEX idx_batch_ownership_history_to_owner_id ON batch_ownership_history(to_owner_id);
CREATE INDEX idx_batch_ownership_history_created_at ON batch_ownership_history(created_at);

CREATE INDEX idx_compliance_logs_batch_id ON compliance_logs(batch_id);
CREATE INDEX idx_compliance_logs_auditor_id ON compliance_logs(auditor_id);
CREATE INDEX idx_compliance_logs_check_type ON compliance_logs(check_type);
CREATE INDEX idx_compliance_logs_passed ON compliance_logs(passed);
CREATE INDEX idx_compliance_logs_timestamp ON compliance_logs(timestamp);

CREATE INDEX idx_files_uploaded_by ON files(uploaded_by);
CREATE INDEX idx_files_file_type ON files(file_type);
CREATE INDEX idx_files_file_hash ON files(file_hash);
CREATE INDEX idx_files_created_at ON files(created_at);

CREATE INDEX idx_batch_files_batch_id ON batch_files(batch_id);
CREATE INDEX idx_batch_files_file_id ON batch_files(file_id);

CREATE INDEX idx_compliance_files_compliance_log_id ON compliance_files(compliance_log_id);
CREATE INDEX idx_compliance_files_file_id ON compliance_files(file_id);

CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_resource_type ON audit_logs(resource_type);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

CREATE INDEX idx_recalls_status ON recalls(status);
CREATE INDEX idx_recalls_initiated_at ON recalls(initiated_at);
CREATE INDEX idx_recall_batches_batch_id ON recall_batches(batch_id);
CREATE INDEX idx_recall_batches_recall_id ON recall_batches(recall_id);

CREATE INDEX idx_security_features_batch_id ON security_features(batch_id);
CREATE INDEX idx_security_features_qr_code_hash ON security_features(qr_code_hash);
CREATE INDEX idx_security_features_serial_number ON security_features(serial_number);

CREATE INDEX idx_counterfeit_reports_batch_id ON counterfeit_reports(batch_id);
CREATE INDEX idx_counterfeit_reports_status ON counterfeit_reports(status);
CREATE INDEX idx_counterfeit_reports_reported_at ON counterfeit_reports(reported_at);

CREATE INDEX idx_verification_logs_batch_id ON verification_logs(batch_id);
CREATE INDEX idx_verification_logs_verified_at ON verification_logs(verified_at);

CREATE INDEX idx_shipments_batch_id ON shipments(batch_id);
CREATE INDEX idx_shipments_status ON shipments(status);
CREATE INDEX idx_shipments_created_by ON shipments(created_by);

CREATE INDEX idx_shipment_events_shipment_id ON shipment_events(shipment_id);
CREATE INDEX idx_shipment_events_event_type ON shipment_events(event_type);
CREATE INDEX idx_shipment_events_timestamp ON shipment_events(timestamp);

CREATE INDEX idx_temperature_readings_shipment_id ON temperature_readings(shipment_id);
CREATE INDEX idx_temperature_readings_timestamp ON temperature_readings(timestamp);

-- Trigger function for updated_at columns
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_batches_updated_at
    BEFORE UPDATE ON batches
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_compliance_logs_updated_at
    BEFORE UPDATE ON compliance_logs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_system_settings_updated_at
    BEFORE UPDATE ON system_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_recalls_updated_at
    BEFORE UPDATE ON recalls
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_security_features_updated_at
    BEFORE UPDATE ON security_features
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE batch_ownership_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE files ENABLE ROW LEVEL SECURITY;
ALTER TABLE batch_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE recalls ENABLE ROW LEVEL SECURITY;
ALTER TABLE recall_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE counterfeit_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipment_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE temperature_readings ENABLE ROW LEVEL SECURITY;