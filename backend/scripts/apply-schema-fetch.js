const fetch = require('node-fetch');
const HttpsProxyAgent = require('https-proxy-agent');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

// Create a proxy agent
const proxyUrl = process.env.HTTPS_PROXY || process.env.HTTP_PROXY;
const agent = proxyUrl ? new HttpsProxyAgent(proxyUrl) : null;

async function executeSql(statement) {
  const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`
    },
    body: JSON.stringify({
      query: statement
    }),
    agent: agent,
    timeout: 30000
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`HTTP error! status: ${response.status}, body: ${text}`);
  }

  return response.json();
}

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
      
      try {
        await executeSql(statement);
        console.log(`Successfully executed statement ${index + 1}`);
      } catch (error) {
        console.error(`Error executing statement ${index + 1}:`, error.message);
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