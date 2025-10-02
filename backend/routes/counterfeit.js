const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const { asyncHandler, sendSuccessResponse, sendErrorResponse } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

// Mock data for demonstration - in production, this would use a proper database service
const securityFeatures = [];
const counterfeitReports = [];
const verificationLogs = [];
const flaggedBatches = [];

// Generate unique ID
const generateId = () => `RPT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

/**
 * @swagger
 * /api/counterfeit/verify:
 *   post:
 *     summary: Verify authenticity of a batch
 *     tags: [Anti-Counterfeit]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - batchId
 *               - verificationType
 *               - providedData
 *             properties:
 *               batchId:
 *                 type: string
 *                 description: Batch ID to verify
 *               verificationType:
 *                 type: string
 *                 enum: [QR_SCAN, HOLOGRAM_CHECK, SERIAL_VERIFICATION]
 *                 description: Type of verification
 *               providedData:
 *                 type: string
 *                 description: Data provided for verification
 *               verifiedBy:
 *                 type: string
 *                 description: Person performing verification
 *               ipAddress:
 *                 type: string
 *                 description: IP address of verifier
 *               userAgent:
 *                 type: string
 *                 description: User agent of verifier
 *     responses:
 *       200:
 *         description: Verification completed successfully
 *       400:
 *         description: Invalid input data
 *       500:
 *         description: Internal server error
 */
router.post('/verify', authenticate, asyncHandler(async (req, res) => {
    const { batchId, verificationType, providedData, verifiedBy, ipAddress, userAgent } = req.body;

    // Validation
    if (!batchId) {
        return sendErrorResponse(res, 400, 'Batch ID is required');
    }

    if (!verificationType || !['QR_SCAN', 'HOLOGRAM_CHECK', 'SERIAL_VERIFICATION'].includes(verificationType)) {
        return sendErrorResponse(res, 400, 'Valid verification type is required');
    }

    if (!providedData) {
        return sendErrorResponse(res, 400, 'Provided data is required');
    }

    try {
        // Get security feature for batch
        const securityFeature = securityFeatures.find(sf => sf.batchId === batchId);
        
        let isValid = false;
        let expectedData = '';

        if (securityFeature) {
            // Perform verification based on type
            switch (verificationType) {
                case 'QR_SCAN':
                    expectedData = securityFeature.qrCodeHash;
                    isValid = providedData === expectedData;
                    break;
                case 'HOLOGRAM_CHECK':
                    expectedData = securityFeature.hologramId;
                    isValid = providedData === expectedData;
                    break;
                case 'SERIAL_VERIFICATION':
                    expectedData = securityFeature.serialNumber;
                    isValid = providedData === expectedData;
                    break;
            }
        }

        // Log verification attempt
        const verificationLog = {
            id: `verification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            batchId,
            verificationType,
            verificationResult: isValid,
            verificationDetails: {
                providedData,
                expectedData,
                verifiedBy,
                ipAddress,
                userAgent
            },
            verifiedBy: verifiedBy || 'Anonymous',
            verifiedAt: new Date().toISOString(),
            ipAddress: ipAddress || '127.0.0.1',
            userAgent: userAgent || 'Unknown'
        };

        verificationLogs.push(verificationLog);

        // If verification failed multiple times, flag the batch
        const recentFailedVerifications = verificationLogs.filter(
            log => log.batchId === batchId && 
                   log.verificationType === verificationType && 
                   !log.verificationResult &&
                   new Date(log.verifiedAt) > new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
        );

        if (recentFailedVerifications.length >= 3) {
            const existingFlag = flaggedBatches.find(fb => fb.batchId === batchId);
            if (!existingFlag) {
                flaggedBatches.push({
                    batchId,
                    reason: 'Multiple failed verifications',
                    flaggedAt: new Date().toISOString(),
                    verificationType,
                    failedAttempts: recentFailedVerifications.length
                });
            }
        }

        logger.info('Authenticity verification performed', { 
            batchId, 
            verificationType, 
            isValid,
            verifiedBy: verifiedBy || 'Anonymous'
        });

        const result = {
            batchId,
            verificationType,
            isValid,
            verifiedAt: new Date().toISOString()
        };

        sendSuccessResponse(res, result);
    } catch (error) {
        logger.error('Error verifying authenticity:', error);
        sendErrorResponse(res, 500, 'Failed to verify authenticity');
    }
}));

/**
 * @swagger
 * /api/counterfeit/report:
 *   post:
 *     summary: Report suspicious activity
 *     tags: [Anti-Counterfeit]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - batchId
 *               - reporterName
 *               - reporterEmail
 *               - reportType
 *               - description
 *             properties:
 *               batchId:
 *                 type: string
 *               reporterName:
 *                 type: string
 *               reporterEmail:
 *                 type: string
 *               reportType:
 *                 type: string
 *                 enum: [SUSPICIOUS_PACKAGING, INVALID_QR, MISSING_HOLOGRAM, OTHER]
 *               description:
 *                 type: string
 *               evidenceUrls:
 *                 type: array
 *                 items:
 *                   type: string
 *               location:
 *                 type: string
 *     responses:
 *       201:
 *         description: Report submitted successfully
 *       400:
 *         description: Invalid input data
 *       500:
 *         description: Internal server error
 */
router.post('/report', authenticate, asyncHandler(async (req, res) => {
    const { 
        batchId, 
        reporterName, 
        reporterEmail, 
        reportType, 
        description, 
        evidenceUrls, 
        location 
    } = req.body;

    // Validation
    if (!batchId) {
        return sendErrorResponse(res, 400, 'Batch ID is required');
    }
    if (!reporterName) {
        return sendErrorResponse(res, 400, 'Reporter name is required');
    }
    if (!reporterEmail) {
        return sendErrorResponse(res, 400, 'Reporter email is required');
    }
    if (!reportType || !['SUSPICIOUS_PACKAGING', 'INVALID_QR', 'MISSING_HOLOGRAM', 'OTHER'].includes(reportType)) {
        return sendErrorResponse(res, 400, 'Valid report type is required');
    }
    if (!description) {
        return sendErrorResponse(res, 400, 'Description is required');
    }

    try {
        const reportId = generateId();
        const report = {
            id: reportId,
            batchId,
            reporterName,
            reporterEmail,
            reportType,
            description,
            evidenceUrls: evidenceUrls || [],
            location: location || '',
            reportedAt: new Date().toISOString(),
            status: 'PENDING'
        };

        counterfeitReports.push(report);

        // Auto-flag batch if multiple reports
        const recentReports = counterfeitReports.filter(
            r => r.batchId === batchId && 
                 new Date(r.reportedAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
        );

        if (recentReports.length >= 2) {
            const existingFlag = flaggedBatches.find(fb => fb.batchId === batchId);
            if (!existingFlag) {
                flaggedBatches.push({
                    batchId,
                    reason: 'Multiple suspicious activity reports',
                    flaggedAt: new Date().toISOString(),
                    reportCount: recentReports.length
                });
            }
        }

        logger.info('Suspicious activity reported', { 
            reportId, 
            batchId, 
            reportType,
            reporterName
        });

        const result = {
            reportId,
            batchId,
            reportType,
            status: 'PENDING',
            reportedAt: report.reportedAt
        };

        sendSuccessResponse(res, result, 'Report submitted successfully', 201);
    } catch (error) {
        logger.error('Error reporting suspicious activity:', error);
        sendErrorResponse(res, 500, 'Failed to submit report');
    }
}));

/**
 * @swagger
 * /api/counterfeit/flagged:
 *   get:
 *     summary: Get flagged batches
 *     tags: [Anti-Counterfeit]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of flagged batches retrieved successfully
 */
router.get('/flagged', authenticate, asyncHandler(async (req, res) => {
    try {
        const results = flaggedBatches.map(flagged => {
            const securityFeature = securityFeatures.find(sf => sf.batchId === flagged.batchId);
            const recentVerifications = verificationLogs
                .filter(log => log.batchId === flagged.batchId)
                .sort((a, b) => new Date(b.verifiedAt) - new Date(a.verifiedAt))
                .slice(0, 5);
            const reports = counterfeitReports.filter(r => r.batchId === flagged.batchId);

            return {
                batchId: flagged.batchId,
                reason: flagged.reason,
                flaggedAt: flagged.flaggedAt,
                securityFeature: securityFeature ? {
                    qrCodeHash: securityFeature.qrCodeHash,
                    hologramId: securityFeature.hologramId,
                    serialNumber: securityFeature.serialNumber,
                    createdAt: securityFeature.createdAt
                } : null,
                recentVerifications: recentVerifications.map(v => ({
                    type: v.verificationType,
                    result: v.verificationResult,
                    verifiedAt: v.verifiedAt,
                    verifiedBy: v.verifiedBy
                })),
                reports: reports.map(r => ({
                    id: r.id,
                    reportType: r.reportType,
                    description: r.description,
                    status: r.status,
                    reportedAt: r.reportedAt
                }))
            };
        });

        sendSuccessResponse(res, results);
    } catch (error) {
        logger.error('Error getting flagged batches:', error);
        sendErrorResponse(res, 500, 'Failed to get flagged batches');
    }
}));

/**
 * @swagger
 * /api/counterfeit/security-features:
 *   post:
 *     summary: Generate security features for a batch
 *     tags: [Anti-Counterfeit]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - batchId
 *               - qrCodeHash
 *               - hologramId
 *               - serialNumber
 *               - securityPattern
 *             properties:
 *               batchId:
 *                 type: string
 *               qrCodeHash:
 *                 type: string
 *               hologramId:
 *                 type: string
 *               serialNumber:
 *                 type: string
 *               securityPattern:
 *                 type: string
 *     responses:
 *       201:
 *         description: Security features generated successfully
 *       400:
 *         description: Invalid input data
 *       500:
 *         description: Internal server error
 */
router.post('/security-features', authenticate, authorize(['manufacturer', 'admin']), asyncHandler(async (req, res) => {
    const { batchId, qrCodeHash, hologramId, serialNumber, securityPattern } = req.body;

    // Validation
    if (!batchId) {
        return sendErrorResponse(res, 400, 'Batch ID is required');
    }
    if (!qrCodeHash) {
        return sendErrorResponse(res, 400, 'QR code hash is required');
    }
    if (!hologramId) {
        return sendErrorResponse(res, 400, 'Hologram ID is required');
    }
    if (!serialNumber) {
        return sendErrorResponse(res, 400, 'Serial number is required');
    }
    if (!securityPattern) {
        return sendErrorResponse(res, 400, 'Security pattern is required');
    }

    try {
        // Check if security features already exist
        const existing = securityFeatures.find(sf => sf.batchId === batchId);
        if (existing) {
            return sendErrorResponse(res, 400, 'Security features already exist for this batch');
        }

        const securityFeature = {
            id: `sf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            batchId,
            qrCodeHash,
            hologramId,
            serialNumber,
            securityPattern,
            createdAt: new Date().toISOString()
        };

        securityFeatures.push(securityFeature);

        logger.info('Security features generated', { 
            batchId, 
            serialNumber,
            hologramId
        });

        sendSuccessResponse(res, securityFeature, 'Security features generated successfully', 201);
    } catch (error) {
        logger.error('Error generating security features:', error);
        sendErrorResponse(res, 500, 'Failed to generate security features');
    }
}));

/**
 * @swagger
 * /api/counterfeit/security-features/{batchId}:
 *   get:
 *     summary: Get security features for a batch
 *     tags: [Anti-Counterfeit]
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
 *         description: Security features retrieved successfully
 *       404:
 *         description: Security features not found
 */
router.get('/security-features/:batchId', authenticate, asyncHandler(async (req, res) => {
    const { batchId } = req.params;

    try {
        const securityFeature = securityFeatures.find(sf => sf.batchId === batchId);
        if (!securityFeature) {
            return sendErrorResponse(res, 404, 'Security features not found');
        }

        sendSuccessResponse(res, securityFeature);
    } catch (error) {
        logger.error('Error getting security features:', error);
        sendErrorResponse(res, 500, 'Failed to get security features');
    }
}));

/**
 * @swagger
 * /api/counterfeit/reports/{reportId}/status:
 *   patch:
 *     summary: Update report status
 *     tags: [Anti-Counterfeit]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: reportId
 *         required: true
 *         schema:
 *           type: string
 *         description: Report ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [PENDING, INVESTIGATING, CONFIRMED, FALSE_ALARM]
 *               investigatorNotes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Report status updated successfully
 *       404:
 *         description: Report not found
 */
router.patch('/reports/:reportId/status', authenticate, authorize(['admin', 'investigator']), asyncHandler(async (req, res) => {
    const { reportId } = req.params;
    const { status, investigatorNotes } = req.body;

    if (!status || !['PENDING', 'INVESTIGATING', 'CONFIRMED', 'FALSE_ALARM'].includes(status)) {
        return sendErrorResponse(res, 400, 'Valid status is required');
    }

    try {
        const report = counterfeitReports.find(r => r.id === reportId);
        if (!report) {
            return sendErrorResponse(res, 404, 'Report not found');
        }

        report.status = status;
        if (status === 'CONFIRMED' || status === 'FALSE_ALARM') {
            report.resolvedAt = new Date().toISOString();
            report.investigatorNotes = investigatorNotes;
        }

        logger.info('Report status updated', { reportId, status });

        sendSuccessResponse(res, report, 'Report status updated successfully');
    } catch (error) {
        logger.error('Error updating report status:', error);
        sendErrorResponse(res, 500, 'Failed to update report status');
    }
}));

/**
 * @swagger
 * /api/counterfeit/verification-history/{batchId}:
 *   get:
 *     summary: Get verification history for a batch
 *     tags: [Anti-Counterfeit]
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
 *         description: Verification history retrieved successfully
 */
router.get('/verification-history/:batchId', authenticate, asyncHandler(async (req, res) => {
    const { batchId } = req.params;

    try {
        const logs = verificationLogs
            .filter(log => log.batchId === batchId)
            .sort((a, b) => new Date(b.verifiedAt) - new Date(a.verifiedAt));

        const result = logs.map(log => ({
            id: log.id,
            verificationType: log.verificationType,
            result: log.verificationResult,
            details: log.verificationDetails,
            verifiedBy: log.verifiedBy,
            verifiedAt: log.verifiedAt,
            ipAddress: log.ipAddress,
            userAgent: log.userAgent
        }));

        sendSuccessResponse(res, result);
    } catch (error) {
        logger.error('Error getting verification history:', error);
        sendErrorResponse(res, 500, 'Failed to get verification history');
    }
}));

/**
 * @swagger
 * /api/counterfeit/reports:
 *   get:
 *     summary: Get all counterfeit reports
 *     tags: [Anti-Counterfeit]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all reports retrieved successfully
 */
router.get('/reports', authenticate, asyncHandler(async (req, res) => {
    try {
        const result = counterfeitReports.map(report => ({
            id: report.id,
            batchId: report.batchId,
            reporterName: report.reporterName,
            reporterEmail: report.reporterEmail,
            reportType: report.reportType,
            description: report.description,
            evidenceUrls: report.evidenceUrls,
            location: report.location,
            status: report.status,
            investigatorNotes: report.investigatorNotes,
            reportedAt: report.reportedAt,
            resolvedAt: report.resolvedAt
        }));

        sendSuccessResponse(res, result);
    } catch (error) {
        logger.error('Error getting all reports:', error);
        sendErrorResponse(res, 500, 'Failed to get reports');
    }
}));

module.exports = router;