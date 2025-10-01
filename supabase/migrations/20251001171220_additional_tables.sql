-- Additional types needed for new features
CREATE TYPE recall_severity AS ENUM (
    'LOW',
    'MEDIUM',
    'HIGH',
    'CRITICAL'
);

CREATE TYPE recall_status AS ENUM (
    'ACTIVE',
    'RESOLVED',
    'CANCELLED'
);

CREATE TYPE verification_type AS ENUM (
    'QR_SCAN',
    'HOLOGRAM_CHECK',
    'SERIAL_VERIFICATION'
);

CREATE TYPE report_status AS ENUM (
    'PENDING',
    'INVESTIGATING',
    'CONFIRMED',
    'FALSE_ALARM'
);

-- Recalls Management
CREATE TABLE recalls (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    recall_id VARCHAR(50) UNIQUE NOT NULL,
    batch_id UUID NOT NULL REFERENCES batches(id) ON DELETE RESTRICT,
    severity_level recall_severity NOT NULL,
    reason TEXT NOT NULL,
    initiated_by UUID NOT NULL REFERENCES users(id),
    initiated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status recall_status NOT NULL DEFAULT 'ACTIVE',
    affected_units INTEGER NOT NULL CHECK (affected_units > 0),
    resolution_notes TEXT,
    resolved_at TIMESTAMP WITH TIME ZONE,
    blockchain_tx_hash VARCHAR(66),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Anti-counterfeiting Features
CREATE TABLE security_features (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    batch_id UUID NOT NULL REFERENCES batches(id) ON DELETE RESTRICT,
    qr_code_hash VARCHAR(64) NOT NULL,
    hologram_id VARCHAR(100) NOT NULL,
    serial_number VARCHAR(50) UNIQUE NOT NULL,
    security_pattern TEXT NOT NULL,
    blockchain_tx_hash VARCHAR(66),
    valid_until TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Verification History
CREATE TABLE verification_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    batch_id UUID NOT NULL REFERENCES batches(id) ON DELETE RESTRICT,
    verification_type verification_type NOT NULL,
    verification_result BOOLEAN NOT NULL,
    verification_data JSONB NOT NULL DEFAULT '{}',
    verified_by UUID REFERENCES users(id),
    location JSONB,
    ip_address INET,
    user_agent TEXT,
    verified_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Quality Control and Compliance
CREATE TABLE quality_control_checks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    batch_id UUID NOT NULL REFERENCES batches(id) ON DELETE RESTRICT,
    inspector_id UUID NOT NULL REFERENCES users(id),
    check_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    temperature DECIMAL(5,2),
    humidity DECIMAL(5,2),
    visual_inspection_passed BOOLEAN NOT NULL,
    chemical_analysis_passed BOOLEAN NOT NULL,
    packaging_check_passed BOOLEAN NOT NULL,
    notes TEXT,
    supporting_documents JSONB,
    blockchain_tx_hash VARCHAR(66),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Batch Transfer History
CREATE TABLE batch_transfers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    batch_id UUID NOT NULL REFERENCES batches(id) ON DELETE RESTRICT,
    from_user_id UUID REFERENCES users(id),
    to_user_id UUID NOT NULL REFERENCES users(id),
    transfer_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    transfer_type VARCHAR(50) NOT NULL,
    blockchain_tx_hash VARCHAR(66),
    transfer_status VARCHAR(20) DEFAULT 'PENDING',
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Document Management
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    batch_id UUID NOT NULL REFERENCES batches(id) ON DELETE RESTRICT,
    document_type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    file_hash VARCHAR(64) NOT NULL,
    uploaded_by UUID NOT NULL REFERENCES users(id),
    is_verified BOOLEAN DEFAULT false,
    verified_by UUID REFERENCES users(id),
    verification_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Audit Trail
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX idx_recalls_batch_id ON recalls(batch_id);
CREATE INDEX idx_recalls_status ON recalls(status);
CREATE INDEX idx_security_features_batch_id ON security_features(batch_id);
CREATE INDEX idx_verification_logs_batch_id ON verification_logs(batch_id);
CREATE INDEX idx_quality_control_batch_id ON quality_control_checks(batch_id);
CREATE INDEX idx_batch_transfers_batch_id ON batch_transfers(batch_id);
CREATE INDEX idx_documents_batch_id ON documents(batch_id);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);

-- Enable Row Level Security
ALTER TABLE recalls ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE quality_control_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE batch_transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view recalls for their batches" ON recalls
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM batches b
            WHERE b.id = batch_id
            AND (b.manufacturer_id = auth.uid() OR b.current_owner_id = auth.uid())
        ) OR 
        (auth.jwt() ->> 'role' IN ('admin', 'regulator'))
    );

CREATE POLICY "Users can view security features" ON security_features
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM batches b
            WHERE b.id = batch_id
            AND (b.manufacturer_id = auth.uid() OR b.current_owner_id = auth.uid())
        ) OR 
        (auth.jwt() ->> 'role' IN ('admin', 'regulator'))
    );

CREATE POLICY "Anyone can create verification logs" ON verification_logs
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view their verification logs" ON verification_logs
    FOR SELECT USING (
        verified_by = auth.uid() OR
        EXISTS (
            SELECT 1 FROM batches b
            WHERE b.id = batch_id
            AND (b.manufacturer_id = auth.uid() OR b.current_owner_id = auth.uid())
        ) OR 
        (auth.jwt() ->> 'role' IN ('admin', 'regulator'))
    );

-- Add triggers for updated_at timestamps
CREATE TRIGGER update_recalls_updated_at
    BEFORE UPDATE ON recalls
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_security_features_updated_at
    BEFORE UPDATE ON security_features
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_quality_control_updated_at
    BEFORE UPDATE ON quality_control_checks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_batch_transfers_updated_at
    BEFORE UPDATE ON batch_transfers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_documents_updated_at
    BEFORE UPDATE ON documents
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
