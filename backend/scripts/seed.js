#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const config = require('../config/env');
const logger = require('../utils/logger');

class DatabaseSeeder {
  constructor() {
    this.supabase = createClient(
      config.database.supabaseUrl,
      config.database.supabaseServiceRoleKey
    );
  }

  /**
   * Seed all data
   * @param {Object} options - Seed options
   * @returns {Promise<Object>} Seed result
   */
  async seedAll(options = {}) {
    const { clearExisting = false } = options;

    logger.info('Starting database seeding', { clearExisting });

    try {
      if (clearExisting) {
        await this.clearAllData();
      }

      // Seed in order due to foreign key constraints
      const results = {
        users: await this.seedUsers(),
        batches: await this.seedBatches(),
        complianceLogs: await this.seedComplianceLogs(),
        files: await this.seedFiles(),
        systemSettings: await this.seedSystemSettings()
      };

      logger.info('Database seeding completed successfully', { results });
      return { success: true, results };

    } catch (error) {
      logger.error('Database seeding failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Clear all data
   * @returns {Promise<void>}
   */
  async clearAllData() {
    logger.info('Clearing existing data');

    const tables = [
      'compliance_files',
      'batch_files',
      'files',
      'compliance_logs',
      'batch_ownership_history',
      'batches',
      'audit_logs',
      'users',
      'system_settings'
    ];

    for (const table of tables) {
      const { error } = await this.supabase
        .from(table)
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');

      if (error) {
        logger.warn(`Failed to clear table ${table}`, { error: error.message });
      }
    }
  }

  /**
   * Seed users
   * @returns {Promise<Array>} Created users
   */
  async seedUsers() {
    logger.info('Seeding users');

    const users = [
      {
        id: uuidv4(),
        email: 'admin@pharbitchain.com',
        password_hash: await bcrypt.hash('admin123', 12),
        role: 'admin',
        wallet_address: '0x1234567890123456789012345678901234567890',
        first_name: 'Admin',
        last_name: 'User',
        company_name: 'PharbitChain',
        phone: '+1-555-0001',
        is_active: true,
        email_verified: true
      },
      {
        id: uuidv4(),
        email: 'manufacturer@pharmcorp.com',
        password_hash: await bcrypt.hash('manufacturer123', 12),
        role: 'manufacturer',
        wallet_address: '0x2345678901234567890123456789012345678901',
        first_name: 'John',
        last_name: 'Smith',
        company_name: 'PharmCorp Manufacturing',
        phone: '+1-555-0002',
        is_active: true,
        email_verified: true
      },
      {
        id: uuidv4(),
        email: 'distributor@medsupply.com',
        password_hash: await bcrypt.hash('distributor123', 12),
        role: 'distributor',
        wallet_address: '0x3456789012345678901234567890123456789012',
        first_name: 'Sarah',
        last_name: 'Johnson',
        company_name: 'MedSupply Distribution',
        phone: '+1-555-0003',
        is_active: true,
        email_verified: true
      },
      {
        id: uuidv4(),
        email: 'pharmacy@healthplus.com',
        password_hash: await bcrypt.hash('pharmacy123', 12),
        role: 'pharmacy',
        wallet_address: '0x4567890123456789012345678901234567890123',
        first_name: 'Michael',
        last_name: 'Brown',
        company_name: 'HealthPlus Pharmacy',
        phone: '+1-555-0004',
        is_active: true,
        email_verified: true
      },
      {
        id: uuidv4(),
        email: 'regulator@fda.gov',
        password_hash: await bcrypt.hash('regulator123', 12),
        role: 'regulator',
        wallet_address: '0x5678901234567890123456789012345678901234',
        first_name: 'Dr. Emily',
        last_name: 'Davis',
        company_name: 'FDA Regulatory',
        phone: '+1-555-0005',
        is_active: true,
        email_verified: true
      },
      {
        id: uuidv4(),
        email: 'auditor@qualityassurance.com',
        password_hash: await bcrypt.hash('auditor123', 12),
        role: 'auditor',
        wallet_address: '0x6789012345678901234567890123456789012345',
        first_name: 'Robert',
        last_name: 'Wilson',
        company_name: 'Quality Assurance Inc',
        phone: '+1-555-0006',
        is_active: true,
        email_verified: true
      }
    ];

    const { data, error } = await this.supabase
      .from('users')
      .insert(users)
      .select();

    if (error) {
      throw new Error(`Failed to seed users: ${error.message}`);
    }

    logger.info('Users seeded successfully', { count: data.length });
    return data;
  }

  /**
   * Seed batches
   * @returns {Promise<Array>} Created batches
   */
  async seedBatches() {
    logger.info('Seeding batches');

    // Get manufacturer user
    const { data: manufacturer } = await this.supabase
      .from('users')
      .select('id')
      .eq('role', 'manufacturer')
      .single();

    if (!manufacturer) {
      throw new Error('Manufacturer user not found');
    }

    const batches = [
      {
        id: uuidv4(),
        batch_id: 'ASP-2024-001',
        drug_name: 'Aspirin 100mg',
        manufacturer_id: manufacturer.id,
        current_owner_id: manufacturer.id,
        manufacture_date: '2024-01-15',
        expiry_date: '2026-01-15',
        quantity: 10000,
        remaining_quantity: 10000,
        status: 'CREATED',
        batch_number: 'B001',
        description: 'Standard aspirin tablets for pain relief',
        drug_code: 'ASP-100',
        dosage_form: 'Tablet',
        strength: '100mg',
        lot_number: 'LOT-001',
        serial_number: 'SN-001',
        temperature_range: { min: 15, max: 25, unit: 'C' },
        storage_conditions: 'Store in cool, dry place',
        blockchain_tx_hash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
        blockchain_block_number: 12345
      },
      {
        id: uuidv4(),
        batch_id: 'IBU-2024-002',
        drug_name: 'Ibuprofen 200mg',
        manufacturer_id: manufacturer.id,
        current_owner_id: manufacturer.id,
        manufacture_date: '2024-01-20',
        expiry_date: '2026-01-20',
        quantity: 5000,
        remaining_quantity: 5000,
        status: 'CREATED',
        batch_number: 'B002',
        description: 'Ibuprofen tablets for anti-inflammatory treatment',
        drug_code: 'IBU-200',
        dosage_form: 'Tablet',
        strength: '200mg',
        lot_number: 'LOT-002',
        serial_number: 'SN-002',
        temperature_range: { min: 15, max: 25, unit: 'C' },
        storage_conditions: 'Store in cool, dry place',
        blockchain_tx_hash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        blockchain_block_number: 12346
      },
      {
        id: uuidv4(),
        batch_id: 'PAR-2024-003',
        drug_name: 'Paracetamol 500mg',
        manufacturer_id: manufacturer.id,
        current_owner_id: manufacturer.id,
        manufacture_date: '2024-01-25',
        expiry_date: '2026-01-25',
        quantity: 8000,
        remaining_quantity: 8000,
        status: 'IN_TRANSIT',
        batch_number: 'B003',
        description: 'Paracetamol tablets for fever and pain relief',
        drug_code: 'PAR-500',
        dosage_form: 'Tablet',
        strength: '500mg',
        lot_number: 'LOT-003',
        serial_number: 'SN-003',
        temperature_range: { min: 15, max: 25, unit: 'C' },
        storage_conditions: 'Store in cool, dry place',
        blockchain_tx_hash: '0x9876543210fedcba9876543210fedcba9876543210fedcba9876543210fedcba',
        blockchain_block_number: 12347
      }
    ];

    const { data, error } = await this.supabase
      .from('batches')
      .insert(batches)
      .select();

    if (error) {
      throw new Error(`Failed to seed batches: ${error.message}`);
    }

    logger.info('Batches seeded successfully', { count: data.length });
    return data;
  }

  /**
   * Seed compliance logs
   * @returns {Promise<Array>} Created compliance logs
   */
  async seedComplianceLogs() {
    logger.info('Seeding compliance logs');

    // Get auditor user
    const { data: auditor } = await this.supabase
      .from('users')
      .select('id')
      .eq('role', 'auditor')
      .single();

    if (!auditor) {
      throw new Error('Auditor user not found');
    }

    // Get batches
    const { data: batches } = await this.supabase
      .from('batches')
      .select('id');

    if (!batches || batches.length === 0) {
      throw new Error('No batches found');
    }

    const complianceLogs = [];

    // Create compliance logs for each batch
    for (const batch of batches) {
      const batchComplianceLogs = [
        {
          id: uuidv4(),
          batch_id: batch.id,
          check_type: 'FDA_APPROVAL',
          passed: true,
          timestamp: new Date('2024-01-16T10:00:00Z'),
          auditor_id: auditor.id,
          notes: 'FDA approval verified for batch',
          document_hash: '0x1111111111111111111111111111111111111111111111111111111111111111',
          blockchain_tx_hash: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
          blockchain_block_number: 12350
        },
        {
          id: uuidv4(),
          batch_id: batch.id,
          check_type: 'QUALITY_CONTROL',
          passed: true,
          timestamp: new Date('2024-01-16T11:00:00Z'),
          auditor_id: auditor.id,
          notes: 'Quality control tests passed',
          document_hash: '0x2222222222222222222222222222222222222222222222222222222222222222',
          blockchain_tx_hash: '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
          blockchain_block_number: 12351
        },
        {
          id: uuidv4(),
          batch_id: batch.id,
          check_type: 'TEMPERATURE_CHECK',
          passed: true,
          timestamp: new Date('2024-01-16T12:00:00Z'),
          auditor_id: auditor.id,
          notes: 'Temperature monitoring within acceptable range',
          document_hash: '0x3333333333333333333333333333333333333333333333333333333333333333',
          blockchain_tx_hash: '0xcccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc',
          blockchain_block_number: 12352
        }
      ];

      complianceLogs.push(...batchComplianceLogs);
    }

    const { data, error } = await this.supabase
      .from('compliance_logs')
      .insert(complianceLogs)
      .select();

    if (error) {
      throw new Error(`Failed to seed compliance logs: ${error.message}`);
    }

    logger.info('Compliance logs seeded successfully', { count: data.length });
    return data;
  }

  /**
   * Seed files
   * @returns {Promise<Array>} Created files
   */
  async seedFiles() {
    logger.info('Seeding files');

    // Get manufacturer user
    const { data: manufacturer } = await this.supabase
      .from('users')
      .select('id')
      .eq('role', 'manufacturer')
      .single();

    if (!manufacturer) {
      throw new Error('Manufacturer user not found');
    }

    const files = [
      {
        id: uuidv4(),
        filename: 'certificate_asp_001.pdf',
        original_filename: 'certificate_asp_001.pdf',
        file_path: 'uploads/batches/ASP-2024-001/certificate_asp_001.pdf',
        file_type: 'CERTIFICATE',
        mime_type: 'application/pdf',
        file_size: 1024000,
        file_hash: '0x4444444444444444444444444444444444444444444444444444444444444444',
        s3_bucket: 'pharbit-blockchain-documents',
        s3_key: 'uploads/batches/ASP-2024-001/certificate_asp_001.pdf',
        uploaded_by: manufacturer.id
      },
      {
        id: uuidv4(),
        filename: 'quality_report_asp_001.pdf',
        original_filename: 'quality_report_asp_001.pdf',
        file_path: 'uploads/batches/ASP-2024-001/quality_report_asp_001.pdf',
        file_type: 'QUALITY_REPORT',
        mime_type: 'application/pdf',
        file_size: 2048000,
        file_hash: '0x5555555555555555555555555555555555555555555555555555555555555555',
        s3_bucket: 'pharbit-blockchain-documents',
        s3_key: 'uploads/batches/ASP-2024-001/quality_report_asp_001.pdf',
        uploaded_by: manufacturer.id
      },
      {
        id: uuidv4(),
        filename: 'invoice_ibu_002.pdf',
        original_filename: 'invoice_ibu_002.pdf',
        file_path: 'uploads/batches/IBU-2024-002/invoice_ibu_002.pdf',
        file_type: 'INVOICE',
        mime_type: 'application/pdf',
        file_size: 512000,
        file_hash: '0x6666666666666666666666666666666666666666666666666666666666666666',
        s3_bucket: 'pharbit-blockchain-documents',
        s3_key: 'uploads/batches/IBU-2024-002/invoice_ibu_002.pdf',
        uploaded_by: manufacturer.id
      }
    ];

    const { data, error } = await this.supabase
      .from('files')
      .insert(files)
      .select();

    if (error) {
      throw new Error(`Failed to seed files: ${error.message}`);
    }

    // Link files to batches
    const { data: batches } = await this.supabase
      .from('batches')
      .select('id, batch_id');

    if (batches && batches.length > 0) {
      const batchFiles = [
        {
          id: uuidv4(),
          batch_id: batches[0].id, // ASP-2024-001
          file_id: files[0].id, // certificate
          file_purpose: 'certificate',
          is_required: true
        },
        {
          id: uuidv4(),
          batch_id: batches[0].id, // ASP-2024-001
          file_id: files[1].id, // quality report
          file_purpose: 'quality_report',
          is_required: true
        },
        {
          id: uuidv4(),
          batch_id: batches[1].id, // IBU-2024-002
          file_id: files[2].id, // invoice
          file_purpose: 'invoice',
          is_required: false
        }
      ];

      await this.supabase
        .from('batch_files')
        .insert(batchFiles);
    }

    logger.info('Files seeded successfully', { count: data.length });
    return data;
  }

  /**
   * Seed system settings
   * @returns {Promise<Array>} Created system settings
   */
  async seedSystemSettings() {
    logger.info('Seeding system settings');

    const settings = [
      {
        id: uuidv4(),
        key: 'app_name',
        value: 'PharbitChain',
        description: 'Application name',
        is_public: true
      },
      {
        id: uuidv4(),
        key: 'app_version',
        value: '1.0.0',
        description: 'Application version',
        is_public: true
      },
      {
        id: uuidv4(),
        key: 'max_file_size',
        value: 10485760, // 10MB
        description: 'Maximum file upload size in bytes',
        is_public: false
      },
      {
        id: uuidv4(),
        key: 'allowed_file_types',
        value: ['pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png'],
        description: 'Allowed file types for upload',
        is_public: false
      },
      {
        id: uuidv4(),
        key: 'batch_expiry_warning_days',
        value: 30,
        description: 'Days before expiry to show warning',
        is_public: false
      },
      {
        id: uuidv4(),
        key: 'compliance_check_required',
        value: true,
        description: 'Whether compliance checks are required for batches',
        is_public: false
      }
    ];

    const { data, error } = await this.supabase
      .from('system_settings')
      .insert(settings)
      .select();

    if (error) {
      throw new Error(`Failed to seed system settings: ${error.message}`);
    }

    logger.info('System settings seeded successfully', { count: data.length });
    return data;
  }
}

// CLI interface
if (require.main === module) {
  const command = process.argv[2];
  const seeder = new DatabaseSeeder();

  async function runCommand() {
    try {
      switch (command) {
        case 'all':
          const clearExisting = process.argv.includes('--clear');
          const result = await seeder.seedAll({ clearExisting });
          console.log('Seeding completed:', result);
          break;

        case 'users':
          const users = await seeder.seedUsers();
          console.log('Users seeded:', users.length);
          break;

        case 'batches':
          const batches = await seeder.seedBatches();
          console.log('Batches seeded:', batches.length);
          break;

        case 'compliance':
          const compliance = await seeder.seedComplianceLogs();
          console.log('Compliance logs seeded:', compliance.length);
          break;

        case 'files':
          const files = await seeder.seedFiles();
          console.log('Files seeded:', files.length);
          break;

        case 'settings':
          const settings = await seeder.seedSystemSettings();
          console.log('System settings seeded:', settings.length);
          break;

        case 'clear':
          await seeder.clearAllData();
          console.log('All data cleared');
          break;

        default:
          console.log('Usage: node seed.js [all|users|batches|compliance|files|settings|clear] [--clear]');
          process.exit(1);
      }
    } catch (error) {
      console.error('Seeding failed:', error.message);
      process.exit(1);
    }
  }

  runCommand();
}

module.exports = DatabaseSeeder;
