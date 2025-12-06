-- ================================================================
-- DRUG PRICING TRANSPARENCY LEDGER SCHEMA
-- ================================================================

-- Pricing chain participants (Manufacturer, Wholesaler, Pharmacy, PBM, Insurance)
CREATE TABLE pricing_chain_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    participant_type VARCHAR(50) NOT NULL CHECK (participant_type IN ('manufacturer', 'wholesaler', 'pharmacy', 'pbm', 'insurance')),
    organization_name VARCHAR(255) NOT NULL,
    npi_number VARCHAR(20),
    address TEXT,
    phone VARCHAR(20),
    email VARCHAR(255),
    is_verified BOOLEAN DEFAULT false,
    verified_by UUID REFERENCES users(id),
    verified_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Drug pricing records - tracks every price touchpoint
CREATE TABLE drug_pricing_ledger (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_id UUID NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
    drug_name VARCHAR(255) NOT NULL,
    manufacturer_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    
    -- Pricing chain touchpoints
    manufacturer_price DECIMAL(12, 2) NOT NULL,
    manufacturer_currency VARCHAR(3) DEFAULT 'USD',
    
    -- Wholesale tier
    wholesaler_id UUID REFERENCES pricing_chain_participants(id) ON DELETE SET NULL,
    wholesaler_purchase_price DECIMAL(12, 2),
    wholesaler_markup_percent DECIMAL(5, 2),
    wholesaler_price_per_unit DECIMAL(12, 2),
    
    -- Pharmacy tier
    pharmacy_id UUID REFERENCES pricing_chain_participants(id) ON DELETE SET NULL,
    pharmacy_purchase_price DECIMAL(12, 2),
    pharmacy_markup_percent DECIMAL(5, 2),
    pharmacy_cash_price DECIMAL(12, 2),
    pharmacy_average_retail_price DECIMAL(12, 2),
    
    -- PBM tier (insurance intermediary)
    pbm_id UUID REFERENCES pricing_chain_participants(id) ON DELETE SET NULL,
    pbm_acquisition_cost DECIMAL(12, 2),
    pbm_markup_percent DECIMAL(5, 2),
    pbm_spread_price DECIMAL(12, 2),
    pbm_reimbursement_to_pharmacy DECIMAL(12, 2),
    
    -- Insurance tier
    insurance_id UUID REFERENCES pricing_chain_participants(id) ON DELETE SET NULL,
    insurance_member_copay DECIMAL(12, 2),
    insurance_reimbursement_amount DECIMAL(12, 2),
    insurance_patient_responsibility DECIMAL(12, 2),
    
    -- Comparison metrics
    cash_price_vs_insurance_ratio DECIMAL(5, 2),
    total_markup_chain DECIMAL(5, 2),
    quantity_units INTEGER,
    
    -- Transparency data
    is_public BOOLEAN DEFAULT false,
    transparency_score INT DEFAULT 0, -- 0-100 score based on how much data is disclosed
    hidden_markups_identified BOOLEAN DEFAULT false,
    
    -- Blockchain reference
    blockchain_tx_hash VARCHAR(66),
    blockchain_block_number BIGINT,
    
    -- Audit fields
    submitted_by UUID NOT NULL REFERENCES users(id),
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    verified_by UUID REFERENCES users(id),
    verified_at TIMESTAMP WITH TIME ZONE,
    is_verified BOOLEAN DEFAULT false,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insurance scenario tracking
CREATE TABLE insurance_price_scenarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pricing_ledger_id UUID NOT NULL REFERENCES drug_pricing_ledger(id) ON DELETE CASCADE,
    
    scenario_name VARCHAR(255),
    patient_annual_deductible DECIMAL(12, 2),
    patient_copay_amount DECIMAL(12, 2),
    patient_coinsurance_percent DECIMAL(5, 2),
    patient_out_of_pocket_max DECIMAL(12, 2),
    
    insurance_pays DECIMAL(12, 2),
    patient_pays DECIMAL(12, 2),
    pbm_receives DECIMAL(12, 2),
    pharmacy_receives DECIMAL(12, 2),
    
    note TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Cash price comparison across pharmacies
CREATE TABLE cash_price_comparison (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_id UUID NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
    drug_name VARCHAR(255) NOT NULL,
    
    pharmacy_id UUID NOT NULL REFERENCES pricing_chain_participants(id) ON DELETE CASCADE,
    pharmacy_name VARCHAR(255),
    pharmacy_location VARCHAR(255),
    
    cash_price DECIMAL(12, 2) NOT NULL,
    quantity_units INTEGER DEFAULT 1,
    price_per_unit DECIMAL(12, 2),
    
    savings_potential DECIMAL(12, 2),
    discount_programs_available TEXT,
    generic_available BOOLEAN DEFAULT false,
    generic_price DECIMAL(12, 2),
    
    data_source VARCHAR(50), -- 'manual', 'api', 'gpo', 'pbm'
    verified BOOLEAN DEFAULT false,
    verified_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================================================
-- EQUIPMENT CALIBRATION LEDGER SCHEMA
-- ================================================================

-- Manufacturing equipment registry
CREATE TABLE manufacturing_equipment (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    equipment_id VARCHAR(100) UNIQUE NOT NULL,
    equipment_name VARCHAR(255) NOT NULL,
    equipment_type VARCHAR(100) NOT NULL, -- e.g., 'balance', 'thermometer', 'pH_meter', 'HPLC'
    
    manufacturer_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    facility_location VARCHAR(255),
    
    manufacturer_model VARCHAR(255),
    serial_number VARCHAR(100) UNIQUE,
    
    -- Calibration requirements
    calibration_frequency_days INTEGER NOT NULL, -- e.g., 30, 90, 365
    calibration_tolerance_range VARCHAR(255), -- e.g., "±0.5%" or "±2mg"
    acceptable_deviation DECIMAL(10, 4),
    
    -- QR Code
    qr_code_data TEXT,
    qr_code_hash VARCHAR(66),
    qr_code_image_path VARCHAR(500),
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    last_calibration_date DATE,
    next_calibration_due DATE,
    
    -- Metadata
    notes TEXT,
    fda_critical BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Equipment calibration records - the core ledger
CREATE TABLE equipment_calibration_ledger (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    equipment_id UUID NOT NULL REFERENCES manufacturing_equipment(id) ON DELETE CASCADE,
    
    -- Calibration details
    calibration_date DATE NOT NULL,
    calibration_time TIME,
    calibration_technician_id UUID NOT NULL REFERENCES users(id),
    calibration_method VARCHAR(255),
    
    -- Readings and measurements
    actual_reading VARCHAR(255),
    expected_reading VARCHAR(255),
    deviation DECIMAL(10, 4),
    deviation_percent DECIMAL(5, 2),
    is_within_tolerance BOOLEAN,
    
    -- Calibration certificate
    certificate_file_id UUID REFERENCES files(id) ON DELETE SET NULL,
    certificate_hash VARCHAR(66),
    certificate_issue_date DATE,
    certificate_expiry_date DATE,
    
    -- Calibration equipment used
    calibration_equipment_used VARCHAR(255),
    calibration_standard_reference VARCHAR(255),
    
    -- Status
    status VARCHAR(50) DEFAULT 'completed' CHECK (status IN ('pending', 'in_progress', 'completed', 'failed', 'rejected')),
    
    -- Corrective actions if needed
    passed BOOLEAN NOT NULL,
    requires_corrective_action BOOLEAN DEFAULT false,
    corrective_action_description TEXT,
    corrective_action_completed BOOLEAN DEFAULT false,
    
    -- Blockchain reference
    blockchain_tx_hash VARCHAR(66),
    blockchain_block_number BIGINT,
    ipfs_hash VARCHAR(100),
    
    -- Verification
    verified_by UUID REFERENCES users(id),
    verified_at TIMESTAMP WITH TIME ZONE,
    is_verified BOOLEAN DEFAULT false,
    
    -- Audit trail
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Calibration schedule/alerts
CREATE TABLE calibration_schedule (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    equipment_id UUID NOT NULL REFERENCES manufacturing_equipment(id) ON DELETE CASCADE,
    
    scheduled_date DATE NOT NULL,
    scheduled_by UUID NOT NULL REFERENCES users(id),
    
    -- Reminders
    reminder_days_before INT DEFAULT 7,
    reminder_sent BOOLEAN DEFAULT false,
    reminder_sent_at TIMESTAMP WITH TIME ZONE,
    
    -- Status
    status VARCHAR(50) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'overdue', 'cancelled')),
    notes TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Calibration metrics and trends
CREATE TABLE calibration_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    equipment_id UUID NOT NULL REFERENCES manufacturing_equipment(id) ON DELETE CASCADE,
    
    analysis_month DATE NOT NULL,
    
    -- Statistics
    total_calibrations INT DEFAULT 0,
    failed_calibrations INT DEFAULT 0,
    failure_rate DECIMAL(5, 2),
    average_deviation DECIMAL(10, 4),
    max_deviation DECIMAL(10, 4),
    
    -- Trend
    trend VARCHAR(50), -- 'improving', 'stable', 'declining'
    predicted_failure_risk DECIMAL(5, 2), -- predictive maintenance
    
    -- Recommendations
    maintenance_recommendation TEXT,
    maintenance_priority VARCHAR(50), -- 'low', 'medium', 'high', 'critical'
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Audit reports for FDA
CREATE TABLE calibration_audit_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    manufacturer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    report_period_start DATE NOT NULL,
    report_period_end DATE NOT NULL,
    
    -- Summary statistics
    total_equipment INT,
    total_calibrations INT,
    on_time_calibrations INT,
    overdue_calibrations INT,
    failed_calibrations INT,
    
    -- Compliance
    fda_compliant BOOLEAN,
    compliance_notes TEXT,
    
    -- Generated by system
    auto_generated BOOLEAN DEFAULT true,
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    report_file_path VARCHAR(500),
    
    -- Submission
    submitted_to_fda BOOLEAN DEFAULT false,
    fda_submission_date TIMESTAMP WITH TIME ZONE,
    fda_reference_number VARCHAR(100),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================================================
-- INDEXES FOR PERFORMANCE
-- ================================================================

CREATE INDEX idx_pricing_ledger_batch_id ON drug_pricing_ledger(batch_id);
CREATE INDEX idx_pricing_ledger_manufacturer ON drug_pricing_ledger(manufacturer_id);
CREATE INDEX idx_pricing_ledger_submitted_at ON drug_pricing_ledger(submitted_at);
CREATE INDEX idx_pricing_ledger_blockchain_hash ON drug_pricing_ledger(blockchain_tx_hash);

CREATE INDEX idx_cash_price_batch_id ON cash_price_comparison(batch_id);
CREATE INDEX idx_cash_price_pharmacy_id ON cash_price_comparison(pharmacy_id);
CREATE INDEX idx_cash_price_created_at ON cash_price_comparison(created_at);

CREATE INDEX idx_equipment_manufacturer_id ON manufacturing_equipment(manufacturer_id);
CREATE INDEX idx_equipment_active ON manufacturing_equipment(is_active);
CREATE INDEX idx_equipment_next_cal_due ON manufacturing_equipment(next_calibration_due);

CREATE INDEX idx_calibration_equipment_id ON equipment_calibration_ledger(equipment_id);
CREATE INDEX idx_calibration_technician_id ON equipment_calibration_ledger(calibration_technician_id);
CREATE INDEX idx_calibration_date ON equipment_calibration_ledger(calibration_date);
CREATE INDEX idx_calibration_blockchain_hash ON equipment_calibration_ledger(blockchain_tx_hash);
CREATE INDEX idx_calibration_status ON equipment_calibration_ledger(status);

CREATE INDEX idx_schedule_equipment_id ON calibration_schedule(equipment_id);
CREATE INDEX idx_schedule_date ON calibration_schedule(scheduled_date);

-- ================================================================
-- ROW LEVEL SECURITY
-- ================================================================

ALTER TABLE pricing_chain_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE drug_pricing_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE insurance_price_scenarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE cash_price_comparison ENABLE ROW LEVEL SECURITY;
ALTER TABLE manufacturing_equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment_calibration_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE calibration_schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE calibration_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE calibration_audit_reports ENABLE ROW LEVEL SECURITY;
