-- Create enums for compliance
create type compliance_check_type as enum (
    'FDA_APPROVAL',
    'QUALITY_CONTROL',
    'TEMPERATURE_CHECK',
    'PACKAGING_INSPECTION',
    'EXPIRY_VERIFICATION',
    'AUTHENTICITY_CHECK',
    'CUSTOM'
);

-- Compliance logs table
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

-- Enable Row Level Security
alter table public.compliance_logs enable row level security;

-- Create RLS policies for compliance_logs
create policy "Authorized users can view compliance logs"
    on public.compliance_logs for select
    using (
        exists (
            select 1 from public.batches b
            where b.id = batch_id
            and (
                b.manufacturer_id = auth.uid() or
                b.current_owner_id = auth.uid() or
                (auth.jwt() ? 'role' and auth.jwt()->>'role' in ('admin', 'regulator', 'auditor'))
            )
        ) or
        (auth.uid() = auditor_id)
    );

create policy "Only auditors can create compliance logs"
    on public.compliance_logs for insert
    with check (
        auth.uid() = auditor_id and
        (auth.jwt() ? 'role' and auth.jwt()->>'role' in ('auditor', 'regulator'))
    );

-- Batch files relationship table
create table public.batch_files (
    id uuid primary key default uuid_generate_v4(),
    batch_id uuid not null references public.batches(id) on delete cascade,
    file_id uuid not null references public.files(id) on delete cascade,
    file_purpose text,
    is_required boolean default false,
    created_at timestamp with time zone default now(),
    unique(batch_id, file_id)
);

-- Enable Row Level Security
alter table public.batch_files enable row level security;

-- Create RLS policies for batch_files
create policy "Users can view batch files they have access to"
    on public.batch_files for select
    using (
        exists (
            select 1 from public.batches b
            where b.id = batch_id
            and (
                b.manufacturer_id = auth.uid() or
                b.current_owner_id = auth.uid() or
                (auth.jwt() ? 'role' and auth.jwt()->>'role' in ('admin', 'regulator', 'auditor'))
            )
        )
    );

create policy "Only batch owners can add batch files"
    on public.batch_files for insert
    with check (
        exists (
            select 1 from public.batches b
            where b.id = batch_id
            and (b.manufacturer_id = auth.uid() or b.current_owner_id = auth.uid())
        )
    );

-- Compliance files relationship table
create table public.compliance_files (
    id uuid primary key default uuid_generate_v4(),
    compliance_log_id uuid not null references public.compliance_logs(id) on delete cascade,
    file_id uuid not null references public.files(id) on delete cascade,
    created_at timestamp with time zone default now(),
    unique(compliance_log_id, file_id)
);

-- Enable Row Level Security
alter table public.compliance_files enable row level security;

-- Create RLS policies for compliance_files
create policy "Users can view compliance files they have access to"
    on public.compliance_files for select
    using (
        exists (
            select 1 from public.compliance_logs cl
            join public.batches b on b.id = cl.batch_id
            where cl.id = compliance_log_id
            and (
                b.manufacturer_id = auth.uid() or
                b.current_owner_id = auth.uid() or
                cl.auditor_id = auth.uid() or
                (auth.jwt() ? 'role' and auth.jwt()->>'role' in ('admin', 'regulator', 'auditor'))
            )
        )
    );

create policy "Only auditors can add compliance files"
    on public.compliance_files for insert
    with check (
        exists (
            select 1 from public.compliance_logs cl
            where cl.id = compliance_log_id
            and cl.auditor_id = auth.uid()
        )
    );

-- Create indexes for better performance
create index idx_compliance_logs_batch_id on public.compliance_logs(batch_id);
create index idx_compliance_logs_auditor_id on public.compliance_logs(auditor_id);
create index idx_compliance_logs_check_type on public.compliance_logs(check_type);

create index idx_batch_files_batch_id on public.batch_files(batch_id);
create index idx_batch_files_file_id on public.batch_files(file_id);

create index idx_compliance_files_compliance_log_id on public.compliance_files(compliance_log_id);
create index idx_compliance_files_file_id on public.compliance_files(file_id);