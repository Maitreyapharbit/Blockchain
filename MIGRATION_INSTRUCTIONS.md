# Since we're experiencing network connectivity issues in the codespace, here are the steps to apply the schema:

1. Log in to your Supabase dashboard at https://app.supabase.com
2. Navigate to your project
3. Go to the "SQL Editor" section
4. Create a new query
5. Copy and paste the contents of the additional_tables.sql file
6. Click "Run" to execute the SQL

Alternatively, you can run this locally using the Supabase CLI with these commands:

```bash
# Install Supabase CLI locally
brew install supabase/tap/supabase    # On macOS
# or
scoop install supabase    # On Windows with Scoop

# Login to Supabase
supabase login

# Link your project
supabase link --project-ref nyclipuoeyefmnmkyyfk

# Push the database changes
supabase db push

```

The SQL contents to paste in the Supabase SQL Editor:

```sql
-- Read the contents of additional_tables.sql
$(cat /workspaces/Blockchain/backend/additional_tables.sql)
```