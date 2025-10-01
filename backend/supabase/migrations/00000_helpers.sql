-- Convert auth.uid() text to UUID helper function
create or replace function auth.uid_to_uuid() 
returns uuid 
language sql 
stable
as $$
  select auth.uid()::uuid
$$;