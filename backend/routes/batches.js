const express = require('express');
const router = express.Router();
const { authenticate, authorize, checkOwnership } = require('../middleware/auth');
const { validators, batchSchemas, validateJoi } = require('../middleware/validation');
const { asyncHandler, sendSuccessResponse, sendErrorResponse } = require('../middleware/errorHandler');
const blockchainService = require('../services/blockchainService');
const databaseService = require('../services/databaseService');
const logger = require('../utils/logger');

/**
 * @swagger
 * /api/batches:
 *   get:
 *     summary: Get all batches with pagination
 *     tags: [Batches]
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
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [createdAt, updatedAt, batchId, status]
 *           default: createdAt
 *         description: Field to sort by
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort order
 *       - in: query
 *         name: owner
 *         schema:
 *           type: string
 *         description: Filter by owner address
 *       - in: query
 *         name: status
 *         schema:
 *           type: integer
 *           minimum: 0
 *           maximum: 10
 *         description: Filter by batch status
 *     responses:
 *       200:
 *         description: Batches retrieved successfully
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
 *                     $ref: '#/components/schemas/Batch'
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
    const options = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 10,
      sortBy: req.query.sortBy || 'created_at',
      sortOrder: req.query.sortOrder || 'desc',
      owner: req.query.owner,
      status: req.query.status ? parseInt(req.query.status) : null
    };

    const result = await databaseService.getBatches(options);

    sendSuccessResponse(res, result, 'Batches retrieved successfully');
  })
);

/**
 * @swagger
 * /api/batches/{batchId}:
 *   get:
 *     summary: Get batch by ID
 *     tags: [Batches]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: batchId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Batch ID
 *     responses:
 *       200:
 *         description: Batch retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Batch'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/:batchId',
  authenticate,
  validators.validateBatchId,
  asyncHandler(async (req, res) => {
    const { batchId } = req.params;

    // Get batch from blockchain
    const blockchainBatch = await blockchainService.getBatch(batchId);

    // Get batch from database for additional metadata
    let dbBatch = null;
    try {
      dbBatch = await databaseService.getBatch(batchId);
    } catch (error) {
      // Database batch not found, use blockchain data only
      logger.warn(`Database batch not found for ID ${batchId}, using blockchain data only`);
    }

    const batch = {
      ...blockchainBatch,
      ...dbBatch,
      // Ensure blockchain data takes precedence
      batchId: blockchainBatch.batchId,
      drugName: blockchainBatch.drugName,
      drugCode: blockchainBatch.drugCode,
      manufacturer: blockchainBatch.manufacturer,
      currentOwner: blockchainBatch.currentOwner,
      status: blockchainBatch.status
    };

    sendSuccessResponse(res, batch, 'Batch retrieved successfully');
  })
);

/**
 * @swagger
 * /api/batches:
 *   post:
 *     summary: Create new batch
 *     tags: [Batches]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateBatchRequest'
 *     responses:
 *       201:
 *         description: Batch created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Batch'
 *                 transaction:
 *                   $ref: '#/components/schemas/Transaction'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.post('/',
  authenticate,
  authorize(['manufacturer', 'admin']),
  validateJoi(batchSchemas.create),
  asyncHandler(async (req, res) => {
    const batchData = req.body;

    // Create batch on blockchain
    const transaction = await blockchainService.createBatch(batchData);

    // Save batch to database
    const dbBatchData = {
      batch_id: parseInt(transaction.batchId),
      drug_name: batchData.drugName,
      drug_code: batchData.drugCode,
      manufacturer: batchData.manufacturer,
      manufacture_date: batchData.manufactureDate,
      expiry_date: batchData.expiryDate,
      quantity: batchData.quantity,
      status: 0, // CREATED
      current_owner: req.user.address,
      serial_numbers: batchData.serialNumbers,
      metadata: batchData.metadata || {}
    };

    const dbBatch = await databaseService.createBatch(dbBatchData);

    // Get complete batch data
    const completeBatch = await blockchainService.getBatch(transaction.batchId);

    logger.audit('create_batch', 'batch', req.user.id, {
      batchId: transaction.batchId,
      drugName: batchData.drugName,
      txHash: transaction.txHash
    });

    sendSuccessResponse(res, {
      ...completeBatch,
      ...dbBatch,
      transaction
    }, 'Batch created successfully', 201);
  })
);

/**
 * @swagger
 * /api/batches/{batchId}/transfer:
 *   put:
 *     summary: Transfer batch ownership
 *     tags: [Batches]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: batchId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Batch ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/TransferBatchRequest'
 *     responses:
 *       200:
 *         description: Batch transferred successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Transaction'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.put('/:batchId/transfer',
  authenticate,
  validators.validateBatchId,
  validateJoi(batchSchemas.transfer),
  asyncHandler(async (req, res) => {
    const { batchId } = req.params;
    const transferData = req.body;

    // Verify batch ownership
    const batch = await blockchainService.getBatch(batchId);
    if (batch.currentOwner.toLowerCase() !== req.user.address.toLowerCase()) {
      return sendErrorResponse(res, 'You do not own this batch', 403, 'BATCH_OWNERSHIP_REQUIRED');
    }

    // Transfer batch on blockchain
    const transaction = await blockchainService.transferBatch(batchId, transferData);

    // Update database
    await databaseService.updateBatch(batchId, {
      current_owner: transferData.to
    });

    // Record transfer in database
    const transferRecord = {
      batch_id: parseInt(batchId),
      from_address: req.user.address,
      to_address: transferData.to,
      reason: transferData.reason,
      location: transferData.location,
      notes: transferData.notes
    };

    await databaseService.getClient()
      .from('batch_transfers')
      .insert([transferRecord]);

    logger.audit('transfer_batch', 'batch', req.user.id, {
      batchId,
      from: req.user.address,
      to: transferData.to,
      txHash: transaction.txHash
    });

    sendSuccessResponse(res, { transaction }, 'Batch transferred successfully');
  })
);

/**
 * @swagger
 * /api/batches/{batchId}/status:
 *   put:
 *     summary: Update batch status
 *     tags: [Batches]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: batchId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Batch ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateBatchStatusRequest'
 *     responses:
 *       200:
 *         description: Batch status updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Transaction'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.put('/:batchId/status',
  authenticate,
  authorize(['manufacturer', 'distributor', 'pharmacy', 'regulator', 'admin']),
  validators.validateBatchId,
  validateJoi(batchSchemas.updateStatus),
  asyncHandler(async (req, res) => {
    const { batchId } = req.params;
    const { status, reason } = req.body;

    // Update batch status on blockchain
    const transaction = await blockchainService.updateBatchStatus(batchId, status, reason);

    // Update database
    await databaseService.updateBatch(batchId, {
      status: status
    });

    logger.audit('update_batch_status', 'batch', req.user.id, {
      batchId,
      status,
      reason,
      txHash: transaction.txHash
    });

    sendSuccessResponse(res, { transaction }, 'Batch status updated successfully');
  })
);

/**
 * @swagger
 * /api/batches/{batchId}/metadata:
 *   put:
 *     summary: Update batch metadata
 *     tags: [Batches]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: batchId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Batch ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateBatchMetadataRequest'
 *     responses:
 *       200:
 *         description: Batch metadata updated successfully
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.put('/:batchId/metadata',
  authenticate,
  checkOwnership('batchId'),
  validators.validateBatchId,
  validateJoi(batchSchemas.updateMetadata),
  asyncHandler(async (req, res) => {
    const { batchId } = req.params;
    const { metadata } = req.body;

    // Update metadata in database
    await databaseService.updateBatch(batchId, {
      metadata: metadata
    });

    logger.audit('update_batch_metadata', 'batch', req.user.id, {
      batchId,
      metadata
    });

    sendSuccessResponse(res, { metadata }, 'Batch metadata updated successfully');
  })
);

/**
 * @swagger
 * /api/batches/{batchId}/transfers:
 *   get:
 *     summary: Get batch transfer history
 *     tags: [Batches]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: batchId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Batch ID
 *     responses:
 *       200:
 *         description: Transfer history retrieved successfully
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
 *                     $ref: '#/components/schemas/BatchTransfer'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/:batchId/transfers',
  authenticate,
  validators.validateBatchId,
  asyncHandler(async (req, res) => {
    const { batchId } = req.params;

    const { data, error } = await databaseService.getClient()
      .from('batch_transfers')
      .select('*')
      .eq('batch_id', batchId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    sendSuccessResponse(res, data || [], 'Transfer history retrieved successfully');
  })
);

/**
 * @swagger
 * /api/batches/statistics:
 *   get:
 *     summary: Get batch statistics
 *     tags: [Batches]
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
 *                     totalBatches:
 *                       type: integer
 *                     totalComplianceRecords:
 *                       type: integer
 *                     totalFiles:
 *                       type: integer
 *                     totalWallets:
 *                       type: integer
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/statistics',
  authenticate,
  asyncHandler(async (req, res) => {
    const stats = await databaseService.getStatistics();

    sendSuccessResponse(res, stats, 'Statistics retrieved successfully');
  })
);

module.exports = router;
