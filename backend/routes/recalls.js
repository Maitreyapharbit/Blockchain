const express = require('express');
const router = express.Router();
// Temporarily disabled authentication middleware
// const { authenticate, authorize } = require('../middleware/auth');
const { asyncHandler, sendSuccessResponse, sendErrorResponse } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

// Mock data for demonstration - in production, this would use a proper database service
const recalls = [];
const recallBatches = [];
const distributionTracking = [];

// Add some test data
recalls.push({
  id: 'REC-1',
  batchIds: ['BATCH-001', 'BATCH-002'],
  status: 'active',
  severity: 'high',
  reason: 'Quality control issue',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
});

// Generate unique ID
const generateId = () => `REC-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

/**
 * @swagger
 * /api/recalls/initiate:
 *   post:
 *     summary: Initiate a new recall
 *     tags: [Recalls]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - batchIds
 *               - severity
 *               - reason
 *               - initiatedBy
 *             properties:
 *               batchIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of batch IDs to recall
 *               severity:
 *                 type: string
 *                 enum: [LOW, MEDIUM, HIGH, CRITICAL]
 *                 description: Severity level of the recall
 *               reason:
 *                 type: string
 *                 description: Reason for the recall
 *               initiatedBy:
 *                 type: string
 *                 description: Person who initiated the recall
 *     responses:
 *       201:
 *         description: Recall initiated successfully
 *       400:
 *         description: Invalid input data
 *       500:
 *         description: Internal server error
 */
router.post('/initiate', asyncHandler(async (req, res) => {
    const { batchIds, severity, reason, initiatedBy } = req.body;

    // Validation
    if (!batchIds || !Array.isArray(batchIds) || batchIds.length === 0) {
        return sendErrorResponse(res, 400, 'Batch IDs are required');
    }

    if (!severity || !['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].includes(severity)) {
        return sendErrorResponse(res, 400, 'Valid severity level is required');
    }

    if (!reason || reason.trim().length === 0) {
        return sendErrorResponse(res, 400, 'Reason is required');
    }

    if (!initiatedBy) {
        return sendErrorResponse(res, 400, 'Initiator is required');
    }

    try {
        const recallId = generateId();
        const recall = {
            id: recallId,
            recallId,
            severity,
            reason,
            initiatedBy,
            initiatedAt: new Date().toISOString(),
            status: 'ACTIVE',
            batchCount: batchIds.length
        };

        // Add to recalls array
        recalls.push(recall);

        // Add batches to recall
        for (const batchId of batchIds) {
            const recallBatch = {
                id: `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                recallId,
                batchId,
                productName: `Product ${batchId}`,
                lotNumber: batchId,
                expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                quantityAffected: Math.floor(Math.random() * 1000) + 100
            };
            recallBatches.push(recallBatch);
        }

        logger.info('Recall initiated', { recallId, severity, batchCount: batchIds.length });

        sendSuccessResponse(res, recall, 'Recall initiated successfully', 201);
    } catch (error) {
        logger.error('Error initiating recall:', error);
        sendErrorResponse(res, 500, 'Failed to initiate recall');
    }
}));

/**
 * @swagger
 * /api/recalls:
 *   get:
 *     summary: Get all recalls
 *     tags: [Recalls]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all recalls
 */
router.get('/', asyncHandler(async (req, res) => {
    try {
        const recallsWithBatches = recalls.map(recall => ({
            ...recall,
            batches: recallBatches.filter(rb => rb.recallId === recall.recallId)
        }));

        sendSuccessResponse(res, recallsWithBatches);
    } catch (error) {
        logger.error('Error getting recalls:', error);
        sendErrorResponse(res, 500, 'Failed to get recalls');
    }
}));

/**
 * @swagger
 * /api/recalls/{recallId}/status:
 *   get:
 *     summary: Get recall status
 *     tags: [Recalls]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: recallId
 *         required: true
 *         schema:
 *           type: string
 *         description: Recall ID
 *     responses:
 *       200:
 *         description: Recall status retrieved successfully
 *       404:
 *         description: Recall not found
 */
router.get('/:recallId/status', asyncHandler(async (req, res) => {
    const { recallId } = req.params;

    try {
        const recall = recalls.find(r => r.recallId === recallId);
        if (!recall) {
            return sendErrorResponse(res, 404, 'Recall not found');
        }

        const batches = recallBatches.filter(rb => rb.recallId === recallId);
        const recallWithBatches = {
            ...recall,
            batches
        };

        sendSuccessResponse(res, recallWithBatches);
    } catch (error) {
        logger.error('Error getting recall status:', error);
        sendErrorResponse(res, 500, 'Failed to get recall status');
    }
}));

/**
 * @swagger
 * /api/recalls/{recallId}/status:
 *   patch:
 *     summary: Update recall status
 *     tags: [Recalls]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: recallId
 *         required: true
 *         schema:
 *           type: string
 *         description: Recall ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [ACTIVE, RESOLVED, CANCELLED]
 *               resolutionNotes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Recall status updated successfully
 *       404:
 *         description: Recall not found
 */
router.patch('/:recallId/status', asyncHandler(async (req, res) => {
    const { recallId } = req.params;
    const { status, resolutionNotes } = req.body;

    if (!status || !['ACTIVE', 'RESOLVED', 'CANCELLED'].includes(status)) {
        return sendErrorResponse(res, 400, 'Valid status is required');
    }

    try {
        const recall = recalls.find(r => r.recallId === recallId);
        if (!recall) {
            return sendErrorResponse(res, 404, 'Recall not found');
        }

        recall.status = status;
        if (status === 'RESOLVED' || status === 'CANCELLED') {
            recall.resolvedAt = new Date().toISOString();
            recall.resolutionNotes = resolutionNotes;
        }

        logger.info('Recall status updated', { recallId, status });

        sendSuccessResponse(res, recall, 'Recall status updated successfully');
    } catch (error) {
        logger.error('Error updating recall status:', error);
        sendErrorResponse(res, 500, 'Failed to update recall status');
    }
}));

/**
 * @swagger
 * /api/recalls/{recallId}/batches:
 *   post:
 *     summary: Add batch to recall
 *     tags: [Recalls]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: recallId
 *         required: true
 *         schema:
 *           type: string
 *         description: Recall ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - batchId
 *               - productName
 *               - lotNumber
 *               - expiryDate
 *               - quantity
 *             properties:
 *               batchId:
 *                 type: string
 *               productName:
 *                 type: string
 *               lotNumber:
 *                 type: string
 *               expiryDate:
 *                 type: string
 *                 format: date
 *               quantity:
 *                 type: number
 *     responses:
 *       201:
 *         description: Batch added to recall successfully
 *       404:
 *         description: Recall not found
 */
router.post('/:recallId/batches', asyncHandler(async (req, res) => {
    const { recallId } = req.params;
    const { batchId, productName, lotNumber, expiryDate, quantity } = req.body;

    // Validation
    if (!batchId) {
        return sendErrorResponse(res, 400, 'Batch ID is required');
    }
    if (!productName) {
        return sendErrorResponse(res, 400, 'Product name is required');
    }
    if (!lotNumber) {
        return sendErrorResponse(res, 400, 'Lot number is required');
    }
    if (!expiryDate) {
        return sendErrorResponse(res, 400, 'Expiry date is required');
    }
    if (!quantity || quantity <= 0) {
        return sendErrorResponse(res, 400, 'Valid quantity is required');
    }

    try {
        const recall = recalls.find(r => r.recallId === recallId);
        if (!recall) {
            return sendErrorResponse(res, 404, 'Recall not found');
        }

        if (recall.status !== 'ACTIVE') {
            return sendErrorResponse(res, 400, 'Cannot add batch to inactive recall');
        }

        const recallBatch = {
            id: `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            recallId,
            batchId,
            productName,
            lotNumber,
            expiryDate,
            quantityAffected: quantity
        };

        recallBatches.push(recallBatch);
        recall.batchCount = (recall.batchCount || 0) + 1;

        logger.info('Batch added to recall', { recallId, batchId, productName });

        sendSuccessResponse(res, recallBatch, 'Batch added to recall successfully', 201);
    } catch (error) {
        logger.error('Error adding batch to recall:', error);
        sendErrorResponse(res, 500, 'Failed to add batch to recall');
    }
}));

/**
 * @swagger
 * /api/recalls/distribution/{batchId}:
 *   get:
 *     summary: Track affected distribution
 *     tags: [Recalls]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: batchId
 *         required: true
 *         schema:
 *           type: string
 *         description: Batch ID
 *     responses:
 *       200:
 *         description: Distribution tracking data retrieved successfully
 */
router.get('/distribution/:batchId', asyncHandler(async (req, res) => {
    const { batchId } = req.params;

    try {
        // Mock distribution data
        const distributions = [
            {
                distributorName: 'ABC Distributors',
                distributorAddress: '123 Main St, New York, NY',
                quantityShipped: 500,
                shippedDate: '2024-01-15',
                receivedDate: '2024-01-20',
                status: 'DELIVERED',
                blockchainTxHash: '0x1234567890abcdef'
            },
            {
                distributorName: 'XYZ Pharma',
                distributorAddress: '456 Oak Ave, Los Angeles, CA',
                quantityShipped: 300,
                shippedDate: '2024-01-16',
                receivedDate: null,
                status: 'IN_TRANSIT',
                blockchainTxHash: '0xabcdef1234567890'
            }
        ];

        const isRecalled = recallBatches.some(rb => rb.batchId === batchId);
        const activeRecalls = recallBatches
            .filter(rb => rb.batchId === batchId)
            .map(rb => {
                const recall = recalls.find(r => r.recallId === rb.recallId);
                return recall ? {
                    recallId: recall.recallId,
                    severity: recall.severity,
                    reason: recall.reason,
                    initiatedAt: recall.initiatedAt
                } : null;
            })
            .filter(Boolean);

        const result = {
            batchId,
            distributions,
            isRecalled,
            activeRecalls
        };

        sendSuccessResponse(res, result);
    } catch (error) {
        logger.error('Error tracking distribution:', error);
        sendErrorResponse(res, 500, 'Failed to track distribution');
    }
}));

/**
 * @swagger
 * /api/recalls/{recallId}/notify:
 *   post:
 *     summary: Notify stakeholders about recall
 *     tags: [Recalls]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: recallId
 *         required: true
 *         schema:
 *           type: string
 *         description: Recall ID
 *     responses:
 *       200:
 *         description: Stakeholders notified successfully
 *       404:
 *         description: Recall not found
 */
router.post('/:recallId/notify', asyncHandler(async (req, res) => {
    const { recallId } = req.params;

    try {
        const recall = recalls.find(r => r.recallId === recallId);
        if (!recall) {
            return sendErrorResponse(res, 404, 'Recall not found');
        }

        // Mock notification - in production, this would send actual notifications
        logger.info('Stakeholders notified', { 
            recallId, 
            severity: recall.severity,
            reason: recall.reason,
            initiatedBy: recall.initiatedBy
        });

        sendSuccessResponse(res, { message: 'Stakeholders notified successfully' });
    } catch (error) {
        logger.error('Error notifying stakeholders:', error);
        sendErrorResponse(res, 500, 'Failed to notify stakeholders');
    }
}));

module.exports = router;