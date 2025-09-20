const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { authenticate } = require('../middleware/auth');
const { validators, fileSchemas, validateJoi } = require('../middleware/validation');
const { asyncHandler, sendSuccessResponse, sendErrorResponse } = require('../middleware/errorHandler');
const s3Service = require('../services/s3Service');
const databaseService = require('../services/databaseService');
const logger = require('../utils/logger');

/**
 * @swagger
 * /api/files/upload:
 *   post:
 *     summary: Upload files to S3
 *     tags: [Files]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               files:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Files to upload
 *               batchId:
 *                 type: integer
 *                 description: Associated batch ID
 *               category:
 *                 type: string
 *                 enum: [compliance, evidence, documentation, other]
 *                 default: other
 *                 description: File category
 *               description:
 *                 type: string
 *                 description: File description
 *     responses:
 *       201:
 *         description: Files uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/File'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.post('/upload',
  authenticate,
  s3Service.getUploadMiddleware('files', 5),
  validateJoi(fileSchemas.upload),
  asyncHandler(async (req, res) => {
    if (!req.files || req.files.length === 0) {
      return sendErrorResponse(res, 'No files uploaded', 400, 'NO_FILES');
    }

    const { batchId, category = 'other', description } = req.body;
    const uploadedFiles = [];

    for (const file of req.files) {
      try {
        // Generate unique file ID
        const fileId = uuidv4();

        // Upload file to S3
        const uploadResult = await s3Service.uploadFile(file, {
          fileId,
          batchId: batchId ? parseInt(batchId) : null,
          category,
          description,
          uploadedBy: req.user.id
        });

        // Save file record to database
        const fileData = {
          file_id: fileId,
          batch_id: batchId ? parseInt(batchId) : null,
          category,
          original_name: file.originalname,
          file_name: uploadResult.fileName,
          s3_key: uploadResult.key,
          s3_bucket: uploadResult.bucket,
          content_type: file.mimetype,
          file_size: file.size,
          description: description || null,
          uploaded_by: req.user.address,
          metadata: {
            s3Location: uploadResult.location,
            uploadedAt: new Date().toISOString()
          }
        };

        const dbFile = await databaseService.createFileRecord(fileData);

        uploadedFiles.push({
          id: dbFile.id,
          fileId: dbFile.file_id,
          originalName: dbFile.original_name,
          fileName: dbFile.file_name,
          contentType: dbFile.content_type,
          fileSize: dbFile.file_size,
          category: dbFile.category,
          description: dbFile.description,
          uploadedAt: dbFile.created_at,
          s3Location: uploadResult.location
        });

        logger.audit('upload_file', 'file', req.user.id, {
          fileId,
          originalName: file.originalname,
          category,
          batchId
        });
      } catch (error) {
        logger.error('File upload error:', error);
        // Continue with other files even if one fails
      }
    }

    if (uploadedFiles.length === 0) {
      return sendErrorResponse(res, 'All file uploads failed', 500, 'UPLOAD_FAILED');
    }

    sendSuccessResponse(res, uploadedFiles, 'Files uploaded successfully', 201);
  })
);

/**
 * @swagger
 * /api/files/{fileId}:
 *   get:
 *     summary: Get file by ID
 *     tags: [Files]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: fileId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: File ID
 *     responses:
 *       200:
 *         description: File retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/File'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/:fileId',
  authenticate,
  validators.validateFileId,
  asyncHandler(async (req, res) => {
    const { fileId } = req.params;

    const file = await databaseService.getFile(fileId);
    if (!file) {
      return sendErrorResponse(res, 'File not found', 404, 'FILE_NOT_FOUND');
    }

    // Check if user has access to this file
    if (file.uploaded_by !== req.user.address && req.user.role !== 'admin') {
      return sendErrorResponse(res, 'Access denied', 403, 'ACCESS_DENIED');
    }

    sendSuccessResponse(res, {
      id: file.id,
      fileId: file.file_id,
      originalName: file.original_name,
      fileName: file.file_name,
      contentType: file.content_type,
      fileSize: file.file_size,
      category: file.category,
      description: file.description,
      batchId: file.batch_id,
      uploadedBy: file.uploaded_by,
      uploadedAt: file.created_at,
      metadata: file.metadata
    }, 'File retrieved successfully');
  })
);

/**
 * @swagger
 * /api/files/{fileId}/download:
 *   get:
 *     summary: Download file from S3
 *     tags: [Files]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: fileId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: File ID
 *     responses:
 *       200:
 *         description: File downloaded successfully
 *         content:
 *           application/octet-stream:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/:fileId/download',
  authenticate,
  validators.validateFileId,
  asyncHandler(async (req, res) => {
    const { fileId } = req.params;

    const file = await databaseService.getFile(fileId);
    if (!file) {
      return sendErrorResponse(res, 'File not found', 404, 'FILE_NOT_FOUND');
    }

    // Check if user has access to this file
    if (file.uploaded_by !== req.user.address && req.user.role !== 'admin') {
      return sendErrorResponse(res, 'Access denied', 403, 'ACCESS_DENIED');
    }

    try {
      // Download file from S3
      const fileData = await s3Service.downloadFile(file.s3_key);

      // Set response headers
      res.setHeader('Content-Type', file.content_type);
      res.setHeader('Content-Length', fileData.contentLength);
      res.setHeader('Content-Disposition', `attachment; filename="${file.original_name}"`);
      res.setHeader('Last-Modified', fileData.lastModified);

      // Send file data
      res.send(fileData.body);

      logger.audit('download_file', 'file', req.user.id, {
        fileId,
        originalName: file.original_name
      });
    } catch (error) {
      logger.error('File download error:', error);
      return sendErrorResponse(res, 'Failed to download file', 500, 'DOWNLOAD_FAILED');
    }
  })
);

/**
 * @swagger
 * /api/files/{fileId}/url:
 *   get:
 *     summary: Get pre-signed URL for file access
 *     tags: [Files]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: fileId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: File ID
 *       - in: query
 *         name: expiresIn
 *         schema:
 *           type: integer
 *           default: 3600
 *         description: URL expiration time in seconds
 *     responses:
 *       200:
 *         description: Pre-signed URL generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     url:
 *                       type: string
 *                     expiresAt:
 *                       type: string
 *                       format: date-time
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/:fileId/url',
  authenticate,
  validators.validateFileId,
  asyncHandler(async (req, res) => {
    const { fileId } = req.params;
    const expiresIn = parseInt(req.query.expiresIn) || 3600;

    const file = await databaseService.getFile(fileId);
    if (!file) {
      return sendErrorResponse(res, 'File not found', 404, 'FILE_NOT_FOUND');
    }

    // Check if user has access to this file
    if (file.uploaded_by !== req.user.address && req.user.role !== 'admin') {
      return sendErrorResponse(res, 'Access denied', 403, 'ACCESS_DENIED');
    }

    try {
      // Generate pre-signed URL
      const url = await s3Service.generatePresignedUrl(file.s3_key, expiresIn);
      const expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();

      logger.audit('generate_file_url', 'file', req.user.id, {
        fileId,
        expiresIn
      });

      sendSuccessResponse(res, {
        url,
        expiresAt
      }, 'Pre-signed URL generated successfully');
    } catch (error) {
      logger.error('Pre-signed URL generation error:', error);
      return sendErrorResponse(res, 'Failed to generate pre-signed URL', 500, 'URL_GENERATION_FAILED');
    }
  })
);

/**
 * @swagger
 * /api/files/batches/{batchId}:
 *   get:
 *     summary: Get files by batch ID
 *     tags: [Files]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: batchId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Batch ID
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           enum: [compliance, evidence, documentation, other]
 *         description: Filter by file category
 *     responses:
 *       200:
 *         description: Files retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/File'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/batches/:batchId',
  authenticate,
  validators.validateBatchId,
  asyncHandler(async (req, res) => {
    const { batchId } = req.params;
    const { category } = req.query;

    let query = databaseService.getClient()
      .from('files')
      .select('*')
      .eq('batch_id', batchId);

    if (category) {
      query = query.eq('category', category);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;

    const files = (data || []).map((file) => ({
      id: file.id,
      fileId: file.file_id,
      originalName: file.original_name,
      fileName: file.file_name,
      contentType: file.content_type,
      fileSize: file.file_size,
      category: file.category,
      description: file.description,
      uploadedBy: file.uploaded_by,
      uploadedAt: file.created_at,
      metadata: file.metadata
    }));

    sendSuccessResponse(res, files, 'Files retrieved successfully');
  })
);

/**
 * @swagger
 * /api/files:
 *   get:
 *     summary: Get user's files
 *     tags: [Files]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Number of items per page
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           enum: [compliance, evidence, documentation, other]
 *         description: Filter by file category
 *     responses:
 *       200:
 *         description: Files retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/File'
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/',
  authenticate,
  validators.validatePagination,
  asyncHandler(async (req, res) => {
    const {
      page = 1,
      limit = 10,
      category
    } = req.query;

    let query = databaseService.getClient()
      .from('files')
      .select('*', { count: 'exact' })
      .eq('uploaded_by', req.user.address);

    if (category) {
      query = query.eq('category', category);
    }

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (error) throw error;

    const files = (data || []).map((file) => ({
      id: file.id,
      fileId: file.file_id,
      originalName: file.original_name,
      fileName: file.file_name,
      contentType: file.content_type,
      fileSize: file.file_size,
      category: file.category,
      description: file.description,
      batchId: file.batch_id,
      uploadedAt: file.created_at,
      metadata: file.metadata
    }));

    sendSuccessResponse(res, {
      data: files,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count || 0,
        pages: Math.ceil((count || 0) / limit)
      }
    }, 'Files retrieved successfully');
  })
);

/**
 * @swagger
 * /api/files/{fileId}:
 *   delete:
 *     summary: Delete file
 *     tags: [Files]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: fileId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: File ID
 *     responses:
 *       200:
 *         description: File deleted successfully
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.delete('/:fileId',
  authenticate,
  validators.validateFileId,
  asyncHandler(async (req, res) => {
    const { fileId } = req.params;

    const file = await databaseService.getFile(fileId);
    if (!file) {
      return sendErrorResponse(res, 'File not found', 404, 'FILE_NOT_FOUND');
    }

    // Check if user has access to this file
    if (file.uploaded_by !== req.user.address && req.user.role !== 'admin') {
      return sendErrorResponse(res, 'Access denied', 403, 'ACCESS_DENIED');
    }

    try {
      // Delete file from S3
      await s3Service.deleteFile(file.s3_key);

      // Delete file record from database
      const { error } = await databaseService.getClient()
        .from('files')
        .delete()
        .eq('file_id', fileId);

      if (error) throw error;

      logger.audit('delete_file', 'file', req.user.id, {
        fileId,
        originalName: file.original_name
      });

      sendSuccessResponse(res, null, 'File deleted successfully');
    } catch (error) {
      logger.error('File deletion error:', error);
      return sendErrorResponse(res, 'Failed to delete file', 500, 'DELETE_FAILED');
    }
  })
);

/**
 * @swagger
 * /api/files/statistics:
 *   get:
 *     summary: Get file statistics
 *     tags: [Files]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalFiles:
 *                       type: integer
 *                     totalSize:
 *                       type: string
 *                     filesByCategory:
 *                       type: object
 *                     recentUploads:
 *                       type: integer
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/statistics',
  authenticate,
  asyncHandler(async (req, res) => {
    const [
      totalFiles,
      totalSize,
      filesByCategory,
      recentUploads
    ] = await Promise.all([
      databaseService.getClient().from('files').select('id', { count: 'exact' }),
      databaseService.getClient().from('files').select('file_size'),
      databaseService.getClient().from('files').select('category'),
      databaseService.getClient()
        .from('files')
        .select('id', { count: 'exact' })
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
    ]);

    const totalSizeBytes = (totalSize.data || []).reduce((sum, file) => sum + file.file_size, 0);
    const categoryCounts = (filesByCategory.data || []).reduce((acc, file) => {
      acc[file.category] = (acc[file.category] || 0) + 1;
      return acc;
    }, {});

    sendSuccessResponse(res, {
      totalFiles: totalFiles.count || 0,
      totalSize: `${(totalSizeBytes / 1024 / 1024).toFixed(2)} MB`,
      filesByCategory: categoryCounts,
      recentUploads: recentUploads.count || 0
    }, 'File statistics retrieved successfully');
  })
);

module.exports = router;
