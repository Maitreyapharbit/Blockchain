-- Create enums for recall management
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

-- Recalls table
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

-- Enable Row Level Security
alter table public.recalls enable row level security;

-- Create RLS policies for recalls
create policy "Users can view all recalls"
    on public.recalls for select
    using (true);

create policy "Only manufacturers and regulators can create recalls"
    on public.recalls for insert
    with check (
        auth.jwt() ? 'role' and 
        (auth.jwt()->>'role')::text in ('manufacturer', 'regulator', 'admin')
    );

-- Recall batches table
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

-- Enable Row Level Security
alter table public.recall_batches enable row level security;

-- Create RLS policies for recall_batches
create policy "Users can view all recall batches"
    on public.recall_batches for select
    using (true);

create policy "Only recall initiators can add batches"
    on public.recall_batches for insert
    with check (
        (auth.jwt() ? 'role' and (auth.jwt()->>'role')::text = 'manufacturer')
    );-- Distribution tracking table
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

-- Enable Row Level Security
alter table public.distribution_tracking enable row level security;

-- Create RLS policies for distribution_tracking
create policy "Users can view distributions they're involved in"
    on public.distribution_tracking for select
    using (
        (auth.jwt() ? 'role' and (auth.jwt()->>'role')::text in ('admin', 'regulator', 'manufacturer', 'distributor'))
    );

create policy "Only distributors can create distribution records"
    on public.distribution_tracking for insert
    with check (
        (auth.jwt() ? 'role' and (auth.jwt()->>'role')::text = 'distributor')
    );

-- Create indexes for better performance
create index idx_recalls_recall_id on public.recalls(recall_id);
create index idx_recalls_initiated_by on public.recalls(initiated_by);
create index idx_recalls_status on public.recalls(status);
create index idx_recall_batches_recall_id on public.recall_batches(recall_id);
create index idx_recall_batches_batch_id on public.recall_batches(batch_id);
create index idx_distribution_tracking_batch_id on public.distribution_tracking(batch_id);
create index idx_distribution_tracking_distributor_id on public.distribution_tracking(distributor_id);
create index idx_distribution_tracking_status on public.distribution_tracking(status);