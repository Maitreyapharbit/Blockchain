-- Create enums for anti-counterfeiting
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

-- Security features table
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

-- Enable Row Level Security
alter table public.security_features enable row level security;

-- Create RLS policies for security_features
create policy "Users can view security features they're authorized for"
    on public.security_features for select
    using (
        exists (
            select 1 from public.batches b
            where b.id = batch_id
            and (
                b.manufacturer_id = auth.uid() or
                b.current_owner_id = auth.uid() or
                (auth.jwt() ? 'role' and auth.jwt()->>'role' in ('admin', 'regulator'))
            )
        )
    );

create policy "Only manufacturers can create security features"
    on public.security_features for insert
    with check (
        exists (
            select 1 from public.batches b
            where b.id = batch_id
            and b.manufacturer_id = auth.uid()
        )
    );

-- Counterfeit reports table
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

-- Enable Row Level Security
alter table public.counterfeit_reports enable row level security;

-- Create RLS policies for counterfeit_reports
create policy "Anyone can create counterfeit reports"
    on public.counterfeit_reports for insert
    with check (true);

create policy "Authorized users can view counterfeit reports"
    on public.counterfeit_reports for select
    using (
        exists (
            select 1 from public.batches b
            where b.id = batch_id
            and (
                b.manufacturer_id = auth.uid() or
                b.current_owner_id = auth.uid() or
                (auth.jwt() ? 'role' and auth.jwt()->>'role' in ('admin', 'regulator'))
            )
        ) or
        (auth.uid() = investigator_id)
    );

-- Verification logs table
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

-- Enable Row Level Security
alter table public.verification_logs enable row level security;

-- Create RLS policies for verification_logs
create policy "Anyone can create verification logs"
    on public.verification_logs for insert
    with check (true);

create policy "Authorized users can view verification logs"
    on public.verification_logs for select
    using (
        exists (
            select 1 from public.batches b
            where b.id = batch_id
            and (
                b.manufacturer_id = auth.uid() or
                b.current_owner_id = auth.uid() or
                (auth.jwt() ? 'role' and auth.jwt()->>'role' in ('admin', 'regulator'))
            )
        ) or
        (auth.uid() = verified_by)
    );

-- Create indexes for better performance
create index idx_security_features_batch_id on public.security_features(batch_id);
create index idx_security_features_serial_number on public.security_features(serial_number);
create index idx_security_features_hologram_id on public.security_features(hologram_id);

create index idx_counterfeit_reports_batch_id on public.counterfeit_reports(batch_id);
create index idx_counterfeit_reports_status on public.counterfeit_reports(status);
create index idx_counterfeit_reports_investigator_id on public.counterfeit_reports(investigator_id);

create index idx_verification_logs_batch_id on public.verification_logs(batch_id);
create index idx_verification_logs_verified_by on public.verification_logs(verified_by);
create index idx_verification_logs_verified_at on public.verification_logs(verified_at);