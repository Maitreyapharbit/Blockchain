const fetch = require('node-fetch');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

async function applySchema() {
  try {
    // Read the SQL file
    const sqlPath = path.join(__dirname, '..', 'additional_tables.sql');
    const sqlContent = await fs.readFile(sqlPath, 'utf8');

    // Split into statements
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);

    console.log(`Found ${statements.length} SQL statements to execute`);

    // Execute each statement via REST API
    for (let [index, statement] of statements.entries()) {
      console.log(`Executing statement ${index + 1}/${statements.length}...`);
      
      const response = await fetch(`${process.env.SUPABASE_URL}/rest/v1/rpc/sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
        },
        body: JSON.stringify({
          query: statement
        })
      });

      if (!response.ok) {
        const error = await response.text();
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

applySchema();