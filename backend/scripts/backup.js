#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const AWS = require('aws-sdk');
const fs = require('fs-extra');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const config = require('../config/env');
const logger = require('../utils/logger');

class BackupService {
  constructor() {
    this.supabase = createClient(
      config.database.supabaseUrl,
      config.database.supabaseServiceRoleKey
    );

    this.s3 = new AWS.S3({
      accessKeyId: config.aws.accessKeyId,
      secretAccessKey: config.aws.secretAccessKey,
      region: config.aws.region
    });

    this.backupBucket = config.aws.s3Bucket;
    this.backupPrefix = 'backups';
  }

  /**
   * Create full database backup
   * @param {Object} options - Backup options
   * @returns {Promise<Object>} Backup result
   */
  async createFullBackup(_options = {}) {
    const backupId = uuidv4();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupName = `full-backup-${timestamp}-${backupId}`;

    logger.info('Starting full database backup', { backupId, backupName });

    try {
      // Create backup directory
      const backupDir = path.join(process.cwd(), 'backups', backupName);
      await fs.ensureDir(backupDir);

      // Backup all tables
      const tables = [
        'users',
        'batches',
        'batch_ownership_history',
        'compliance_logs',
        'files',
        'batch_files',
        'compliance_files',
        'audit_logs',
        'system_settings'
      ];

      const backupData = {};

      for (const table of tables) {
        logger.info(`Backing up table: ${table}`);
        const { data, error } = await this.supabase
          .from(table)
          .select('*');

        if (error) {
          throw new Error(`Failed to backup table ${table}: ${error.message}`);
        }

        backupData[table] = data || [];

        // Save individual table backup
        const tableFile = path.join(backupDir, `${table}.json`);
        await fs.writeJson(tableFile, data || [], { spaces: 2 });
      }

      // Create backup manifest
      const manifest = {
        backupId,
        backupName,
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        tables: tables.map((table) => ({
          name: table,
          recordCount: backupData[table].length,
          file: `${table}.json`
        })),
        totalRecords: Object.values(backupData).reduce((sum, records) => sum + records.length, 0)
      };

      const manifestFile = path.join(backupDir, 'manifest.json');
      await fs.writeJson(manifestFile, manifest, { spaces: 2 });

      // Compress backup
      const compressedFile = `${backupName}.tar.gz`;
      const compressedPath = path.join(process.cwd(), 'backups', compressedFile);

      await this.compressDirectory(backupDir, compressedPath);

      // Upload to S3
      const s3Key = `${this.backupPrefix}/database/${compressedFile}`;
      await this.uploadToS3(compressedPath, s3Key);

      // Clean up local files
      await fs.remove(backupDir);
      await fs.remove(compressedPath);

      logger.info('Full database backup completed', {
        backupId,
        s3Key,
        totalRecords: manifest.totalRecords
      });

      return {
        success: true,
        backupId,
        backupName,
        s3Key,
        manifest
      };

    } catch (error) {
      logger.error('Full database backup failed', { error: error.message, backupId });
      throw error;
    }
  }

  /**
   * Create incremental backup
   * @param {string} lastBackupTime - Last backup timestamp
   * @param {Object} options - Backup options
   * @returns {Promise<Object>} Backup result
   */
  async createIncrementalBackup(lastBackupTime, _options = {}) {
    const backupId = uuidv4();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupName = `incremental-backup-${timestamp}-${backupId}`;

    logger.info('Starting incremental database backup', { backupId, lastBackupTime });

    try {
      const backupDir = path.join(process.cwd(), 'backups', backupName);
      await fs.ensureDir(backupDir);

      // Get tables with updated_at columns
      const tablesWithTimestamps = [
        'users',
        'batches',
        'compliance_logs',
        'files',
        'audit_logs',
        'system_settings'
      ];

      const backupData = {};

      for (const table of tablesWithTimestamps) {
        logger.info(`Backing up updated records from table: ${table}`);

        const { data, error } = await this.supabase
          .from(table)
          .select('*')
          .gte('updated_at', lastBackupTime);

        if (error) {
          throw new Error(`Failed to backup table ${table}: ${error.message}`);
        }

        backupData[table] = data || [];

        if (data && data.length > 0) {
          const tableFile = path.join(backupDir, `${table}.json`);
          await fs.writeJson(tableFile, data, { spaces: 2 });
        }
      }

      // Get new records from tables without updated_at
      const tablesWithoutTimestamps = [
        'batch_ownership_history',
        'batch_files',
        'compliance_files'
      ];

      for (const table of tablesWithoutTimestamps) {
        logger.info(`Backing up new records from table: ${table}`);

        const { data, error } = await this.supabase
          .from(table)
          .select('*')
          .gte('created_at', lastBackupTime);

        if (error) {
          throw new Error(`Failed to backup table ${table}: ${error.message}`);
        }

        backupData[table] = data || [];

        if (data && data.length > 0) {
          const tableFile = path.join(backupDir, `${table}.json`);
          await fs.writeJson(tableFile, data, { spaces: 2 });
        }
      }

      // Create backup manifest
      const manifest = {
        backupId,
        backupName,
        timestamp: new Date().toISOString(),
        type: 'incremental',
        lastBackupTime,
        version: '1.0.0',
        tables: Object.keys(backupData).map((table) => ({
          name: table,
          recordCount: backupData[table].length,
          file: `${table}.json`
        })),
        totalRecords: Object.values(backupData).reduce((sum, records) => sum + records.length, 0)
      };

      const manifestFile = path.join(backupDir, 'manifest.json');
      await fs.writeJson(manifestFile, manifest, { spaces: 2 });

      // Only create backup if there are changes
      if (manifest.totalRecords > 0) {
        // Compress backup
        const compressedFile = `${backupName}.tar.gz`;
        const compressedPath = path.join(process.cwd(), 'backups', compressedFile);

        await this.compressDirectory(backupDir, compressedPath);

        // Upload to S3
        const s3Key = `${this.backupPrefix}/database/${compressedFile}`;
        await this.uploadToS3(compressedPath, s3Key);

        // Clean up local files
        await fs.remove(backupDir);
        await fs.remove(compressedPath);

        logger.info('Incremental database backup completed', {
          backupId,
          s3Key,
          totalRecords: manifest.totalRecords
        });

        return {
          success: true,
          backupId,
          backupName,
          s3Key,
          manifest
        };
      } else {
        // No changes, clean up and return
        await fs.remove(backupDir);

        logger.info('No changes detected, skipping incremental backup', { backupId });

        return {
          success: true,
          backupId,
          backupName,
          s3Key: null,
          manifest,
          message: 'No changes detected'
        };
      }

    } catch (error) {
      logger.error('Incremental database backup failed', { error: error.message, backupId });
      throw error;
    }
  }

  /**
   * Restore database from backup
   * @param {string} backupId - Backup ID
   * @param {Object} options - Restore options
   * @returns {Promise<Object>} Restore result
   */
  async restoreFromBackup(backupId, options = {}) {
    const {
      dryRun = false,
      tables = null, // Specific tables to restore
      skipConflicts = false
    } = options;

    logger.info('Starting database restore', { backupId, dryRun, tables });

    try {
      // Download backup from S3
      const backupFile = await this.downloadBackup(backupId);

      // Extract backup
      const backupDir = path.join(process.cwd(), 'backups', `restore-${backupId}`);
      await this.extractBackup(backupFile, backupDir);

      // Read manifest
      const manifestFile = path.join(backupDir, 'manifest.json');
      const manifest = await fs.readJson(manifestFile);

      logger.info('Backup manifest loaded', {
        backupName: manifest.backupName,
        totalRecords: manifest.totalRecords,
        tables: manifest.tables.length
      });

      if (dryRun) {
        logger.info('Dry run completed', { manifest });
        return {
          success: true,
          dryRun: true,
          manifest
        };
      }

      // Restore tables
      const restoreResults = {};

      for (const tableInfo of manifest.tables) {
        if (tables && !tables.includes(tableInfo.name)) {
          continue;
        }

        logger.info(`Restoring table: ${tableInfo.name}`);

        const tableFile = path.join(backupDir, tableInfo.file);
        const tableData = await fs.readJson(tableFile);

        if (tableData.length === 0) {
          restoreResults[tableInfo.name] = { records: 0, status: 'skipped' };
          continue;
        }

        try {
          // Clear existing data if not skipping conflicts
          if (!skipConflicts) {
            await this.supabase
              .from(tableInfo.name)
              .delete()
              .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all records
          }

          // Insert backup data
          const { error } = await this.supabase
            .from(tableInfo.name)
            .insert(tableData);

          if (error) {
            throw new Error(`Failed to restore table ${tableInfo.name}: ${error.message}`);
          }

          restoreResults[tableInfo.name] = {
            records: tableData.length,
            status: 'success'
          };

          logger.info(`Table restored successfully: ${tableInfo.name}`, {
            records: tableData.length
          });

        } catch (error) {
          logger.error(`Failed to restore table: ${tableInfo.name}`, { error: error.message });
          restoreResults[tableInfo.name] = {
            records: 0,
            status: 'failed',
            error: error.message
          };
        }
      }

      // Clean up
      await fs.remove(backupDir);
      await fs.remove(backupFile);

      logger.info('Database restore completed', { backupId, restoreResults });

      return {
        success: true,
        backupId,
        manifest,
        restoreResults
      };

    } catch (error) {
      logger.error('Database restore failed', { error: error.message, backupId });
      throw error;
    }
  }

  /**
   * List available backups
   * @param {Object} options - List options
   * @returns {Promise<Array>} Backup list
   */
  async listBackups(options = {}) {
    const { limit = 50, prefix = 'database/' } = options;

    try {
      const params = {
        Bucket: this.backupBucket,
        Prefix: `${this.backupPrefix}/${prefix}`,
        MaxKeys: limit
      };

      const result = await this.s3.listObjectsV2(params).promise();

      const backups = result.Contents.map((item) => ({
        key: item.Key,
        size: item.Size,
        lastModified: item.LastModified,
        name: item.Key.split('/').pop()
      }));

      logger.info('Backups listed successfully', { count: backups.length });

      return backups;

    } catch (error) {
      logger.error('Failed to list backups', { error: error.message });
      throw error;
    }
  }

  /**
   * Delete backup
   * @param {string} backupKey - Backup S3 key
   * @returns {Promise<boolean>} Delete success
   */
  async deleteBackup(backupKey) {
    try {
      await this.s3.deleteObject({
        Bucket: this.backupBucket,
        Key: backupKey
      }).promise();

      logger.info('Backup deleted successfully', { backupKey });
      return true;

    } catch (error) {
      logger.error('Failed to delete backup', { error: error.message, backupKey });
      throw error;
    }
  }

  // Helper methods
  async compressDirectory(sourceDir, outputPath) {
    const { exec } = require('child_process');
    const { promisify } = require('util');
    const execAsync = promisify(exec);

    await execAsync(`tar -czf "${outputPath}" -C "${path.dirname(sourceDir)}" "${path.basename(sourceDir)}"`);
  }

  async extractBackup(backupFile, extractDir) {
    const { exec } = require('child_process');
    const { promisify } = require('util');
    const execAsync = promisify(exec);

    await fs.ensureDir(extractDir);
    await execAsync(`tar -xzf "${backupFile}" -C "${extractDir}"`);
  }

  async uploadToS3(filePath, s3Key) {
    const fileContent = await fs.readFile(filePath);

    await this.s3.putObject({
      Bucket: this.backupBucket,
      Key: s3Key,
      Body: fileContent,
      ServerSideEncryption: 'AES256'
    }).promise();
  }

  async downloadBackup(backupId) {
    // Find backup file
    const backups = await this.listBackups();
    const backup = backups.find((b) => b.name.includes(backupId));

    if (!backup) {
      throw new Error(`Backup not found: ${backupId}`);
    }

    // Download backup
    const downloadPath = path.join(process.cwd(), 'backups', backup.name);
    await fs.ensureDir(path.dirname(downloadPath));

    const result = await this.s3.getObject({
      Bucket: this.backupBucket,
      Key: backup.key
    }).promise();

    await fs.writeFile(downloadPath, result.Body);

    return downloadPath;
  }
}

// CLI interface
if (require.main === module) {
  const command = process.argv[2];
  const backupService = new BackupService();

  async function runCommand() {
    try {
      switch (command) {
        case 'full':
          const fullResult = await backupService.createFullBackup();
          console.log('Full backup completed:', fullResult);
          break;

        case 'incremental':
          const lastBackupTime = process.argv[3];
          if (!lastBackupTime) {
            throw new Error('Last backup time is required for incremental backup');
          }
          const incResult = await backupService.createIncrementalBackup(lastBackupTime);
          console.log('Incremental backup completed:', incResult);
          break;

        case 'restore':
          const backupId = process.argv[3];
          if (!backupId) {
            throw new Error('Backup ID is required for restore');
          }
          const restoreResult = await backupService.restoreFromBackup(backupId);
          console.log('Restore completed:', restoreResult);
          break;

        case 'list':
          const backups = await backupService.listBackups();
          console.log('Available backups:', backups);
          break;

        default:
          console.log('Usage: node backup.js [full|incremental|restore|list] [options]');
          process.exit(1);
      }
    } catch (error) {
      console.error('Backup operation failed:', error.message);
      process.exit(1);
    }
  }

  runCommand();
}

module.exports = BackupService;
