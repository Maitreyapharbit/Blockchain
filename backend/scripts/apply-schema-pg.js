const { Pool } = require('pg');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

const connectionString = 'postgresql://postgres:IndianBrotherhood@01@db.nyclipuoeyefmnmkyyfk.supabase.co:5432/postgres';

const pool = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false // Required for Supabase
  }
});

async function applySchema() {
  try {
    // Read the SQL file
    const sqlPath = path.join(__dirname, '..', 'additional_tables.sql');
    const sqlContent = await fs.readFile(sqlPath, 'utf8');

    console.log('Connecting to database...');
    const client = await pool.connect();

    try {
      // Start a transaction
      await client.query('BEGIN');

      console.log('Executing SQL statements...');
      // Execute the SQL
      await client.query(sqlContent);

      // Commit the transaction
      await client.query('COMMIT');
      console.log('Schema update completed successfully');
    } catch (error) {
      // Rollback on error
      await client.query('ROLLBACK');
      console.error('Failed to apply schema:', error);
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

applySchema();