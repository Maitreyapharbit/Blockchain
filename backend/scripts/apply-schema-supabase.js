const { createClient } = require('@supabase/supabase-js');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function applySchema() {
  try {
    // Read the SQL file
    const sqlPath = path.join(__dirname, '..', 'additional_tables.sql');
    const sqlContent = await fs.readFile(sqlPath, 'utf8');

    // Split into individual statements
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);

    console.log(`Found ${statements.length} SQL statements to execute`);

    // Execute each statement
    for (const [index, statement] of statements.entries()) {
      console.log(`Executing statement ${index + 1}/${statements.length}`);
      
      const { data, error } = await supabase.rpc('exec', {
        query: statement
      });

      if (error) {
        console.error(`Error executing statement ${index + 1}:`, error);
      } else {
        console.log(`Successfully executed statement ${index + 1}`);
      }
    }

    console.log('Schema update completed');
  } catch (error) {
    console.error('Failed to apply schema:', error);
    process.exit(1);
  }
}

// Run the script
applySchema();