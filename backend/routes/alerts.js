const express = require('express');
const router = express.Router();
const { supabase } = require('../config/supabase');
const alertMonitoringService = require('../services/alertMonitoringService');
const logger = require('../utils/logger');

// Get all alerts for a shipment
router.get('/shipment/:shipmentId', async (req, res) => {
  try {
    const { shipmentId } = req.params;
    const { resolved, severity, type } = req.query;

    let query = supabase
      .from('shipment_alerts')
      .select('*')
      .eq('shipment_id', shipmentId)
      .order('created_at', { ascending: false });

    if (resolved !== undefined) {
      query = query.eq('is_resolved', resolved === 'true');
    }

    if (severity) {
      query = query.eq('severity', severity);
    }

    if (type) {
      query = query.eq('alert_type', type);
    }

    const { data, error } = await query;

    if (error) throw error;

    res.json({
      success: true,
      data: data || [],
      count: data?.length || 0
    });
  } catch (error) {
    logger.error('Error fetching shipment alerts:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch alerts'
    });
  }
});

// Get all unresolved alerts for user
router.get('/unresolved', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('shipment_alerts')
      .select(`
        *,
        shipments!inner(tracking_number, status, origin_location, destination_location)
      `)
      .eq('is_resolved', false)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({
      success: true,
      data: data || [],
      count: data?.length || 0
    });
  } catch (error) {
    logger.error('Error fetching unresolved alerts:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch unresolved alerts'
    });
  }
});

// Create a new alert
router.post('/', async (req, res) => {
  try {
    const alertData = req.body;
    
    // Validate required fields
    if (!alertData.shipment_id || !alertData.alert_type || !alertData.title) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: shipment_id, alert_type, title'
      });
    }

    const { data, error } = await supabase
      .from('shipment_alerts')
      .insert([alertData])
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({
      success: true,
      data
    });
  } catch (error) {
    logger.error('Error creating alert:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create alert'
    });
  }
});

// Resolve an alert
router.patch('/:alertId/resolve', async (req, res) => {
  try {
    const { alertId } = req.params;
    const { resolved_by } = req.body;

    const { data, error } = await supabase
      .from('shipment_alerts')
      .update({
        is_resolved: true,
        resolved_at: new Date().toISOString(),
        resolved_by: resolved_by || null
      })
      .eq('id', alertId)
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      data
    });
  } catch (error) {
    logger.error('Error resolving alert:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to resolve alert'
    });
  }
});

// Get alert statistics
router.get('/statistics', async (req, res) => {
  try {
    const stats = await alertMonitoringService.getAlertStatistics();
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    logger.error('Error fetching alert statistics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch alert statistics'
    });
  }
});

// Get alert monitoring status
router.get('/monitoring/status', async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        isMonitoring: alertMonitoringService.isMonitoring,
        thresholds: alertMonitoringService.getThresholds()
      }
    });
  } catch (error) {
    logger.error('Error fetching monitoring status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch monitoring status'
    });
  }
});

// Start alert monitoring
router.post('/monitoring/start', async (req, res) => {
  try {
    alertMonitoringService.startMonitoring();
    
    res.json({
      success: true,
      message: 'Alert monitoring started'
    });
  } catch (error) {
    logger.error('Error starting monitoring:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to start monitoring'
    });
  }
});

// Stop alert monitoring
router.post('/monitoring/stop', async (req, res) => {
  try {
    alertMonitoringService.stopMonitoring();
    
    res.json({
      success: true,
      message: 'Alert monitoring stopped'
    });
  } catch (error) {
    logger.error('Error stopping monitoring:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to stop monitoring'
    });
  }
});

// Update alert thresholds
router.put('/monitoring/thresholds', async (req, res) => {
  try {
    const { thresholds } = req.body;
    
    alertMonitoringService.updateThresholds(thresholds);
    
    res.json({
      success: true,
      message: 'Alert thresholds updated',
      data: alertMonitoringService.getThresholds()
    });
  } catch (error) {
    logger.error('Error updating thresholds:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update thresholds'
    });
  }
});

// Simulate temperature reading (for testing)
router.post('/simulate/temperature', async (req, res) => {
  try {
    const { shipmentId, temperature } = req.body;
    
    if (!shipmentId || temperature === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: shipmentId, temperature'
      });
    }

    const data = await alertMonitoringService.simulateTemperatureReading(shipmentId, temperature);
    
    res.json({
      success: true,
      data,
      message: 'Temperature reading simulated'
    });
  } catch (error) {
    logger.error('Error simulating temperature reading:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to simulate temperature reading'
    });
  }
});

// Simulate location update (for testing)
router.post('/simulate/location', async (req, res) => {
  try {
    const { shipmentId, location } = req.body;
    
    if (!shipmentId || !location) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: shipmentId, location'
      });
    }

    const data = await alertMonitoringService.simulateLocationUpdate(shipmentId, location);
    
    res.json({
      success: true,
      data,
      message: 'Location update simulated'
    });
  } catch (error) {
    logger.error('Error simulating location update:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to simulate location update'
    });
  }
});

// Delete an alert
router.delete('/:alertId', async (req, res) => {
  try {
    const { alertId } = req.params;

    const { error } = await supabase
      .from('shipment_alerts')
      .delete()
      .eq('id', alertId);

    if (error) throw error;

    res.json({
      success: true,
      message: 'Alert deleted successfully'
    });
  } catch (error) {
    logger.error('Error deleting alert:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete alert'
    });
  }
});

module.exports = router;