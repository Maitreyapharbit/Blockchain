-- Quick Supabase Setup for Recall Management and Anti-Counterfeiting
-- Run this in your Supabase SQL editor for a quick setup

-- 1. Create enums
CREATE TYPE recall_severity AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
CREATE TYPE recall_status AS ENUM ('ACTIVE', 'RESOLVED', 'CANCELLED');
CREATE TYPE distribution_status AS ENUM ('SHIPPED', 'IN_TRANSIT', 'DELIVERED', 'RETURNED');
CREATE TYPE verification_type AS ENUM ('QR_SCAN', 'HOLOGRAM_CHECK', 'SERIAL_VERIFICATION');
CREATE TYPE report_type AS ENUM ('SUSPICIOUS_PACKAGING', 'INVALID_QR', 'MISSING_HOLOGRAM', 'OTHER');
CREATE TYPE report_status AS ENUM ('PENDING', 'INVESTIGATING', 'CONFIRMED', 'FALSE_ALARM');

-- 2. Create main tables
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

-- 3. Enable RLS
ALTER TABLE public.recalls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recall_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.distribution_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.counterfeit_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verification_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flagged_batches ENABLE ROW LEVEL SECURITY;

-- 4. Create basic policies (allow all for now - customize as needed)
CREATE POLICY "Allow all operations on recalls" ON public.recalls FOR ALL USING (true);
CREATE POLICY "Allow all operations on recall_batches" ON public.recall_batches FOR ALL USING (true);
CREATE POLICY "Allow all operations on distribution_tracking" ON public.distribution_tracking FOR ALL USING (true);
CREATE POLICY "Allow all operations on security_features" ON public.security_features FOR ALL USING (true);
CREATE POLICY "Allow all operations on counterfeit_reports" ON public.counterfeit_reports FOR ALL USING (true);
CREATE POLICY "Allow all operations on verification_logs" ON public.verification_logs FOR ALL USING (true);
CREATE POLICY "Allow all operations on flagged_batches" ON public.flagged_batches FOR ALL USING (true);

-- 5. Create indexes for performance
CREATE INDEX idx_recalls_status ON public.recalls(status);
CREATE INDEX idx_recalls_severity ON public.recalls(severity_level);
CREATE INDEX idx_recall_batches_recall_id ON public.recall_batches(recall_id);
CREATE INDEX idx_recall_batches_batch_id ON public.recall_batches(batch_id);
CREATE INDEX idx_security_features_batch_id ON public.security_features(batch_id);
CREATE INDEX idx_counterfeit_reports_batch_id ON public.counterfeit_reports(batch_id);
CREATE INDEX idx_verification_logs_batch_id ON public.verification_logs(batch_id);
CREATE INDEX idx_flagged_batches_batch_id ON public.flagged_batches(batch_id);

-- 6. Grant permissions
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;