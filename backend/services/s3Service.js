const { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, ListObjectsV2Command, CopyObjectCommand, HeadObjectCommand, PutObjectTaggingCommand, GetObjectTaggingCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs-extra');
const { v4: uuidv4 } = require('uuid');
const config = require('../config/env');
const logger = require('../utils/logger');

class S3Service {
  constructor() {
    this.client = new S3Client({
      region: process.env.AWS_REGION
    });
    this.bucket = process.env.AWS_S3_BUCKET;
    this.maxFileSize = 100 * 1024 * 1024; // 100MB
    this.allowedFileTypes = ['pdf', 'doc', 'docx', 'txt', 'jpg', 'jpeg', 'png', 'gif'];
  }

  /**
   * Upload file to S3 with progress tracking
   * @param {Object} file - Multer file object
   * @param {Object} options - Upload options
   * @returns {Promise<Object>} Upload result
   */
  async uploadFile(file, options = {}) {
    try {
      const {
        batchId = null,
        fileType = 'OTHER',
        isPublic = false,
        metadata = {},
        folder = 'uploads'
      } = options;

      // Validate file
      this.validateFile(file);

      // Generate unique file key
      const fileKey = this.generateFileKey(file, folder, batchId);
      
      // Calculate file hash
      const fileHash = await this.calculateFileHash(file.buffer);

      // Prepare upload parameters
      const uploadParams = {
        Bucket: this.bucket,
        Key: fileKey,
        Body: file.buffer,
        ContentType: file.mimetype,
        Metadata: {
          originalName: file.originalname,
          fileType: fileType,
          batchId: batchId || '',
          uploadedAt: new Date().toISOString(),
          ...metadata
        },
        ServerSideEncryption: 'AES256',
        ACL: isPublic ? 'public-read' : 'private'
      };

      // Add tags for better organization
      const tags = {
        'FileType': fileType,
        'BatchId': batchId || 'none',
        'UploadDate': new Date().toISOString().split('T')[0]
      };

      if (batchId) {
        tags['BatchId'] = batchId;
      }

      // Upload file with progress tracking
      const uploadResult = await this.uploadWithProgress(uploadParams, file.size);

      // Add tags after upload
      await this.addFileTags(fileKey, tags);

      logger.info('File uploaded successfully', {
        fileKey,
        fileSize: file.size,
        fileType,
        batchId
      });

      return {
        success: true,
        fileKey,
        fileUrl: this.getFileUrl(fileKey, isPublic),
        fileHash,
        fileSize: file.size,
        mimeType: file.mimetype,
        metadata: uploadResult.Metadata
      };

    } catch (error) {
      logger.error('File upload failed', { error: error.message, file: file.originalname });
      throw new Error(`File upload failed: ${error.message}`);
    }
  }

  /**
   * Upload file with progress tracking
   * @param {Object} params - S3 upload parameters
   * @param {number} fileSize - File size for progress calculation
   * @returns {Promise<Object>} Upload result
   */
  async uploadWithProgress(params, fileSize) {
    try {
      const command = new PutObjectCommand(params);
      const response = await this.client.send(command);
      return response;
    } catch (error) {
      logger.error('Upload failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Download file from S3
   * @param {string} fileKey - S3 file key
   * @returns {Promise<Buffer>} File buffer
   */
  async downloadFile(fileKey) {
    try {
      const params = {
        Bucket: this.bucket,
        Key: fileKey
      };

      const result = await this.s3.getObject(params).promise();
      
      logger.info('File downloaded successfully', { fileKey, size: result.ContentLength });
      
      return result.Body;

    } catch (error) {
      logger.error('File download failed', { error: error.message, fileKey });
      throw new Error(`File download failed: ${error.message}`);
    }
  }

  /**
   * Generate pre-signed URL for file access
   * @param {string} fileKey - S3 file key
   * @param {Object} options - URL options
   * @returns {Promise<string>} Pre-signed URL
   */
  async generatePresignedUrl(fileKey, options = {}) {
    try {
      const {
        expiresIn = 3600, // 1 hour
        operation = 'getObject',
        contentType = null
      } = options;

      const params = {
        Bucket: this.bucket,
        Key: fileKey,
        Expires: expiresIn
      };

      if (contentType) {
        params.ContentType = contentType;
      }

      const url = await this.s3.getSignedUrlPromise(operation, params);
      
      logger.info('Pre-signed URL generated', { fileKey, expiresIn, operation });
      
      return url;

    } catch (error) {
      logger.error('Pre-signed URL generation failed', { error: error.message, fileKey });
      throw new Error(`Pre-signed URL generation failed: ${error.message}`);
    }
  }

  /**
   * Delete file from S3
   * @param {string} fileKey - S3 file key
   * @returns {Promise<boolean>} Delete success
   */
  async deleteFile(fileKey) {
    try {
      const params = {
        Bucket: this.bucket,
        Key: fileKey
      };

      await this.s3.deleteObject(params).promise();
      
      logger.info('File deleted successfully', { fileKey });
      
      return true;

    } catch (error) {
      logger.error('File deletion failed', { error: error.message, fileKey });
      throw new Error(`File deletion failed: ${error.message}`);
    }
  }

  /**
   * Copy file within S3
   * @param {string} sourceKey - Source file key
   * @param {string} destinationKey - Destination file key
   * @returns {Promise<Object>} Copy result
   */
  async copyFile(sourceKey, destinationKey) {
    try {
      const params = {
        Bucket: this.bucket,
        CopySource: `${this.bucket}/${sourceKey}`,
        Key: destinationKey
      };

      const result = await this.s3.copyObject(params).promise();
      
      logger.info('File copied successfully', { sourceKey, destinationKey });
      
      return result;

    } catch (error) {
      logger.error('File copy failed', { error: error.message, sourceKey, destinationKey });
      throw new Error(`File copy failed: ${error.message}`);
    }
  }

  /**
   * List files in a folder
   * @param {string} prefix - Folder prefix
   * @param {Object} options - List options
   * @returns {Promise<Array>} File list
   */
  async listFiles(prefix = '', options = {}) {
    try {
      const {
        maxKeys = 1000,
        continuationToken = null
      } = options;

      const params = {
        Bucket: this.bucket,
        Prefix: prefix,
        MaxKeys: maxKeys
      };

      if (continuationToken) {
        params.ContinuationToken = continuationToken;
      }

      const result = await this.s3.listObjectsV2(params).promise();
      const files = result.Contents.map(item => ({
        key: item.Key,
        size: item.Size,
        lastModified: item.LastModified,
        etag: item.ETag,
        storageClass: item.StorageClass
      }));

      logger.info('Files listed successfully', { prefix, count: files.length });
      return {
        files,
        isTruncated: result.IsTruncated,
        nextContinuationToken: result.NextContinuationToken
      };
    } catch (error) {
      throw new Error(`File listing failed: ${error.message}`);
    }
  }

  /**
   * Get file metadata
   * @param {string} fileKey - S3 file key
   * @returns {Promise<Object>} File metadata
   */
  async getFileMetadata(fileKey) {
    try {
      const params = {
        Bucket: this.bucket,
        Key: fileKey
      };

      const result = await this.s3.headObject(params).promise();
      
      return {
        key: fileKey,
        size: result.ContentLength,
        lastModified: result.LastModified,
        etag: result.ETag,
        contentType: result.ContentType,
        metadata: result.Metadata,
        storageClass: result.StorageClass
      };

    } catch (error) {
      logger.error('File metadata retrieval failed', { error: error.message, fileKey });
      throw new Error(`File metadata retrieval failed: ${error.message}`);
    }
  }

  /**
   * Create backup of files
   * @param {Array} fileKeys - Array of file keys to backup
   * @param {string} backupPrefix - Backup folder prefix
   * @returns {Promise<Object>} Backup result
   */
  async createBackup(fileKeys, backupPrefix = 'backups') {
    try {
      const backupId = uuidv4();
      const backupFolder = `${backupPrefix}/${backupId}`;
      const results = [];

      for (const fileKey of fileKeys) {
        const backupKey = `${backupFolder}/${fileKey}`;
        await this.copyFile(fileKey, backupKey);
        results.push({ originalKey: fileKey, backupKey });
      }

      logger.info('Backup created successfully', { backupId, fileCount: fileKeys.length });
      
      return {
        success: true,
        backupId,
        backupFolder,
        results
      };

    } catch (error) {
      logger.error('Backup creation failed', { error: error.message });
      throw new Error(`Backup creation failed: ${error.message}`);
    }
  }

  /**
   * Restore files from backup
   * @param {string} backupId - Backup ID
   * @param {string} backupPrefix - Backup folder prefix
   * @returns {Promise<Object>} Restore result
   */
  async restoreFromBackup(backupId, backupPrefix = 'backups') {
    try {
      const backupFolder = `${backupPrefix}/${backupId}`;
      const backupFiles = await this.listFiles(backupFolder);
      const results = [];

      for (const file of backupFiles.files) {
        const originalKey = file.key.replace(`${backupFolder}/`, '');
        await this.copyFile(file.key, originalKey);
        results.push({ backupKey: file.key, originalKey });
      }

      logger.info('Backup restored successfully', { backupId, fileCount: results.length });
      
      return {
        success: true,
        backupId,
        restoredFiles: results
      };

    } catch (error) {
      logger.error('Backup restore failed', { error: error.message, backupId });
      throw new Error(`Backup restore failed: ${error.message}`);
    }
  }

  /**
   * Validate file before upload
   * @param {Object} file - Multer file object
   * @throws {Error} If file is invalid
   */
  validateFile(file) {
    if (!file) {
      throw new Error('No file provided');
    }

    if (file.size > this.maxFileSize) {
      throw new Error(`File size exceeds maximum allowed size of ${this.maxFileSize} bytes`);
    }

    const fileExtension = path.extname(file.originalname).toLowerCase().substring(1);
    if (!this.allowedFileTypes.includes(fileExtension)) {
      throw new Error(`File type .${fileExtension} is not allowed. Allowed types: ${this.allowedFileTypes.join(', ')}`);
    }
  }

  /**
   * Generate unique file key
   * @param {Object} file - Multer file object
   * @param {string} folder - Folder name
   * @param {string} batchId - Batch ID
   * @returns {string} File key
   */
  generateFileKey(file, folder, batchId) {
    const timestamp = Date.now();
    const randomId = uuidv4().substring(0, 8);
    const extension = path.extname(file.originalname);
    const fileName = path.basename(file.originalname, extension);
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9-_]/g, '_');
    
    if (batchId) {
      return `${folder}/batches/${batchId}/${timestamp}_${randomId}_${sanitizedFileName}${extension}`;
    }
    
    return `${folder}/${timestamp}_${randomId}_${sanitizedFileName}${extension}`;
  }

  /**
   * Calculate file hash
   * @param {Buffer} buffer - File buffer
   * @returns {Promise<string>} File hash
   */
  async calculateFileHash(buffer) {
    return crypto.createHash('sha256').update(buffer).digest('hex');
  }

  /**
   * Get file URL
   * @param {string} fileKey - S3 file key
   * @param {boolean} isPublic - Whether file is public
   * @returns {string} File URL
   */
  getFileUrl(fileKey, isPublic = false) {
    if (isPublic) {
      return `https://${this.bucket}.s3.${config.aws.region}.amazonaws.com/${fileKey}`;
    }
    return `s3://${this.bucket}/${fileKey}`;
  }

  /**
   * Add tags to file
   * @param {string} fileKey - S3 file key
   * @param {Object} tags - Tags to add
   * @returns {Promise<Object>} Tag result
   */
  async addFileTags(fileKey, tags) {
    try {
      const params = {
        Bucket: this.bucket,
        Key: fileKey,
        Tagging: {
          TagSet: Object.entries(tags).map(([Key, Value]) => ({ Key, Value }))
        }
      };

      await this.s3.putObjectTagging(params).promise();
      
      logger.info('File tags added successfully', { fileKey, tags });
      
      return { success: true };

    } catch (error) {
      logger.error('File tagging failed', { error: error.message, fileKey });
      throw new Error(`File tagging failed: ${error.message}`);
    }
  }

  /**
   * Get file tags
   * @param {string} fileKey - S3 file key
   * @returns {Promise<Object>} File tags
   */
  async getFileTags(fileKey) {
    try {
      const params = {
        Bucket: this.bucket,
        Key: fileKey
      };

      const result = await this.s3.getObjectTagging(params).promise();
      
      const tags = {};
      result.TagSet.forEach(tag => {
        tags[tag.Key] = tag.Value;
      });

      return tags;

    } catch (error) {
      logger.error('File tags retrieval failed', { error: error.message, fileKey });
      throw new Error(`File tags retrieval failed: ${error.message}`);
    }
  }
}

const s3ServiceInstance = new S3Service();
s3ServiceInstance.getUploadMiddleware = getUploadMiddleware;
s3ServiceInstance.upload = upload;
module.exports = s3ServiceInstance;