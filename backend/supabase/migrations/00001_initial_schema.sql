-- Enable necessary extensions
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

-- Create base tables with RLS policies

-- Users table
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

-- Enable Row Level Security
alter table public.users enable row level security;

-- Create RLS policies for users
create policy "Users can view their own profile"
    on public.users for select
    using (auth.uid() = id);

create policy "Only admin can insert users"
    on public.users for insert
    with check (auth.jwt() ? 'role' and auth.jwt()->>'role' = 'admin');

-- Batches table
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

-- Enable Row Level Security
alter table public.batches enable row level security;

-- Create RLS policies for batches
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

-- Files table
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

-- Enable Row Level Security
alter table public.files enable row level security;

-- Create RLS policies for files
create policy "Users can view files they uploaded"
    on public.files for select
    using (
        auth.uid() = uploaded_by or
        (auth.jwt() ? 'role' and auth.jwt()->>'role' in ('admin', 'regulator'))
    );

create policy "Users can upload files"
    on public.files for insert
    with check (auth.uid() = uploaded_by);

-- Create indexes for better performance
create index idx_users_email on public.users(email);
create index idx_users_wallet_address on public.users(wallet_address);
create index idx_users_role on public.users(role);
create index idx_users_company_name on public.users(company_name);

create index idx_batches_batch_id on public.batches(batch_id);
create index idx_batches_manufacturer_id on public.batches(manufacturer_id);
create index idx_batches_current_owner_id on public.batches(current_owner_id);