-- Enable required extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- Create custom types
create type user_role as enum (
    'manufacturer',
    'distributor', 
    'pharmacy',
    'regulator',
    'auditor',
    'admin'
);

create type batch_status as enum (
    'CREATED',
    'IN_TRANSIT',
    'RECEIVED',
    'IN_STORAGE',
    'DISPENSED',
    'RECALLED'
);

create type file_type as enum (
    'CERTIFICATE',
    'INVOICE',
    'MANIFEST',
    'QUALITY_REPORT',
    'COMPLIANCE_DOCUMENT',
    'IMAGE',
    'OTHER'
);

create type recall_severity as enum (
    'LOW',
    'MEDIUM',
    'HIGH',
    'CRITICAL'
);

create type recall_status as enum (
    'ACTIVE',
    'RESOLVED',
    'CANCELLED'
);

create type distribution_status as enum (
    'SHIPPED',
    'IN_TRANSIT',
    'DELIVERED',
    'RETURNED'
);

create type report_type as enum (
    'SUSPICIOUS_PACKAGING',
    'INVALID_QR',
    'MISSING_HOLOGRAM',
    'OTHER'
);

create type report_status as enum (
    'PENDING',
    'INVESTIGATING',
    'CONFIRMED',
    'FALSE_ALARM'
);

create type verification_type as enum (
    'QR_SCAN',
    'HOLOGRAM_CHECK',
    'SERIAL_VERIFICATION'
);

create type compliance_check_type as enum (
    'FDA_APPROVAL',
    'QUALITY_CONTROL',
    'TEMPERATURE_CHECK',
    'PACKAGING_INSPECTION',
    'EXPIRY_VERIFICATION',
    'AUTHENTICITY_CHECK',
    'CUSTOM'
);

-- Create tables with RLS policies

-- 1. Users and Authentication
create table public.users (
    id uuid primary key default uuid_generate_v4(),
    email text unique not null,
    password_hash text not null,
    role user_role not null default 'manufacturer',
    wallet_address text unique,
    first_name text,
    last_name text,
    company_name text,
    phone text,
    is_active boolean default true,
    email_verified boolean default false,
    last_login timestamp with time zone,
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

-- 2. Batch Management
create table public.batches (
    id uuid primary key default uuid_generate_v4(),
    batch_id text unique not null,
    drug_name text not null,
    manufacturer_id uuid not null references public.users(id),
    current_owner_id uuid not null references public.users(id),
    manufacture_date date not null,
    expiry_date date not null,
    quantity integer not null check (quantity > 0),
    remaining_quantity integer not null check (remaining_quantity >= 0),
    status batch_status not null default 'CREATED',
    description text,
    drug_code text,
    dosage_form text,
    strength text,
    lot_number text,
    serial_number text,
    temperature_range jsonb,
    storage_conditions text,
    blockchain_tx_hash text,
    blockchain_block_number bigint,
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

-- 3. File Management
create table public.files (
    id uuid primary key default uuid_generate_v4(),
    filename text not null,
    original_filename text not null,
    file_path text not null,
    file_type file_type not null,
    mime_type text not null,
    file_size bigint not null check (file_size > 0),
    file_hash text not null,
    s3_bucket text,
    s3_key text,
    uploaded_by uuid not null references public.users(id),
    created_at timestamp with time zone default now()
);

-- 4. Recall Management
create table public.recalls (
    id uuid primary key default uuid_generate_v4(),
    recall_id text unique not null,
    severity_level recall_severity not null,
    reason text not null,
    initiated_by uuid not null references public.users(id),
    initiated_at timestamp with time zone default now(),
    status recall_status not null default 'ACTIVE',
    resolution_notes text,
    resolved_at timestamp with time zone,
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

create table public.recall_batches (
    id uuid primary key default uuid_generate_v4(),
    recall_id uuid not null references public.recalls(id) on delete cascade,
    batch_id uuid not null references public.batches(id) on delete restrict,
    product_name text not null,
    lot_number text not null,
    expiry_date date not null,
    quantity_affected integer not null check (quantity_affected > 0),
    created_at timestamp with time zone default now()
);

-- 5. Distribution Tracking
create table public.distribution_tracking (
    id uuid primary key default uuid_generate_v4(),
    batch_id uuid not null references public.batches(id) on delete restrict,
    distributor_id uuid not null references public.users(id) on delete restrict,
    distributor_name text not null,
    distributor_address text not null,
    quantity_shipped integer not null check (quantity_shipped > 0),
    shipped_date date not null,
    received_date date,
    status distribution_status not null default 'SHIPPED',
    blockchain_tx_hash text,
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

-- 6. Anti-counterfeiting
create table public.security_features (
    id uuid primary key default uuid_generate_v4(),
    batch_id uuid not null references public.batches(id) on delete restrict,
    qr_code_hash text not null,
    hologram_id text not null,
    serial_number text unique not null,
    security_pattern text not null,
    valid_until timestamp with time zone,
    is_active boolean default true,
    blockchain_tx_hash text,
    blockchain_block_number bigint,
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

create table public.counterfeit_reports (
    id uuid primary key default uuid_generate_v4(),
    batch_id uuid not null references public.batches(id) on delete restrict,
    reporter_name text not null,
    reporter_email text not null,
    report_type report_type not null,
    description text not null,
    evidence_urls text[],
    location text,
    reported_at timestamp with time zone default now(),
    status report_status not null default 'PENDING',
    investigator_id uuid references public.users(id) on delete set null,
    investigator_notes text,
    resolved_at timestamp with time zone
);

create table public.verification_logs (
    id uuid primary key default uuid_generate_v4(),
    batch_id uuid not null references public.batches(id) on delete restrict,
    verification_type verification_type not null,
    verification_result boolean not null,
    verification_details jsonb not null default '{}',
    verified_by uuid references public.users(id) on delete set null,
    verified_at timestamp with time zone default now(),
    ip_address inet,
    user_agent text,
    location jsonb
);

-- 7. Compliance Management
create table public.compliance_logs (
    id uuid primary key default uuid_generate_v4(),
    batch_id uuid not null references public.batches(id) on delete cascade,
    check_type compliance_check_type not null,
    passed boolean not null,
    timestamp timestamp with time zone not null default now(),
    auditor_id uuid not null references public.users(id) on delete restrict,
    notes text,
    document_hash text,
    blockchain_tx_hash text,
    blockchain_block_number bigint,
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

-- 8. File Relationships
create table public.batch_files (
    id uuid primary key default uuid_generate_v4(),
    batch_id uuid not null references public.batches(id) on delete cascade,
    file_id uuid not null references public.files(id) on delete cascade,
    file_purpose text,
    is_required boolean default false,
    created_at timestamp with time zone default now(),
    unique(batch_id, file_id)
);

create table public.compliance_files (
    id uuid primary key default uuid_generate_v4(),
    compliance_log_id uuid not null references public.compliance_logs(id) on delete cascade,
    file_id uuid not null references public.files(id) on delete cascade,
    created_at timestamp with time zone default now(),
    unique(compliance_log_id, file_id)
);

-- 9. Audit and Settings
create table public.audit_logs (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid references public.users(id) on delete set null,
    action text not null,
    resource_type text not null,
    resource_id uuid,
    old_values jsonb,
    new_values jsonb,
    ip_address inet,
    user_agent text,
    created_at timestamp with time zone default now()
);

create table public.system_settings (
    id uuid primary key default uuid_generate_v4(),
    key text unique not null,
    value jsonb not null,
    description text,
    is_public boolean default false,
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

-- Enable Row Level Security
alter table public.users enable row level security;
alter table public.batches enable row level security;
alter table public.files enable row level security;
alter table public.recalls enable row level security;
alter table public.recall_batches enable row level security;
alter table public.distribution_tracking enable row level security;
alter table public.security_features enable row level security;
alter table public.counterfeit_reports enable row level security;
alter table public.verification_logs enable row level security;
alter table public.compliance_logs enable row level security;
alter table public.batch_files enable row level security;
alter table public.compliance_files enable row level security;
alter table public.audit_logs enable row level security;
alter table public.system_settings enable row level security;

-- Create RLS Policies

-- Users policies
create policy "Users can view their own profile"
    on public.users for select
    using (auth.uid() = id);

create policy "Only admin can insert users"
    on public.users for insert
    with check (auth.jwt() ? 'role' and auth.jwt()->>'role' = 'admin');

-- Batches policies
create policy "Users can view batches they own or manufactured"
    on public.batches for select
    using (
        auth.uid() = manufacturer_id or 
        auth.uid() = current_owner_id or 
        (auth.jwt() ? 'role' and auth.jwt()->>'role' in ('admin', 'regulator'))
    );

create policy "Only manufacturers can create batches"
    on public.batches for insert
    with check (
        auth.uid() = manufacturer_id and
        (auth.jwt() ? 'role' and auth.jwt()->>'role' = 'manufacturer')
    );

-- Files policies
create policy "Users can view files they uploaded"
    on public.files for select
    using (
        auth.uid() = uploaded_by or
        (auth.jwt() ? 'role' and auth.jwt()->>'role' in ('admin', 'regulator'))
    );

-- Create performance indexes
create index idx_users_email on public.users(email);
create index idx_users_wallet_address on public.users(wallet_address);
create index idx_users_role on public.users(role);
create index idx_users_company_name on public.users(company_name);

create index idx_batches_batch_id on public.batches(batch_id);
create index idx_batches_manufacturer_id on public.batches(manufacturer_id);
create index idx_batches_current_owner_id on public.batches(current_owner_id);
create index idx_batches_status on public.batches(status);

create index idx_recalls_recall_id on public.recalls(recall_id);
create index idx_recalls_initiated_by on public.recalls(initiated_by);
create index idx_recalls_status on public.recalls(status);

create index idx_recall_batches_recall_id on public.recall_batches(recall_id);
create index idx_recall_batches_batch_id on public.recall_batches(batch_id);

create index idx_distribution_tracking_batch_id on public.distribution_tracking(batch_id);
create index idx_distribution_tracking_distributor_id on public.distribution_tracking(distributor_id);
create index idx_distribution_tracking_status on public.distribution_tracking(status);

create index idx_security_features_batch_id on public.security_features(batch_id);
create index idx_security_features_serial_number on public.security_features(serial_number);
create index idx_security_features_hologram_id on public.security_features(hologram_id);

create index idx_counterfeit_reports_batch_id on public.counterfeit_reports(batch_id);
create index idx_counterfeit_reports_status on public.counterfeit_reports(status);
create index idx_counterfeit_reports_investigator_id on public.counterfeit_reports(investigator_id);

create index idx_verification_logs_batch_id on public.verification_logs(batch_id);
create index idx_verification_logs_verified_by on public.verification_logs(verified_by);
create index idx_verification_logs_verified_at on public.verification_logs(verified_at);

create index idx_compliance_logs_batch_id on public.compliance_logs(batch_id);
create index idx_compliance_logs_auditor_id on public.compliance_logs(auditor_id);
create index idx_compliance_logs_check_type on public.compliance_logs(check_type);

create index idx_batch_files_batch_id on public.batch_files(batch_id);
create index idx_batch_files_file_id on public.batch_files(file_id);

create index idx_compliance_files_compliance_log_id on public.compliance_files(compliance_log_id);
create index idx_compliance_files_file_id on public.compliance_files(file_id);

create index idx_audit_logs_user_id on public.audit_logs(user_id);
create index idx_audit_logs_resource_type on public.audit_logs(resource_type);
create index idx_audit_logs_resource_id on public.audit_logs(resource_id);
create index idx_audit_logs_created_at on public.audit_logs(created_at);