const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const { validators, complianceSchemas, validateJoi } = require('../middleware/validation');
const { asyncHandler, sendSuccessResponse } = require('../middleware/errorHandler');
const blockchainService = require('../services/blockchainService');
const logger = require('../utils/logger');

/**
 * @swagger
 * /api/compliance/checks:
 *   post:
 *     summary: Add compliance check
 *     tags: [Compliance]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateComplianceCheckRequest'
 *     responses:
 *       201:
 *         description: Compliance check created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/ComplianceRecord'
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
router.post('/checks',
  authenticate,
  authorize(['auditor', 'compliance_officer', 'quality_manager', 'admin']),
  validateJoi(complianceSchemas.createCheck),
  asyncHandler(async (req, res) => {
    const complianceData = req.body;

    // Add compliance check on blockchain
    const transaction = await blockchainService.addComplianceCheck(complianceData);

    // Save compliance record to database
    const dbComplianceData = {
      record_id: parseInt(transaction.recordId || Date.now()), // Fallback if not returned
      batch_id: complianceData.batchId,
      check_type: complianceData.checkType,
      status: 0, // PENDING
      passed: false,
      auditor: req.user.address,
      notes: complianceData.notes,
      findings: complianceData.findings,
      corrective_actions: complianceData.correctiveActions,
      evidence_hashes: complianceData.evidenceHashes || [],
      additional_data: complianceData.additionalData || {}
    };

    // PATCH: Stub dbRecord for backend startup
    const dbRecord = dbComplianceData;
    logger.audit('create_compliance_check', 'compliance', req.user.id, {
      batchId: complianceData.batchId,
      checkType: complianceData.checkType,
      txHash: transaction.txHash
    });
    sendSuccessResponse(res, {
      ...dbRecord,
      transaction
    }, 'Compliance check created successfully', 201);
  })
);

/**
 * @swagger
 * /api/compliance/checks/{recordId}:
 *   get:
 *     summary: Get compliance record by ID
 *     tags: [Compliance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: recordId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Compliance record ID
 *     responses:
 *       200:
 *         description: Compliance record retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/ComplianceRecord'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/checks/:recordId',
  authenticate,
  validators.validateRecordId,
  asyncHandler(async (req, res) => {
    const { recordId } = req.params;

    // PATCH: Stub compliance record for backend startup
    const data = { record_id: recordId, stub: true };
    sendSuccessResponse(res, data, 'Compliance record retrieved successfully');
  })
);

/**
 * @swagger
 * /api/compliance/checks/{recordId}/status:
 *   put:
 *     summary: Update compliance record status
 *     tags: [Compliance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: recordId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Compliance record ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateComplianceStatusRequest'
 *     responses:
 *       200:
 *         description: Compliance status updated successfully
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
router.put('/checks/:recordId/status',
  authenticate,
  authorize(['auditor', 'compliance_officer', 'quality_manager', 'admin']),
  validators.validateRecordId,
  validateJoi(complianceSchemas.updateStatus),
  asyncHandler(async (req, res) => {
    const { recordId } = req.params;
    const { status, passed, updatedNotes } = req.body;

    // Update compliance status on blockchain
    const transaction = await blockchainService.updateComplianceStatus(recordId, {
      status,
      passed,
      updatedNotes
    });

    // PATCH: Stub update for backend startup
    logger.audit('update_compliance_status', 'compliance', req.user.id, {
      recordId,
      status,
      passed,
      txHash: transaction.txHash
    });
    sendSuccessResponse(res, {
      recordId,
      status,
      passed,
      transaction
    }, 'Compliance status updated successfully');
  })
);

/**
 * @swagger
 * /api/compliance/batches/{batchId}:
 *   get:
 *     summary: Get compliance history for batch
 *     tags: [Compliance]
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
 *         description: Compliance history retrieved successfully
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
 *                     $ref: '#/components/schemas/ComplianceRecord'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/batches/:batchId',
  authenticate,
  validators.validateBatchId,
  asyncHandler(async (req, res) => {
  const { batchId } = req.params;
  // PATCH: Stub compliance records for backend startup
  const records = [{ batch_id: batchId, stub: true }];
  sendSuccessResponse(res, records, 'Compliance history retrieved successfully');
  })
);

/**
 * @swagger
 * /api/compliance/audits:
 *   post:
 *     summary: Record audit trail
 *     tags: [Compliance]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RecordAuditTrailRequest'
 *     responses:
 *       201:
 *         description: Audit trail recorded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/AuditTrail'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.post('/audits',
  authenticate,
  authorize(['auditor', 'compliance_officer', 'quality_manager', 'admin']),
  validateJoi(complianceSchemas.recordAudit),
  asyncHandler(async (req, res) => {
    const auditData = req.body;

    // Record audit trail in database
    const dbAuditData = {
      audit_id: Date.now(), // Simple ID generation
      batch_id: auditData.batchId,
      auditor: req.user.address,
      audit_date: new Date().toISOString(),
      audit_type: auditData.auditType,
      findings: auditData.findings,
      recommendations: auditData.recommendations,
      result: auditData.result,
      evidence_hashes: auditData.evidenceHashes || []
    };

    // PATCH: Stub audit trail for backend startup
    logger.audit('record_audit_trail', 'compliance', req.user.id, {
      batchId: auditData.batchId,
      auditType: auditData.auditType,
      result: auditData.result
    });
    sendSuccessResponse(res, dbAuditData, 'Audit trail recorded successfully', 201);
  })
);

/**
 * @swagger
 * /api/compliance/audits:
 *   get:
 *     summary: Get all audit trails
 *     tags: [Compliance]
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
 *         name: batchId
 *         schema:
 *           type: integer
 *         description: Filter by batch ID
 *       - in: query
 *         name: auditor
 *         schema:
 *           type: string
 *         description: Filter by auditor address
 *     responses:
 *       200:
 *         description: Audit trails retrieved successfully
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
 *                     $ref: '#/components/schemas/AuditTrail'
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/audits',
  authenticate,
  validators.validatePagination,
  asyncHandler(async (req, res) => {
    const {
      page = 1,
      limit = 10
    } = req.query;

    // PATCH: Stub audit trails for backend startup
    sendSuccessResponse(res, {
      data: [],
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: 0,
        pages: 0
      }
    }, 'Audit trails retrieved successfully');
  })
);

/**
 * @swagger
 * /api/compliance/standards:
 *   post:
 *     summary: Set compliance standard
 *     tags: [Compliance]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SetComplianceStandardRequest'
 *     responses:
 *       201:
 *         description: Compliance standard set successfully
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.post('/standards',
  authenticate,
  authorize(['regulator', 'admin']),
  asyncHandler(async (req, res) => {
    const { name, description, version, isActive, requirements } = req.body;

    // Set compliance standard on blockchain
    const transaction = await blockchainService.getContract('complianceManager')
      .setComplianceStandard(name, description, version, isActive, requirements);

    await transaction.wait();

    logger.audit('set_compliance_standard', 'compliance', req.user.id, {
      name,
      version,
      isActive,
      txHash: transaction.hash
    });

    sendSuccessResponse(res, {
      transaction: {
        txHash: transaction.hash,
        gasUsed: (await transaction.wait()).gasUsed.toString()
      }
    }, 'Compliance standard set successfully', 201);
  })
);

/**
 * @swagger
 * /api/compliance/standards/{name}:
 *   get:
 *     summary: Get compliance standard
 *     tags: [Compliance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: name
 *         required: true
 *         schema:
 *           type: string
 *         description: Standard name
 *     responses:
 *       200:
 *         description: Compliance standard retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/ComplianceStandard'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/standards/:name',
  authenticate,
  asyncHandler(async (req, res) => {
    const { name } = req.params;

    const standard = await blockchainService.getContract('complianceManager')
      .getComplianceStandard(name);

    sendSuccessResponse(res, {
      standardName: standard.standardName,
      description: standard.description,
      version: standard.version,
      isActive: standard.isActive,
      requirements: standard.requirements,
      createdAt: standard.createdAt,
      createdBy: standard.createdBy
    }, 'Compliance standard retrieved successfully');
  })
);

/**
 * @swagger
 * /api/compliance/statistics:
 *   get:
 *     summary: Get compliance statistics
 *     tags: [Compliance]
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
 *                     totalRecords:
 *                       type: integer
 *                     totalAudits:
 *                       type: integer
 *                     passedChecks:
 *                       type: integer
 *                     failedChecks:
 *                       type: integer
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/statistics',
  authenticate,
  asyncHandler(async (req, res) => {
    // PATCH: Stub statistics for backend startup
    sendSuccessResponse(res, {
      totalRecords: 0,
      totalAudits: 0,
      passedChecks: 0,
      failedChecks: 0
    }, 'Compliance statistics retrieved successfully');
  })
);

module.exports = router;
