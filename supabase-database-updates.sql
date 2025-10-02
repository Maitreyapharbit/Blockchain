-- Supabase Database Updates for Recall Management and Anti-Counterfeiting Features
-- Run these commands in your Supabase SQL editor

-- =====================================================
-- 1. CREATE ENUMS FOR NEW FEATURES
-- =====================================================

-- Recall severity levels
CREATE TYPE recall_severity AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- Recall status
CREATE TYPE recall_status AS ENUM ('ACTIVE', 'RESOLVED', 'CANCELLED');

-- Distribution tracking status
CREATE TYPE distribution_status AS ENUM ('SHIPPED', 'IN_TRANSIT', 'DELIVERED', 'RETURNED');

-- Verification types for anti-counterfeiting
CREATE TYPE verification_type AS ENUM ('QR_SCAN', 'HOLOGRAM_CHECK', 'SERIAL_VERIFICATION');

-- Report types for suspicious activity
CREATE TYPE report_type AS ENUM ('SUSPICIOUS_PACKAGING', 'INVALID_QR', 'MISSING_HOLOGRAM', 'OTHER');

-- Report status
CREATE TYPE report_status AS ENUM ('PENDING', 'INVESTIGATING', 'CONFIRMED', 'FALSE_ALARM');

-- =====================================================
-- 2. RECALL MANAGEMENT TABLES
-- =====================================================

-- Main recalls table
CREATE TABLE public.recalls (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  recall_id character varying(50) NOT NULL UNIQUE,
  severity_level recall_severity NOT NULL,
  reason text NOT NULL,
  initiated_by uuid NOT NULL,
  initiated_at timestamp with time zone DEFAULT now(),
  status recall_status DEFAULT 'ACTIVE',
  resolution_notes text,
  resolved_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT recalls_pkey PRIMARY KEY (id),
  CONSTRAINT recalls_initiated_by_fkey FOREIGN KEY (initiated_by) REFERENCES public.users(id)
);

-- Recall batches (many-to-many relationship)
CREATE TABLE public.recall_batches (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  recall_id uuid NOT NULL,
  batch_id uuid NOT NULL,
  product_name character varying(200) NOT NULL,
  lot_number character varying(50) NOT NULL,
  expiry_date date NOT NULL,
  quantity_affected integer NOT NULL CHECK (quantity_affected > 0),
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT recall_batches_pkey PRIMARY KEY (id),
  CONSTRAINT recall_batches_recall_id_fkey FOREIGN KEY (recall_id) REFERENCES public.recalls(id) ON DELETE CASCADE,
  CONSTRAINT recall_batches_batch_id_fkey FOREIGN KEY (batch_id) REFERENCES public.batches(id) ON DELETE CASCADE
);

-- Distribution tracking for rapid response
CREATE TABLE public.distribution_tracking (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  batch_id uuid NOT NULL,
  distributor_name character varying(200) NOT NULL,
  distributor_address text NOT NULL,
  quantity_shipped integer NOT NULL CHECK (quantity_shipped > 0),
  shipped_date date NOT NULL,
  received_date date,
  status distribution_status DEFAULT 'SHIPPED',
  blockchain_tx_hash character varying(66),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT distribution_tracking_pkey PRIMARY KEY (id),
  CONSTRAINT distribution_tracking_batch_id_fkey FOREIGN KEY (batch_id) REFERENCES public.batches(id)
);

-- Recall notifications for stakeholders
CREATE TABLE public.recall_notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  recall_id uuid NOT NULL,
  recipient_email character varying(255) NOT NULL,
  recipient_name character varying(200),
  notification_type character varying(50) NOT NULL,
  sent_at timestamp with time zone,
  status character varying(20) DEFAULT 'PENDING',
  error_message text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT recall_notifications_pkey PRIMARY KEY (id),
  CONSTRAINT recall_notifications_recall_id_fkey FOREIGN KEY (recall_id) REFERENCES public.recalls(id) ON DELETE CASCADE
);

-- =====================================================
-- 3. ANTI-COUNTERFEITING TABLES
-- =====================================================

-- Security features for batches
CREATE TABLE public.security_features (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  batch_id uuid NOT NULL UNIQUE,
  qr_code_hash character varying(64) NOT NULL,
  hologram_id character varying(100) NOT NULL,
  serial_number character varying(50) NOT NULL UNIQUE,
  security_pattern text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT security_features_pkey PRIMARY KEY (id),
  CONSTRAINT security_features_batch_id_fkey FOREIGN KEY (batch_id) REFERENCES public.batches(id) ON DELETE CASCADE
);

-- Counterfeit reports
CREATE TABLE public.counterfeit_reports (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  batch_id uuid NOT NULL,
  reporter_name character varying(200) NOT NULL,
  reporter_email character varying(255) NOT NULL,
  report_type report_type NOT NULL,
  description text NOT NULL,
  evidence_urls text[] DEFAULT '{}',
  location character varying(200),
  reported_at timestamp with time zone DEFAULT now(),
  status report_status DEFAULT 'PENDING',
  investigator_notes text,
  resolved_at timestamp with time zone,
  CONSTRAINT counterfeit_reports_pkey PRIMARY KEY (id),
  CONSTRAINT counterfeit_reports_batch_id_fkey FOREIGN KEY (batch_id) REFERENCES public.batches(id)
);

-- Verification logs for authenticity checks
CREATE TABLE public.verification_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  batch_id uuid NOT NULL,
  verification_type verification_type NOT NULL,
  verification_result boolean NOT NULL,
  verification_details jsonb DEFAULT '{}',
  verified_by character varying(100),
  verified_at timestamp with time zone DEFAULT now(),
  ip_address inet,
  user_agent text,
  CONSTRAINT verification_logs_pkey PRIMARY KEY (id),
  CONSTRAINT verification_logs_batch_id_fkey FOREIGN KEY (batch_id) REFERENCES public.batches(id)
);

-- Flagged batches for suspicious activity
CREATE TABLE public.flagged_batches (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  batch_id uuid NOT NULL,
  reason text NOT NULL,
  flagged_at timestamp with time zone DEFAULT now(),
  flagged_by uuid,
  verification_type verification_type,
  failed_attempts integer DEFAULT 0,
  report_count integer DEFAULT 0,
  is_resolved boolean DEFAULT false,
  resolved_at timestamp with time zone,
  resolved_by uuid,
  resolution_notes text,
  CONSTRAINT flagged_batches_pkey PRIMARY KEY (id),
  CONSTRAINT flagged_batches_batch_id_fkey FOREIGN KEY (batch_id) REFERENCES public.batches(id),
  CONSTRAINT flagged_batches_flagged_by_fkey FOREIGN KEY (flagged_by) REFERENCES public.users(id),
  CONSTRAINT flagged_batches_resolved_by_fkey FOREIGN KEY (resolved_by) REFERENCES public.users(id)
);

-- =====================================================
-- 4. INDEXES FOR PERFORMANCE
-- =====================================================

-- Recall management indexes
CREATE INDEX idx_recalls_status ON public.recalls(status);
CREATE INDEX idx_recalls_severity ON public.recalls(severity_level);
CREATE INDEX idx_recalls_initiated_at ON public.recalls(initiated_at);
CREATE INDEX idx_recall_batches_recall_id ON public.recall_batches(recall_id);
CREATE INDEX idx_recall_batches_batch_id ON public.recall_batches(batch_id);
CREATE INDEX idx_distribution_tracking_batch_id ON public.distribution_tracking(batch_id);
CREATE INDEX idx_distribution_tracking_status ON public.distribution_tracking(status);

-- Anti-counterfeiting indexes
CREATE INDEX idx_security_features_batch_id ON public.security_features(batch_id);
CREATE INDEX idx_security_features_serial_number ON public.security_features(serial_number);
CREATE INDEX idx_counterfeit_reports_batch_id ON public.counterfeit_reports(batch_id);
CREATE INDEX idx_counterfeit_reports_status ON public.counterfeit_reports(status);
CREATE INDEX idx_counterfeit_reports_reported_at ON public.counterfeit_reports(reported_at);
CREATE INDEX idx_verification_logs_batch_id ON public.verification_logs(batch_id);
CREATE INDEX idx_verification_logs_verified_at ON public.verification_logs(verified_at);
CREATE INDEX idx_flagged_batches_batch_id ON public.flagged_batches(batch_id);
CREATE INDEX idx_flagged_batches_flagged_at ON public.flagged_batches(flagged_at);

-- =====================================================
-- 5. ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all new tables
ALTER TABLE public.recalls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recall_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.distribution_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recall_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.counterfeit_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verification_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flagged_batches ENABLE ROW LEVEL SECURITY;

-- Recall management policies
CREATE POLICY "Users can view recalls" ON public.recalls
  FOR SELECT USING (true);

CREATE POLICY "Manufacturers can create recalls" ON public.recalls
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() 
      AND role IN ('manufacturer', 'admin')
    )
  );

CREATE POLICY "Manufacturers can update recalls" ON public.recalls
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() 
      AND role IN ('manufacturer', 'admin')
    )
  );

-- Recall batches policies
CREATE POLICY "Users can view recall batches" ON public.recall_batches
  FOR SELECT USING (true);

CREATE POLICY "Manufacturers can manage recall batches" ON public.recall_batches
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() 
      AND role IN ('manufacturer', 'admin')
    )
  );

-- Anti-counterfeiting policies
CREATE POLICY "Users can view security features" ON public.security_features
  FOR SELECT USING (true);

CREATE POLICY "Manufacturers can manage security features" ON public.security_features
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() 
      AND role IN ('manufacturer', 'admin')
    )
  );

CREATE POLICY "Users can create counterfeit reports" ON public.counterfeit_reports
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view counterfeit reports" ON public.counterfeit_reports
  FOR SELECT USING (true);

CREATE POLICY "Admins can update counterfeit reports" ON public.counterfeit_reports
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'investigator')
    )
  );

-- Verification logs policies
CREATE POLICY "Users can create verification logs" ON public.verification_logs
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view verification logs" ON public.verification_logs
  FOR SELECT USING (true);

-- Flagged batches policies
CREATE POLICY "Users can view flagged batches" ON public.flagged_batches
  FOR SELECT USING (true);

CREATE POLICY "System can create flagged batches" ON public.flagged_batches
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can update flagged batches" ON public.flagged_batches
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'investigator')
    )
  );

-- =====================================================
-- 6. FUNCTIONS AND TRIGGERS
-- =====================================================

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers
CREATE TRIGGER update_recalls_updated_at BEFORE UPDATE ON public.recalls
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_distribution_tracking_updated_at BEFORE UPDATE ON public.distribution_tracking
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_security_features_updated_at BEFORE UPDATE ON public.security_features
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically flag batches with multiple failed verifications
CREATE OR REPLACE FUNCTION check_verification_failures()
RETURNS TRIGGER AS $$
BEGIN
  -- Only check for failed verifications
  IF NEW.verification_result = false THEN
    -- Count recent failed verifications for this batch
    IF (
      SELECT COUNT(*)
      FROM public.verification_logs
      WHERE batch_id = NEW.batch_id
        AND verification_type = NEW.verification_type
        AND verification_result = false
        AND verified_at > now() - interval '24 hours'
    ) >= 3 THEN
      -- Flag the batch if not already flagged
      INSERT INTO public.flagged_batches (batch_id, reason, verification_type, failed_attempts)
      VALUES (NEW.batch_id, 'Multiple failed verifications', NEW.verification_type, 3)
      ON CONFLICT (batch_id) DO NOTHING;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to check verification failures
CREATE TRIGGER check_verification_failures_trigger
  AFTER INSERT ON public.verification_logs
  FOR EACH ROW EXECUTE FUNCTION check_verification_failures();

-- Function to automatically flag batches with multiple reports
CREATE OR REPLACE FUNCTION check_report_frequency()
RETURNS TRIGGER AS $$
BEGIN
  -- Count recent reports for this batch
  IF (
    SELECT COUNT(*)
    FROM public.counterfeit_reports
    WHERE batch_id = NEW.batch_id
      AND reported_at > now() - interval '7 days'
  ) >= 2 THEN
    -- Flag the batch if not already flagged
    INSERT INTO public.flagged_batches (batch_id, reason, report_count)
    VALUES (NEW.batch_id, 'Multiple suspicious activity reports', 2)
    ON CONFLICT (batch_id) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to check report frequency
CREATE TRIGGER check_report_frequency_trigger
  AFTER INSERT ON public.counterfeit_reports
  FOR EACH ROW EXECUTE FUNCTION check_report_frequency();

-- =====================================================
-- 7. SAMPLE DATA (OPTIONAL)
-- =====================================================

-- Insert sample recall data
INSERT INTO public.recalls (recall_id, severity_level, reason, initiated_by)
VALUES 
  ('REC-2024-001', 'HIGH', 'Quality control issue detected in manufacturing process', 
   (SELECT id FROM public.users WHERE role = 'manufacturer' LIMIT 1)),
  ('REC-2024-002', 'CRITICAL', 'Contamination detected in batch samples', 
   (SELECT id FROM public.users WHERE role = 'manufacturer' LIMIT 1));

-- Insert sample security features
INSERT INTO public.security_features (batch_id, qr_code_hash, hologram_id, serial_number, security_pattern)
SELECT 
  b.id,
  'qr_hash_' || b.batch_id,
  'holo_' || b.batch_id,
  'SN-' || b.batch_id,
  'pattern_' || b.batch_id
FROM public.batches b
LIMIT 5;

-- =====================================================
-- 8. VIEWS FOR COMMON QUERIES
-- =====================================================

-- View for active recalls with batch information
CREATE VIEW public.active_recalls_view AS
SELECT 
  r.id,
  r.recall_id,
  r.severity_level,
  r.reason,
  r.initiated_at,
  r.status,
  COUNT(rb.id) as batch_count,
  SUM(rb.quantity_affected) as total_quantity_affected
FROM public.recalls r
LEFT JOIN public.recall_batches rb ON r.id = rb.recall_id
WHERE r.status = 'ACTIVE'
GROUP BY r.id, r.recall_id, r.severity_level, r.reason, r.initiated_at, r.status;

-- View for flagged batches with details
CREATE VIEW public.flagged_batches_view AS
SELECT 
  fb.id,
  fb.batch_id,
  b.drug_name,
  b.batch_number,
  fb.reason,
  fb.flagged_at,
  fb.is_resolved,
  COUNT(vl.id) as verification_attempts,
  COUNT(cr.id) as report_count
FROM public.flagged_batches fb
JOIN public.batches b ON fb.batch_id = b.id
LEFT JOIN public.verification_logs vl ON fb.batch_id = vl.batch_id
LEFT JOIN public.counterfeit_reports cr ON fb.batch_id = cr.batch_id
GROUP BY fb.id, fb.batch_id, b.drug_name, b.batch_number, fb.reason, fb.flagged_at, fb.is_resolved;

-- =====================================================
-- 9. GRANT PERMISSIONS
-- =====================================================

-- Grant permissions to authenticated users
GRANT SELECT ON public.active_recalls_view TO authenticated;
GRANT SELECT ON public.flagged_batches_view TO authenticated;

-- Grant permissions for service role
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO service_role;

-- =====================================================
-- COMPLETION MESSAGE
-- =====================================================

-- This completes the database setup for Recall Management and Anti-Counterfeiting features
-- You can now use the full functionality of the system