const fs = require('fs');
const path = require('path');
const https = require('https');

// Load environment variables
require('dotenv').config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const migrationFiles = [
  '00001_initial_schema.sql',
  '00002_recall_management.sql',
  '00003_anti_counterfeiting.sql',
  '00004_compliance.sql',
  '00005_audit_and_settings.sql'
];

async function executeMigration(sql) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: new URL(SUPABASE_URL).hostname,
      path: '/rest/v1/sql',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(data);
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        }
      });
    });

    req.on('error', reject);
    req.write(JSON.stringify({ query: sql }));
    req.end();
  });
}

async function applyMigrations() {
  for (const file of migrationFiles) {
    try {
      console.log(`Applying migration: ${file}`);
      const sql = fs.readFileSync(
        path.join(__dirname, '..', 'supabase', 'migrations', file),
        'utf8'
      );
      await executeMigration(sql);
      console.log(`Successfully applied migration: ${file}`);
    } catch (error) {
      console.error(`Error applying migration ${file}:`, error);
      process.exit(1);
    }
  }
}

applyMigrations().catch(console.error);