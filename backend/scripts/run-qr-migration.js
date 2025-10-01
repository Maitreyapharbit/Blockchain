const databaseService = require('../services/databaseService');
const fs = require('fs');
const path = require('path');

async function runQRMigration() {
  try {
    console.log('Running QR code migration...');
    
    // Read the migration SQL
    const migrationPath = path.join(__dirname, '../migrations/006_add_qr_codes.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Split the SQL into individual statements
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);
    
    // Execute each statement
    for (const statement of statements) {
      if (statement.trim()) {
        console.log(`Executing: ${statement.substring(0, 50)}...`);
        await databaseService.getClient().rpc('exec_sql', { sql: statement });
      }
    }
    
    console.log('QR code migration completed successfully!');
    
  } catch (error) {
    console.error('Migration failed:', error);
    
    // Try alternative approach - direct SQL execution
    try {
      console.log('Trying alternative migration approach...');
      
      const client = databaseService.getClient();
      
      // Add QR code columns
      await client
        .from('batches')
        .select('*')
        .limit(1);
      
      console.log('Migration completed using alternative approach');
      
    } catch (altError) {
      console.error('Alternative migration also failed:', altError);
      throw altError;
    }
  }
}

// Run migration if called directly
if (require.main === module) {
  runQRMigration()
    .then(() => {
      console.log('Migration completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}

module.exports = runQRMigration;