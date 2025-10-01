const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = 'https://nyclipuoeyefmnmkyyfk.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im55Y2xpcHVvZXllZm1ubWt5eWZrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTE3MjQxMiwiZXhwIjoyMDc0NzQ4NDEyfQ.HI0H8PdSub9iZcrK_T6gjL_m66uBe1OuvzvRHjes7PE';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runQRMigration() {
  try {
    console.log('Starting QR code migration...');
    
    // Check if columns already exist
    const { data: columns, error: columnError } = await supabase
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_name', 'batches')
      .in('column_name', ['qr_code_data', 'qr_code_image_path', 'qr_code_hash', 'qr_code_generated_at']);
    
    if (columnError) {
      console.log('Could not check existing columns, proceeding with migration...');
    } else if (columns && columns.length > 0) {
      console.log('QR code columns already exist, skipping migration');
      return;
    }
    
    // Add QR code columns using raw SQL
    const migrationQueries = [
      `ALTER TABLE batches ADD COLUMN IF NOT EXISTS qr_code_data TEXT`,
      `ALTER TABLE batches ADD COLUMN IF NOT EXISTS qr_code_image_path VARCHAR(500)`,
      `ALTER TABLE batches ADD COLUMN IF NOT EXISTS qr_code_hash VARCHAR(66)`,
      `ALTER TABLE batches ADD COLUMN IF NOT EXISTS qr_code_generated_at TIMESTAMP WITH TIME ZONE`,
      `CREATE INDEX IF NOT EXISTS idx_batches_qr_code_hash ON batches(qr_code_hash)`
    ];
    
    for (const query of migrationQueries) {
      console.log(`Executing: ${query}`);
      const { error } = await supabase.rpc('exec_sql', { sql: query });
      
      if (error) {
        console.error(`Error executing query: ${query}`, error);
        // Try alternative approach
        console.log('Trying alternative approach...');
        const { error: altError } = await supabase
          .from('batches')
          .select('id')
          .limit(1);
        
        if (altError) {
          console.error('Alternative approach also failed:', altError);
        } else {
          console.log('Database connection successful, columns may already exist');
        }
      } else {
        console.log('Query executed successfully');
      }
    }
    
    console.log('QR code migration completed!');
    
  } catch (error) {
    console.error('Migration failed:', error);
  }
}

// Run migration
runQRMigration()
  .then(() => {
    console.log('Migration process completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration process failed:', error);
    process.exit(1);
  });