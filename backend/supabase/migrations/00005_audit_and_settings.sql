-- Audit logs table
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

-- Enable Row Level Security
alter table public.audit_logs enable row level security;

-- Create RLS policies for audit_logs
create policy "Users can view their own audit logs"
    on public.audit_logs for select
    using (
        auth.uid() = user_id or
        (auth.jwt() ? 'role' and auth.jwt()->>'role' in ('admin', 'regulator'))
    );

create policy "System can create audit logs"
    on public.audit_logs for insert
    with check (true);

-- System settings table
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
alter table public.system_settings enable row level security;

-- Create RLS policies for system_settings
create policy "Users can view public settings"
    on public.system_settings for select
    using (
        is_public = true or
        (auth.jwt() ? 'role' and auth.jwt()->>'role' = 'admin')
    );

create policy "Only admins can modify settings"
    on public.system_settings for all
    using (auth.jwt() ? 'role' and auth.jwt()->>'role' = 'admin')
    with check (auth.jwt() ? 'role' and auth.jwt()->>'role' = 'admin');

-- Create indexes for better performance
create index idx_audit_logs_user_id on public.audit_logs(user_id);
create index idx_audit_logs_action on public.audit_logs(action);
create index idx_audit_logs_resource_type on public.audit_logs(resource_type);
create index idx_audit_logs_resource_id on public.audit_logs(resource_id);
create index idx_audit_logs_created_at on public.audit_logs(created_at);

create index idx_system_settings_key on public.system_settings(key);
create index idx_system_settings_is_public on public.system_settings(is_public);