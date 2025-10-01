import express from 'express';
import { CounterfeitService } from '../services/CounterfeitService';
import { logger } from '../utils/logger';

const router = express.Router();

export function createCounterfeitRoutes(counterfeitService: CounterfeitService) {
  // Verify authenticity
  router.post('/verify', async (req, res) => {
    try {
      const { batchId, verificationType, providedData, verifiedBy, ipAddress, userAgent } = req.body;

      if (!batchId) {
        return res.status(400).json({ error: 'Batch ID is required' });
      }

      if (!verificationType || !['QR_SCAN', 'HOLOGRAM_CHECK', 'SERIAL_VERIFICATION'].includes(verificationType)) {
        return res.status(400).json({ error: 'Valid verification type is required' });
      }

      if (!providedData) {
        return res.status(400).json({ error: 'Provided data is required' });
      }

      const isValid = await counterfeitService.verifyAuthenticity(
        batchId,
        verificationType,
        providedData,
        verifiedBy,
        ipAddress,
        userAgent
      );
      
      logger.info('Authenticity verification via API', { batchId, verificationType, isValid });
      
      res.json({
        success: true,
        data: {
          batchId,
          verificationType,
          isValid,
          verifiedAt: new Date().toISOString()
        }
      });
    } catch (error) {
      logger.error('Error verifying authenticity:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Report suspicious activity
  router.post('/report', async (req, res) => {
    try {
      const { 
        batchId, 
        reporterName, 
        reporterEmail, 
        reportType, 
        description, 
        evidenceUrls, 
        location 
      } = req.body;

      if (!batchId) {
        return res.status(400).json({ error: 'Batch ID is required' });
      }

      if (!reporterName) {
        return res.status(400).json({ error: 'Reporter name is required' });
      }

      if (!reporterEmail) {
        return res.status(400).json({ error: 'Reporter email is required' });
      }

      if (!reportType || !['SUSPICIOUS_PACKAGING', 'INVALID_QR', 'MISSING_HOLOGRAM', 'OTHER'].includes(reportType)) {
        return res.status(400).json({ error: 'Valid report type is required' });
      }

      if (!description) {
        return res.status(400).json({ error: 'Description is required' });
      }

      const result = await counterfeitService.reportSuspiciousActivity(
        batchId,
        reporterName,
        reporterEmail,
        reportType,
        description,
        evidenceUrls || [],
        location
      );
      
      logger.info('Suspicious activity reported via API', { 
        reportId: result.reportId, 
        batchId, 
        reportType 
      });
      
      res.status(201).json({
        success: true,
        data: result
      });
    } catch (error) {
      logger.error('Error reporting suspicious activity:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Get flagged batches
  router.get('/flagged', async (req, res) => {
    try {
      const result = await counterfeitService.getFlaggedBatches();
      
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      logger.error('Error getting flagged batches:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Generate security features
  router.post('/security-features', async (req, res) => {
    try {
      const { batchId, qrCodeHash, hologramId, serialNumber, securityPattern } = req.body;

      if (!batchId) {
        return res.status(400).json({ error: 'Batch ID is required' });
      }

      if (!qrCodeHash) {
        return res.status(400).json({ error: 'QR code hash is required' });
      }

      if (!hologramId) {
        return res.status(400).json({ error: 'Hologram ID is required' });
      }

      if (!serialNumber) {
        return res.status(400).json({ error: 'Serial number is required' });
      }

      if (!securityPattern) {
        return res.status(400).json({ error: 'Security pattern is required' });
      }

      const result = await counterfeitService.generateSecurityFeatures(
        batchId,
        qrCodeHash,
        hologramId,
        serialNumber,
        securityPattern
      );
      
      logger.info('Security features generated via API', { batchId, serialNumber });
      
      res.status(201).json({
        success: true,
        data: result
      });
    } catch (error) {
      logger.error('Error generating security features:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Get security feature
  router.get('/security-features/:batchId', async (req, res) => {
    try {
      const { batchId } = req.params;
      const result = await counterfeitService.getSecurityFeature(batchId);
      
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      logger.error('Error getting security feature:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Update report status
  router.patch('/reports/:reportId/status', async (req, res) => {
    try {
      const { reportId } = req.params;
      const { status, investigatorNotes } = req.body;

      if (!status || !['PENDING', 'INVESTIGATING', 'CONFIRMED', 'FALSE_ALARM'].includes(status)) {
        return res.status(400).json({ error: 'Valid status is required' });
      }

      const result = await counterfeitService.updateReportStatus(
        reportId,
        status,
        investigatorNotes
      );
      
      logger.info('Report status updated via API', { reportId, status });
      
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      logger.error('Error updating report status:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Get verification history
  router.get('/verification-history/:batchId', async (req, res) => {
    try {
      const { batchId } = req.params;
      const result = await counterfeitService.getVerificationHistory(batchId);
      
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      logger.error('Error getting verification history:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Get all reports
  router.get('/reports', async (req, res) => {
    try {
      const result = await counterfeitService.getAllReports();
      
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      logger.error('Error getting all reports:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  return router;
}