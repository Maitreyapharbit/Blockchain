const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const { supabase } = require('../config/supabase');
const router = express.Router();

// Middleware to check authentication
const authenticateUser = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(401).json({ error: 'Authentication failed' });
  }
};

// Validation middleware
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array()
    });
  }
  next();
};

// Create a new shipment
router.post('/', 
  authenticateUser,
  [
    body('batch_id').isUUID().withMessage('Valid batch_id is required'),
    body('tracking_number').isLength({ min: 1, max: 50 }).withMessage('Tracking number is required'),
    body('origin_location').isLength({ min: 1, max: 255 }).withMessage('Origin location is required'),
    body('destination_location').isLength({ min: 1, max: 255 }).withMessage('Destination location is required'),
    body('expected_delivery_date').optional().isISO8601().withMessage('Invalid date format'),
    body('temperature_min').optional().isDecimal().withMessage('Temperature must be a decimal'),
    body('temperature_max').optional().isDecimal().withMessage('Temperature must be a decimal'),
    body('humidity_min').optional().isDecimal().withMessage('Humidity must be a decimal'),
    body('humidity_max').optional().isDecimal().withMessage('Humidity must be a decimal'),
    body('metadata').optional().isObject().withMessage('Metadata must be an object')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const shipmentData = {
        ...req.body,
        created_by: req.user.id,
        status: 'pending'
      };

      const { data, error } = await supabase
        .from('shipments')
        .insert([shipmentData])
        .select()
        .single();

      if (error) throw error;

      // Create initial event
      await supabase
        .from('shipment_events')
        .insert([{
          shipment_id: data.id,
          event_type: 'created',
          event_data: {
            tracking_number: data.tracking_number,
            origin: data.origin_location,
            destination: data.destination_location
          },
          created_by: req.user.id
        }]);

      res.status(201).json({
        success: true,
        data,
        message: 'Shipment created successfully'
      });
    } catch (error) {
      console.error('Error creating shipment:', error);
      res.status(500).json({
        error: 'Failed to create shipment',
        details: error.message
      });
    }
  }
);

// Get all shipments for a user
router.get('/',
  authenticateUser,
  [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('status').optional().isIn(['pending', 'in_transit', 'delivered', 'delayed', 'damaged', 'lost']).withMessage('Invalid status'),
    query('search').optional().isLength({ max: 100 }).withMessage('Search term too long')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = Math.min(parseInt(req.query.limit) || 20, 100);
      const offset = (page - 1) * limit;

      let query = supabase
        .from('shipments')
        .select(`
          *,
          batches!inner(id, batch_number, product_name)
        `)
        .eq('created_by', req.user.id)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      // Apply filters
      if (req.query.status) {
        query = query.eq('status', req.query.status);
      }

      if (req.query.search) {
        query = query.or(`tracking_number.ilike.%${req.query.search}%,origin_location.ilike.%${req.query.search}%,destination_location.ilike.%${req.query.search}%`);
      }

      const { data, error, count } = await query;

      if (error) throw error;

      res.json({
        success: true,
        data: data || [],
        pagination: {
          page,
          limit,
          total: count,
          pages: Math.ceil(count / limit)
        }
      });
    } catch (error) {
      console.error('Error fetching shipments:', error);
      res.status(500).json({
        error: 'Failed to fetch shipments',
        details: error.message
      });
    }
  }
);

// Get a specific shipment
router.get('/:id',
  authenticateUser,
  [
    param('id').isUUID().withMessage('Valid shipment ID is required')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { data, error } = await supabase
        .from('shipments')
        .select(`
          *,
          batches!inner(id, batch_number, product_name),
          shipment_events(id, event_type, event_data, location, temperature, humidity, timestamp, created_by),
          shipment_alerts(id, alert_type, severity, title, description, is_resolved, created_at)
        `)
        .eq('id', req.params.id)
        .eq('created_by', req.user.id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return res.status(404).json({ error: 'Shipment not found' });
        }
        throw error;
      }

      res.json({
        success: true,
        data
      });
    } catch (error) {
      console.error('Error fetching shipment:', error);
      res.status(500).json({
        error: 'Failed to fetch shipment',
        details: error.message
      });
    }
  }
);

// Update shipment status
router.patch('/:id/status',
  authenticateUser,
  [
    param('id').isUUID().withMessage('Valid shipment ID is required'),
    body('status').isIn(['pending', 'in_transit', 'delivered', 'delayed', 'damaged', 'lost']).withMessage('Invalid status'),
    body('location').optional().isLength({ max: 255 }).withMessage('Location too long'),
    body('notes').optional().isLength({ max: 1000 }).withMessage('Notes too long')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { id } = req.params;
      const { status, location, notes } = req.body;

      // Get current shipment
      const { data: currentShipment, error: fetchError } = await supabase
        .from('shipments')
        .select('*')
        .eq('id', id)
        .eq('created_by', req.user.id)
        .single();

      if (fetchError) {
        if (fetchError.code === 'PGRST116') {
          return res.status(404).json({ error: 'Shipment not found' });
        }
        throw fetchError;
      }

      // Update shipment
      const updateData = { status };
      if (status === 'delivered') {
        updateData.actual_delivery_date = new Date().toISOString();
      }

      const { data, error } = await supabase
        .from('shipments')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // Create status change event
      await supabase
        .from('shipment_events')
        .insert([{
          shipment_id: id,
          event_type: status,
          event_data: {
            previous_status: currentShipment.status,
            new_status: status,
            location,
            notes
          },
          location,
          created_by: req.user.id
        }]);

      res.json({
        success: true,
        data,
        message: 'Shipment status updated successfully'
      });
    } catch (error) {
      console.error('Error updating shipment status:', error);
      res.status(500).json({
        error: 'Failed to update shipment status',
        details: error.message
      });
    }
  }
);

// Add temperature reading
router.post('/:id/temperature',
  authenticateUser,
  [
    param('id').isUUID().withMessage('Valid shipment ID is required'),
    body('temperature').isDecimal().withMessage('Temperature is required and must be a decimal'),
    body('humidity').optional().isDecimal().withMessage('Humidity must be a decimal'),
    body('location').optional().isLength({ max: 255 }).withMessage('Location too long'),
    body('sensor_id').optional().isLength({ max: 100 }).withMessage('Sensor ID too long')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { id } = req.params;
      const { temperature, humidity, location, sensor_id } = req.body;

      // Verify shipment exists and belongs to user
      const { data: shipment, error: fetchError } = await supabase
        .from('shipments')
        .select('*')
        .eq('id', id)
        .eq('created_by', req.user.id)
        .single();

      if (fetchError) {
        if (fetchError.code === 'PGRST116') {
          return res.status(404).json({ error: 'Shipment not found' });
        }
        throw fetchError;
      }

      // Add temperature reading (triggers will handle anomaly detection)
      const { data, error } = await supabase
        .from('temperature_readings')
        .insert([{
          shipment_id: id,
          temperature: parseFloat(temperature),
          humidity: humidity ? parseFloat(humidity) : null,
          location,
          sensor_id,
          metadata: {
            recorded_by: req.user.id,
            timestamp: new Date().toISOString()
          }
        }])
        .select()
        .single();

      if (error) throw error;

      // Update current temperature in shipment
      await supabase
        .from('shipments')
        .update({ current_temperature: parseFloat(temperature) })
        .eq('id', id);

      // Create temperature check event
      await supabase
        .from('shipment_events')
        .insert([{
          shipment_id: id,
          event_type: 'temperature_check',
          event_data: {
            temperature: parseFloat(temperature),
            humidity: humidity ? parseFloat(humidity) : null,
            location,
            sensor_id
          },
          temperature: parseFloat(temperature),
          humidity: humidity ? parseFloat(humidity) : null,
          location,
          created_by: req.user.id
        }]);

      res.json({
        success: true,
        data,
        message: 'Temperature reading recorded successfully'
      });
    } catch (error) {
      console.error('Error recording temperature:', error);
      res.status(500).json({
        error: 'Failed to record temperature reading',
        details: error.message
      });
    }
  }
);

// Add location update
router.post('/:id/location',
  authenticateUser,
  [
    param('id').isUUID().withMessage('Valid shipment ID is required'),
    body('location').isLength({ min: 1, max: 255 }).withMessage('Location is required'),
    body('notes').optional().isLength({ max: 1000 }).withMessage('Notes too long')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { id } = req.params;
      const { location, notes } = req.body;

      // Verify shipment exists and belongs to user
      const { data: shipment, error: fetchError } = await supabase
        .from('shipments')
        .select('*')
        .eq('id', id)
        .eq('created_by', req.user.id)
        .single();

      if (fetchError) {
        if (fetchError.code === 'PGRST116') {
          return res.status(404).json({ error: 'Shipment not found' });
        }
        throw fetchError;
      }

      // Create location update event
      const { data, error } = await supabase
        .from('shipment_events')
        .insert([{
          shipment_id: id,
          event_type: 'location_update',
          event_data: {
            location,
            notes,
            previous_location: shipment.current_location
          },
          location,
          created_by: req.user.id
        }])
        .select()
        .single();

      if (error) throw error;

      res.json({
        success: true,
        data,
        message: 'Location updated successfully'
      });
    } catch (error) {
      console.error('Error updating location:', error);
      res.status(500).json({
        error: 'Failed to update location',
        details: error.message
      });
    }
  }
);

// Get alerts for a shipment
router.get('/:id/alerts',
  authenticateUser,
  [
    param('id').isUUID().withMessage('Valid shipment ID is required'),
    query('resolved').optional().isBoolean().withMessage('Resolved must be a boolean')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { id } = req.params;
      const { resolved } = req.query;

      // Verify shipment exists and belongs to user
      const { data: shipment, error: fetchError } = await supabase
        .from('shipments')
        .select('id')
        .eq('id', id)
        .eq('created_by', req.user.id)
        .single();

      if (fetchError) {
        if (fetchError.code === 'PGRST116') {
          return res.status(404).json({ error: 'Shipment not found' });
        }
        throw fetchError;
      }

      let query = supabase
        .from('shipment_alerts')
        .select('*')
        .eq('shipment_id', id)
        .order('created_at', { ascending: false });

      if (resolved !== undefined) {
        query = query.eq('is_resolved', resolved === 'true');
      }

      const { data, error } = await query;

      if (error) throw error;

      res.json({
        success: true,
        data: data || []
      });
    } catch (error) {
      console.error('Error fetching alerts:', error);
      res.status(500).json({
        error: 'Failed to fetch alerts',
        details: error.message
      });
    }
  }
);

// Resolve an alert
router.patch('/alerts/:alertId/resolve',
  authenticateUser,
  [
    param('alertId').isUUID().withMessage('Valid alert ID is required'),
    body('notes').optional().isLength({ max: 1000 }).withMessage('Notes too long')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { alertId } = req.params;
      const { notes } = req.body;

      // Verify alert exists and belongs to user's shipment
      const { data: alert, error: fetchError } = await supabase
        .from('shipment_alerts')
        .select(`
          *,
          shipments!inner(created_by)
        `)
        .eq('id', alertId)
        .eq('shipments.created_by', req.user.id)
        .single();

      if (fetchError) {
        if (fetchError.code === 'PGRST116') {
          return res.status(404).json({ error: 'Alert not found' });
        }
        throw fetchError;
      }

      const { data, error } = await supabase
        .from('shipment_alerts')
        .update({
          is_resolved: true,
          resolved_at: new Date().toISOString(),
          resolved_by: req.user.id,
          metadata: {
            ...alert.metadata,
            resolution_notes: notes
          }
        })
        .eq('id', alertId)
        .select()
        .single();

      if (error) throw error;

      res.json({
        success: true,
        data,
        message: 'Alert resolved successfully'
      });
    } catch (error) {
      console.error('Error resolving alert:', error);
      res.status(500).json({
        error: 'Failed to resolve alert',
        details: error.message
      });
    }
  }
);

// Get shipment statistics
router.get('/stats/overview',
  authenticateUser,
  async (req, res) => {
    try {
      const { data: shipments, error: shipmentsError } = await supabase
        .from('shipments')
        .select('status, created_at')
        .eq('created_by', req.user.id);

      if (shipmentsError) throw shipmentsError;

      const { data: alerts, error: alertsError } = await supabase
        .from('shipment_alerts')
        .select('severity, is_resolved, created_at')
        .eq('shipments.created_by', req.user.id)
        .join('shipments', 'shipment_alerts.shipment_id', 'shipments.id');

      if (alertsError) throw alertsError;

      const stats = {
        total_shipments: shipments.length,
        shipments_by_status: {},
        total_alerts: alerts.length,
        unresolved_alerts: alerts.filter(alert => !alert.is_resolved).length,
        alerts_by_severity: {},
        recent_shipments: shipments.filter(s => 
          new Date(s.created_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        ).length
      };

      // Count by status
      shipments.forEach(shipment => {
        stats.shipments_by_status[shipment.status] = (stats.shipments_by_status[shipment.status] || 0) + 1;
      });

      // Count alerts by severity
      alerts.forEach(alert => {
        stats.alerts_by_severity[alert.severity] = (stats.alerts_by_severity[alert.severity] || 0) + 1;
      });

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('Error fetching statistics:', error);
      res.status(500).json({
        error: 'Failed to fetch statistics',
        details: error.message
      });
    }
  }
);

module.exports = router;