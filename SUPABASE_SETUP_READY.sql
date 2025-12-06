-- ================================================================
-- PRICING TRANSPARENCY & EQUIPMENT CALIBRATION SCHEMA
-- Compatible with existing Supabase setup
-- Run this directly in Supabase SQL Editor
-- ================================================================

-- Ensure pgcrypto extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ================================================================
-- DRUG PRICING TRANSPARENCY TABLES
-- ================================================================

-- Pricing chain participants (Manufacturer, Wholesaler, Pharmacy, PBM, Insurance)
CREATE TABLE IF NOT EXISTS public.pricing_chain_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    participant_type VARCHAR(50) NOT NULL CHECK (participant_type IN ('manufacturer', 'wholesaler', 'pharmacy', 'pbm', 'insurance')),
    organization_name VARCHAR(255) NOT NULL,
    npi_number VARCHAR(20),
    address TEXT,
    phone VARCHAR(20),
    email VARCHAR(255),
    is_verified BOOLEAN DEFAULT false,
    verified_by UUID REFERENCES public.users(id),
    verified_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Drug pricing records - tracks every price touchpoint
CREATE TABLE IF NOT EXISTS public.drug_pricing_ledger (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_id UUID NOT NULL REFERENCES public.batches(id) ON DELETE CASCADE,
    drug_name VARCHAR(255) NOT NULL,
    manufacturer_id UUID NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
    
    -- Pricing chain touchpoints
    manufacturer_price DECIMAL(12, 2) NOT NULL,
    manufacturer_currency VARCHAR(3) DEFAULT 'USD',
    
    -- Wholesale tier
    wholesaler_id UUID REFERENCES public.pricing_chain_participants(id) ON DELETE SET NULL,
    wholesaler_purchase_price DECIMAL(12, 2),
    wholesaler_markup_percent DECIMAL(5, 2),
    wholesaler_price_per_unit DECIMAL(12, 2),
    
    -- Pharmacy tier
    pharmacy_id UUID REFERENCES public.pricing_chain_participants(id) ON DELETE SET NULL,
    pharmacy_purchase_price DECIMAL(12, 2),
    pharmacy_markup_percent DECIMAL(5, 2),
    pharmacy_cash_price DECIMAL(12, 2),
    pharmacy_average_retail_price DECIMAL(12, 2),
    
    -- PBM tier (insurance intermediary)
    pbm_id UUID REFERENCES public.pricing_chain_participants(id) ON DELETE SET NULL,
    pbm_acquisition_cost DECIMAL(12, 2),
    pbm_markup_percent DECIMAL(5, 2),
    pbm_spread_price DECIMAL(12, 2),
    pbm_reimbursement_to_pharmacy DECIMAL(12, 2),
    
    -- Insurance tier
    insurance_id UUID REFERENCES public.pricing_chain_participants(id) ON DELETE SET NULL,
    insurance_member_copay DECIMAL(12, 2),
    insurance_reimbursement_amount DECIMAL(12, 2),
    insurance_patient_responsibility DECIMAL(12, 2),
    
    -- Comparison metrics
    cash_price_vs_insurance_ratio DECIMAL(5, 2),
    total_markup_chain DECIMAL(5, 2),
    quantity_units INTEGER,
    
    -- Transparency data
    is_public BOOLEAN DEFAULT false,
    transparency_score INT DEFAULT 0,
    hidden_markups_identified BOOLEAN DEFAULT false,
    
    -- Blockchain reference
    blockchain_tx_hash VARCHAR(66),
    blockchain_block_number BIGINT,
    
    -- Audit fields
    submitted_by UUID NOT NULL REFERENCES public.users(id),
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    verified_by UUID REFERENCES public.users(id),
    verified_at TIMESTAMP WITH TIME ZONE,
    is_verified BOOLEAN DEFAULT false,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insurance scenario tracking
CREATE TABLE IF NOT EXISTS public.insurance_price_scenarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pricing_ledger_id UUID NOT NULL REFERENCES public.drug_pricing_ledger(id) ON DELETE CASCADE,
    
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
CREATE TABLE IF NOT EXISTS public.cash_price_comparison (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_id UUID NOT NULL REFERENCES public.batches(id) ON DELETE CASCADE,
    drug_name VARCHAR(255) NOT NULL,
    
    pharmacy_id UUID NOT NULL REFERENCES public.pricing_chain_participants(id) ON DELETE CASCADE,
    pharmacy_name VARCHAR(255),
    pharmacy_location VARCHAR(255),
    
    cash_price DECIMAL(12, 2) NOT NULL,
    quantity_units INTEGER DEFAULT 1,
    price_per_unit DECIMAL(12, 2),
    
    savings_potential DECIMAL(12, 2),
    discount_programs_available TEXT,
    generic_available BOOLEAN DEFAULT false,
    generic_price DECIMAL(12, 2),
    
    data_source VARCHAR(50),
    verified BOOLEAN DEFAULT false,
    verified_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================================================
-- EQUIPMENT CALIBRATION TABLES
-- ================================================================

-- Manufacturing equipment registry
CREATE TABLE IF NOT EXISTS public.manufacturing_equipment (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    equipment_id VARCHAR(100) UNIQUE NOT NULL,
    equipment_name VARCHAR(255) NOT NULL,
    equipment_type VARCHAR(100) NOT NULL,
    
    manufacturer_id UUID NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
    facility_location VARCHAR(255),
    
    manufacturer_model VARCHAR(255),
    serial_number VARCHAR(100) UNIQUE,
    
    calibration_frequency_days INTEGER NOT NULL,
    calibration_tolerance_range VARCHAR(255),
    acceptable_deviation DECIMAL(10, 4),
    
    qr_code_data TEXT,
    qr_code_hash VARCHAR(66),
    qr_code_image_path VARCHAR(500),
    
    is_active BOOLEAN DEFAULT true,
    last_calibration_date DATE,
    next_calibration_due DATE,
    
    notes TEXT,
    fda_critical BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Equipment calibration records
CREATE TABLE IF NOT EXISTS public.equipment_calibration_ledger (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    equipment_id UUID NOT NULL REFERENCES public.manufacturing_equipment(id) ON DELETE CASCADE,
    
    calibration_date DATE NOT NULL,
    calibration_time TIME,
    calibration_technician_id UUID NOT NULL REFERENCES public.users(id),
    calibration_method VARCHAR(255),
    
    actual_reading VARCHAR(255),
    expected_reading VARCHAR(255),
    deviation DECIMAL(10, 4),
    deviation_percent DECIMAL(5, 2),
    is_within_tolerance BOOLEAN,
    
    certificate_file_id UUID,
    certificate_hash VARCHAR(66),
    certificate_issue_date DATE,
    certificate_expiry_date DATE,
    
    calibration_equipment_used VARCHAR(255),
    calibration_standard_reference VARCHAR(255),
    
    status VARCHAR(50) DEFAULT 'completed' CHECK (status IN ('pending', 'in_progress', 'completed', 'failed', 'rejected')),
    
    passed BOOLEAN NOT NULL,
    requires_corrective_action BOOLEAN DEFAULT false,
    corrective_action_description TEXT,
    corrective_action_completed BOOLEAN DEFAULT false,
    
    blockchain_tx_hash VARCHAR(66),
    blockchain_block_number BIGINT,
    ipfs_hash VARCHAR(100),
    
    verified_by UUID REFERENCES public.users(id),
    verified_at TIMESTAMP WITH TIME ZONE,
    is_verified BOOLEAN DEFAULT false,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Calibration schedule
CREATE TABLE IF NOT EXISTS public.calibration_schedule (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    equipment_id UUID NOT NULL REFERENCES public.manufacturing_equipment(id) ON DELETE CASCADE,
    
    scheduled_date DATE NOT NULL,
    scheduled_by UUID NOT NULL REFERENCES public.users(id),
    
    reminder_days_before INT DEFAULT 7,
    reminder_sent BOOLEAN DEFAULT false,
    reminder_sent_at TIMESTAMP WITH TIME ZONE,
    
    status VARCHAR(50) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'overdue', 'cancelled')),
    notes TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Calibration analytics
CREATE TABLE IF NOT EXISTS public.calibration_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    equipment_id UUID NOT NULL REFERENCES public.manufacturing_equipment(id) ON DELETE CASCADE,
    
    analysis_month DATE NOT NULL,
    
    total_calibrations INT DEFAULT 0,
    failed_calibrations INT DEFAULT 0,
    failure_rate DECIMAL(5, 2),
    average_deviation DECIMAL(10, 4),
    max_deviation DECIMAL(10, 4),
    
    trend VARCHAR(50),
    predicted_failure_risk DECIMAL(5, 2),
    
    maintenance_recommendation TEXT,
    maintenance_priority VARCHAR(50),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- FDA audit reports
CREATE TABLE IF NOT EXISTS public.calibration_audit_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    manufacturer_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    
    report_period_start DATE NOT NULL,
    report_period_end DATE NOT NULL,
    
    total_equipment INT,
    total_calibrations INT,
    on_time_calibrations INT,
    overdue_calibrations INT,
    failed_calibrations INT,
    
    fda_compliant BOOLEAN,
    compliance_notes TEXT,
    
    auto_generated BOOLEAN DEFAULT true,
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    report_file_path VARCHAR(500),
    
    submitted_to_fda BOOLEAN DEFAULT false,
    fda_submission_date TIMESTAMP WITH TIME ZONE,
    fda_reference_number VARCHAR(100),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add foreign key to files table IF it exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'files' AND table_schema = 'public') THEN
        ALTER TABLE public.equipment_calibration_ledger
        ADD CONSTRAINT fk_calibration_certificate_file 
        FOREIGN KEY (certificate_file_id) REFERENCES public.files(id) ON DELETE SET NULL;
    END IF;
END $$;

-- ================================================================
-- INDEXES FOR PERFORMANCE
-- ================================================================

CREATE INDEX IF NOT EXISTS idx_pricing_ledger_batch_id ON public.drug_pricing_ledger(batch_id);
CREATE INDEX IF NOT EXISTS idx_pricing_ledger_manufacturer ON public.drug_pricing_ledger(manufacturer_id);
CREATE INDEX IF NOT EXISTS idx_pricing_ledger_submitted_at ON public.drug_pricing_ledger(submitted_at);
CREATE INDEX IF NOT EXISTS idx_pricing_ledger_blockchain_hash ON public.drug_pricing_ledger(blockchain_tx_hash);

CREATE INDEX IF NOT EXISTS idx_cash_price_batch_id ON public.cash_price_comparison(batch_id);
CREATE INDEX IF NOT EXISTS idx_cash_price_pharmacy_id ON public.cash_price_comparison(pharmacy_id);
CREATE INDEX IF NOT EXISTS idx_cash_price_created_at ON public.cash_price_comparison(created_at);

CREATE INDEX IF NOT EXISTS idx_equipment_manufacturer_id ON public.manufacturing_equipment(manufacturer_id);
CREATE INDEX IF NOT EXISTS idx_equipment_active ON public.manufacturing_equipment(is_active);
CREATE INDEX IF NOT EXISTS idx_equipment_next_cal_due ON public.manufacturing_equipment(next_calibration_due);

CREATE INDEX IF NOT EXISTS idx_calibration_equipment_id ON public.equipment_calibration_ledger(equipment_id);
CREATE INDEX IF NOT EXISTS idx_calibration_technician_id ON public.equipment_calibration_ledger(calibration_technician_id);
CREATE INDEX IF NOT EXISTS idx_calibration_date ON public.equipment_calibration_ledger(calibration_date);
CREATE INDEX IF NOT EXISTS idx_calibration_blockchain_hash ON public.equipment_calibration_ledger(blockchain_tx_hash);
CREATE INDEX IF NOT EXISTS idx_calibration_status ON public.equipment_calibration_ledger(status);

CREATE INDEX IF NOT EXISTS idx_schedule_equipment_id ON public.calibration_schedule(equipment_id);
CREATE INDEX IF NOT EXISTS idx_schedule_date ON public.calibration_schedule(scheduled_date);

-- ================================================================
-- ROW LEVEL SECURITY
-- ================================================================

ALTER TABLE IF EXISTS public.pricing_chain_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.drug_pricing_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.insurance_price_scenarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.cash_price_comparison ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.manufacturing_equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.equipment_calibration_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.calibration_schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.calibration_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.calibration_audit_reports ENABLE ROW LEVEL SECURITY;

-- Create permissive policies (customize these for your security requirements)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'pricing_chain_participants' AND policyname = 'allow_all') THEN
    CREATE POLICY allow_all ON public.pricing_chain_participants FOR ALL USING (true);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'drug_pricing_ledger' AND policyname = 'allow_all') THEN
    CREATE POLICY allow_all ON public.drug_pricing_ledger FOR ALL USING (true);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'insurance_price_scenarios' AND policyname = 'allow_all') THEN
    CREATE POLICY allow_all ON public.insurance_price_scenarios FOR ALL USING (true);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'cash_price_comparison' AND policyname = 'allow_all') THEN
    CREATE POLICY allow_all ON public.cash_price_comparison FOR ALL USING (true);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'manufacturing_equipment' AND policyname = 'allow_all') THEN
    CREATE POLICY allow_all ON public.manufacturing_equipment FOR ALL USING (true);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'equipment_calibration_ledger' AND policyname = 'allow_all') THEN
    CREATE POLICY allow_all ON public.equipment_calibration_ledger FOR ALL USING (true);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'calibration_schedule' AND policyname = 'allow_all') THEN
    CREATE POLICY allow_all ON public.calibration_schedule FOR ALL USING (true);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'calibration_analytics' AND policyname = 'allow_all') THEN
    CREATE POLICY allow_all ON public.calibration_analytics FOR ALL USING (true);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'calibration_audit_reports' AND policyname = 'allow_all') THEN
    CREATE POLICY allow_all ON public.calibration_audit_reports FOR ALL USING (true);
  END IF;
END $$;

-- ================================================================
-- GRANT PERMISSIONS
-- ================================================================

GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- ================================================================
-- SETUP COMPLETE
-- ================================================================
-- 9 new tables created:
-- 1. pricing_chain_participants
-- 2. drug_pricing_ledger
-- 3. insurance_price_scenarios
-- 4. cash_price_comparison
-- 5. manufacturing_equipment
-- 6. equipment_calibration_ledger
-- 7. calibration_schedule
-- 8. calibration_analytics
-- 9. calibration_audit_reports
--
-- All compatible with your existing Supabase schema
-- Ready for drug pricing transparency and equipment calibration features
