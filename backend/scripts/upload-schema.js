const http = require('http');
const fetch = require('node-fetch');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

async function uploadSQL() {
  try {
    // Read SQL file
    const sqlPath = path.join(__dirname, '..', 'additional_tables.sql');
    const sqlContent = await fs.readFile(sqlPath, 'utf8');
    
    // Supabase endpoint
    const url = `${process.env.SUPABASE_URL}/rest/v1/rpc/exec_sql`;
    
    // Make request
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
      },
      body: JSON.stringify({
        query: sqlContent
      })
    });
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to execute SQL: ${error}`);
    }
    
    console.log('Schema update completed successfully');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

// Run script
uploadSQL();