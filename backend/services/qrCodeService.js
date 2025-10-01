const QRCode = require('qrcode');
const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');
const logger = require('../utils/logger');

class QRCodeService {
  constructor() {
    this.qrCodeDir = path.join(__dirname, '../uploads/qr-codes');
    this.ensureDirectoryExists();
  }

  async ensureDirectoryExists() {
    try {
      await fs.mkdir(this.qrCodeDir, { recursive: true });
    } catch (error) {
      logger.error('Failed to create QR code directory:', error);
    }
  }

  /**
   * Generate a unique QR code for a batch
   * @param {Object} batchData - Batch information
   * @param {string} batchData.batchId - Unique batch ID
   * @param {string} batchData.drugName - Name of the drug
   * @param {string} batchData.manufacturer - Manufacturer address
   * @param {string} baseUrl - Base URL for the application
   * @returns {Object} QR code data and file path
   */
  async generateBatchQRCode(batchData, baseUrl = 'https://pharbit.com') {
    try {
      const { batchId, drugName, manufacturer } = batchData;
      
      // Create unique QR code data
      const qrData = {
        batchId: batchId.toString(),
        drugName,
        manufacturer,
        timestamp: Date.now(),
        type: 'pharmaceutical_batch',
        version: '1.0'
      };

      // Create a unique URL for the batch
      const batchUrl = `${baseUrl}/verify/${batchId}`;
      
      // Generate QR code data string
      const qrDataString = JSON.stringify(qrData);
      
      // Generate hash for verification
      const qrHash = crypto.createHash('sha256').update(qrDataString).digest('hex');
      
      // Generate QR code image
      const qrCodeOptions = {
        type: 'png',
        quality: 0.92,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        },
        width: 300
      };

      // Create filename with batch ID and hash
      const filename = `batch_${batchId}_${qrHash.substring(0, 8)}.png`;
      const filePath = path.join(this.qrCodeDir, filename);

      // Generate QR code image
      await QRCode.toFile(filePath, batchUrl, qrCodeOptions);

      // Generate QR code as data URL for immediate display
      const qrDataUrl = await QRCode.toDataURL(batchUrl, qrCodeOptions);

      logger.info(`QR code generated for batch ${batchId}`, {
        batchId,
        filePath,
        qrHash
      });

      return {
        qrData: qrDataString,
        qrDataUrl,
        imagePath: filePath,
        qrHash,
        batchUrl,
        generatedAt: new Date().toISOString()
      };

    } catch (error) {
      logger.error('Failed to generate QR code:', error);
      throw new Error('QR code generation failed');
    }
  }

  /**
   * Generate QR code for batch verification
   * @param {string} batchId - Batch ID to verify
   * @param {string} baseUrl - Base URL for the application
   * @returns {Object} QR code data for verification
   */
  async generateVerificationQRCode(batchId, baseUrl = 'https://pharbit.com') {
    try {
      const verificationUrl = `${baseUrl}/verify/${batchId}`;
      
      const qrCodeOptions = {
        type: 'png',
        quality: 0.92,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        },
        width: 200
      };

      // Generate QR code as data URL
      const qrDataUrl = await QRCode.toDataURL(verificationUrl, qrCodeOptions);

      return {
        qrDataUrl,
        verificationUrl,
        generatedAt: new Date().toISOString()
      };

    } catch (error) {
      logger.error('Failed to generate verification QR code:', error);
      throw new Error('Verification QR code generation failed');
    }
  }

  /**
   * Validate QR code data
   * @param {string} qrDataString - QR code data string
   * @param {string} expectedHash - Expected hash for verification
   * @returns {boolean} Whether QR code is valid
   */
  validateQRCode(qrDataString, expectedHash) {
    try {
      const actualHash = crypto.createHash('sha256').update(qrDataString).digest('hex');
      return actualHash === expectedHash;
    } catch (error) {
      logger.error('Failed to validate QR code:', error);
      return false;
    }
  }

  /**
   * Parse QR code data
   * @param {string} qrDataString - QR code data string
   * @returns {Object} Parsed QR code data
   */
  parseQRCodeData(qrDataString) {
    try {
      return JSON.parse(qrDataString);
    } catch (error) {
      logger.error('Failed to parse QR code data:', error);
      return null;
    }
  }

  /**
   * Delete QR code file
   * @param {string} filePath - Path to QR code file
   */
  async deleteQRCodeFile(filePath) {
    try {
      await fs.unlink(filePath);
      logger.info(`QR code file deleted: ${filePath}`);
    } catch (error) {
      logger.error('Failed to delete QR code file:', error);
    }
  }

  /**
   * Get QR code file path
   * @param {string} batchId - Batch ID
   * @param {string} qrHash - QR code hash
   * @returns {string} File path
   */
  getQRCodeFilePath(batchId, qrHash) {
    const filename = `batch_${batchId}_${qrHash.substring(0, 8)}.png`;
    return path.join(this.qrCodeDir, filename);
  }
}

module.exports = new QRCodeService();