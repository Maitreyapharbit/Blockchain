import express from 'express';
import { RecallService } from '../services/RecallService';
import { logger } from '../utils/logger';

const router = express.Router();

export function createRecallRoutes(recallService: RecallService) {
  // Initiate a new recall
  router.post('/initiate', async (req, res) => {
    try {
      const { batchIds, severity, reason, initiatedBy } = req.body;

      if (!batchIds || !Array.isArray(batchIds) || batchIds.length === 0) {
        return res.status(400).json({ error: 'Batch IDs are required' });
      }

      if (!severity || !['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].includes(severity)) {
        return res.status(400).json({ error: 'Valid severity level is required' });
      }

      if (!reason || reason.trim().length === 0) {
        return res.status(400).json({ error: 'Reason is required' });
      }

      if (!initiatedBy) {
        return res.status(400).json({ error: 'Initiator is required' });
      }

      const result = await recallService.initiateRecall(batchIds, severity, reason, initiatedBy);
      
      logger.info('Recall initiated via API', { recallId: result.recallId, severity, batchCount: batchIds.length });
      
      res.status(201).json({
        success: true,
        data: result
      });
    } catch (error) {
      logger.error('Error in recall initiation API:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Get recall status
  router.get('/:recallId/status', async (req, res) => {
    try {
      const { recallId } = req.params;
      const result = await recallService.getRecallStatus(recallId);
      
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      logger.error('Error getting recall status:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Get all recalls
  router.get('/', async (req, res) => {
    try {
      const result = await recallService.getAllRecalls();
      
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      logger.error('Error getting all recalls:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Update recall status
  router.patch('/:recallId/status', async (req, res) => {
    try {
      const { recallId } = req.params;
      const { status, resolutionNotes } = req.body;

      if (!status || !['ACTIVE', 'RESOLVED', 'CANCELLED'].includes(status)) {
        return res.status(400).json({ error: 'Valid status is required' });
      }

      const result = await recallService.updateRecallStatus(recallId, status, resolutionNotes);
      
      logger.info('Recall status updated via API', { recallId, status });
      
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      logger.error('Error updating recall status:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Add batch to existing recall
  router.post('/:recallId/batches', async (req, res) => {
    try {
      const { recallId } = req.params;
      const { batchId, productName, lotNumber, expiryDate, quantity } = req.body;

      if (!batchId) {
        return res.status(400).json({ error: 'Batch ID is required' });
      }

      if (!productName) {
        return res.status(400).json({ error: 'Product name is required' });
      }

      if (!lotNumber) {
        return res.status(400).json({ error: 'Lot number is required' });
      }

      if (!expiryDate) {
        return res.status(400).json({ error: 'Expiry date is required' });
      }

      if (!quantity || quantity <= 0) {
        return res.status(400).json({ error: 'Valid quantity is required' });
      }

      const result = await recallService.addBatchToRecall(
        recallId,
        batchId,
        productName,
        lotNumber,
        new Date(expiryDate),
        quantity
      );
      
      logger.info('Batch added to recall via API', { recallId, batchId, productName });
      
      res.status(201).json({
        success: true,
        data: result
      });
    } catch (error) {
      logger.error('Error adding batch to recall:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Track affected distribution
  router.get('/distribution/:batchId', async (req, res) => {
    try {
      const { batchId } = req.params;
      const result = await recallService.trackAffectedDistribution(batchId);
      
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      logger.error('Error tracking distribution:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Notify stakeholders
  router.post('/:recallId/notify', async (req, res) => {
    try {
      const { recallId } = req.params;
      await recallService.notifyStakeholders(recallId);
      
      logger.info('Stakeholders notified via API', { recallId });
      
      res.json({
        success: true,
        message: 'Stakeholders notified successfully'
      });
    } catch (error) {
      logger.error('Error notifying stakeholders:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  return router;
}