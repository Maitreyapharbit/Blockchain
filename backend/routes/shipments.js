const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const { supabase } = require('../config/supabase');
const fs = require('fs');
const path = require('path');
const { randomUUID } = require('crypto');
const router = express.Router();
const crypto = require('crypto');
const { createAndBroadcastTx } = require('../lib/blockchain');

// Middleware to check authentication (optional)
const authenticateUser = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      // No token provided, continue with anonymous user
      req.user = { id: 'anonymous', email: 'anonymous@pharbit.com' };
      return next();
    }

    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) {
      // Invalid token, but don't reject - use anonymous user
      req.user = { id: 'anonymous', email: 'anonymous@pharbit.com' };
      return next();
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    // Fallback to anonymous user on error
    req.user = { id: 'anonymous', email: 'anonymous@pharbit.com' };
    next();
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
    body('batch_id').notEmpty().withMessage('batch_id is required'),
    body('tracking_number').isLength({ min: 1, max: 50 }).withMessage('Tracking number is required'),
    body('origin_location').isLength({ min: 1, max: 255 }).withMessage('Origin location is required'),
    body('destination_location').isLength({ min: 1, max: 255 }).withMessage('Destination location is required'),
    body('expected_delivery_date').optional().isISO8601().withMessage('Invalid date format'),
    body('temperature_min').optional().isDecimal().withMessage('Temperature must be a decimal'),
    body('temperature_max').optional().isDecimal().withMessage('Temperature must be a decimal'),
    body('humidity_min').optional().isDecimal().withMessage('Humidity must be a decimal'),
    body('humidity_max').optional().isDecimal().withMessage('Humidity must be a decimal'),
    body('metadata').optional().isObject().withMessage('Metadata must be an object')
    ,
    // Price transparency fields (required)
    body('seller_id').exists().notEmpty().withMessage('seller_id is required'),
    body('price').exists().notEmpty().isDecimal().withMessage('price must be a decimal'),
    body('currency').optional().isLength({ min: 3, max: 3 }).withMessage('currency must be a 3-letter code')
  ],
  handleValidationErrors,
  async (req, res) => {
    let shipmentData = null;
    try {
      // Enforce presence of price transparency fields (server-side fail-safe)
      if (!req.body.seller_id || typeof req.body.price === 'undefined' || req.body.price === null) {
        return res.status(400).json({ error: 'seller_id and price are required when creating a shipment' });
      }
      shipmentData = {
        ...req.body,
        created_by: req.user.id,
        status: 'pending'
      };

      const { data, error } = await supabase
        .from('shipments')
        .insert([shipmentData])
        .select()
        .single();

      if (error) {
        console.error('Supabase error creating shipment:', error);
        throw error;
      }

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

      // If price transparency fields were provided, create a price record and anchor it on-chain
      try {
        const { seller_id, price, currency } = req.body;
        if (seller_id && price) {
          const productId = data.batch_id || data.batchId || null;
          const priceRecord = {
            product_id: productId,
            seller_id: seller_id,
            price: price,
            currency: currency || 'USD',
            effective_at: new Date().toISOString()
          };

          // Insert into price_records table for indexing (best-effort)
          let prData = null;
          try {
            const insertRes = await supabase.from('price_records').insert([priceRecord]).select().single();
            if (insertRes.error) {
              console.warn('Failed to insert price_records during shipment creation:', insertRes.error.message || insertRes.error);
            } else {
              prData = insertRes.data;
            }
          } catch (err) {
            console.warn('Error inserting price_record during shipment creation:', err.message || err);
          }

          // Always create an on-chain anchor for the price record (best-effort)
          try {
            const tx = {
              type: 'PRICE_RECORD',
              productId: productId,
              sellerId: seller_id,
              price: price,
              currency: currency || 'USD',
              effectiveAt: priceRecord.effective_at
            };
            const txResult = createAndBroadcastTx(tx);
            if (txResult && txResult.hash && prData && prData.id) {
              try { await supabase.from('price_records').update({ tx_hash: txResult.hash }).eq('id', prData.id); } catch (e) { console.warn('Failed to update tx_hash after insert', e.message || e); }
            }
          } catch (err) {
            console.warn('Failed to create on-chain price anchor during shipment creation:', err.message || err);
          }
        }
      } catch (err) {
        console.warn('Price transparency post-processing error:', err.message || err);
      }

      res.status(201).json({
        success: true,
        data,
        message: 'Shipment created successfully'
      });
    } catch (error) {
      console.error('Error creating shipment:', error);

      const message = (error && error.message) ? error.message.toString() : '';
      // Fall back to local storage if Supabase is unreachable or returns known errors
      const shouldFallback = (
        message.toLowerCase().includes('invalid api key') ||
        message.toLowerCase().includes('missing supabase') ||
        message.toLowerCase().includes('violates foreign key') ||
        message.toLowerCase().includes('invalid input syntax') ||
        // network/DNS errors surfaced by fetch/undici
        message.toLowerCase().includes('fetch failed') ||
        message.toLowerCase().includes('getaddrinfo') ||
        // some libraries wrap the original error in `cause`
        (error && error.cause && typeof error.cause.code === 'string' && (error.cause.code === 'ENOTFOUND' || error.cause.code === 'EAI_AGAIN'))
      );

      if (shouldFallback) {
        try {
          const storageDir = path.join(process.cwd(), 'data');
          if (!fs.existsSync(storageDir)) fs.mkdirSync(storageDir, { recursive: true });
          const filePath = path.join(storageDir, 'local_shipments.json');
          let local = [];
          if (fs.existsSync(filePath)) {
            try { local = JSON.parse(fs.readFileSync(filePath, 'utf8') || '[]'); } catch (e) { local = []; }
          }

          const localShipment = {
            id: randomUUID(),
            ...shipmentData,
            created_at: new Date().toISOString(),
            created_by: req.user?.id || 'anonymous',
            status: 'pending',
            _fallback: true
          };

          local.unshift(localShipment);
          fs.writeFileSync(filePath, JSON.stringify(local, null, 2));

          // If price transparency fields were provided, create on-chain PRICE_RECORD anchor (best-effort)
          try {
            const { seller_id, price, currency } = req.body || {};
            if (seller_id && price) {
              const productId = localShipment.batch_id || localShipment.batchId || null;
              const tx = {
                type: 'PRICE_RECORD',
                productId,
                sellerId: seller_id,
                price: price,
                currency: currency || 'USD',
                effectiveAt: new Date().toISOString()
              };
              const txResult = createAndBroadcastTx(tx);
              if (txResult && txResult.hash) {
                // attach tx hash to the local shipment and update persisted file
                localShipment.price_tx_hash = txResult.hash;
                if (local && local.length && local[0] && local[0].id === localShipment.id) {
                  local[0].price_tx_hash = txResult.hash;
                  try { fs.writeFileSync(filePath, JSON.stringify(local, null, 2)); } catch (e) { console.warn('Failed to update local shipment with tx hash', e); }
                }
              }
            }
          } catch (txErr) {
            console.warn('Failed to create on-chain price anchor for local fallback shipment:', txErr.message || txErr);
          }

          return res.status(201).json({
            success: true,
            data: localShipment,
            message: 'Shipment saved locally (Supabase unavailable)'
          });
        } catch (fsErr) {
          console.error('Failed to persist local shipment fallback:', fsErr);
          return res.status(500).json({ error: 'Failed to create shipment', details: fsErr.message });
        }
      }

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
    query('status').optional().isIn(['pending', 'in_transit', 'in_factory', 'delivered', 'delayed', 'damaged', 'lost']).withMessage('Invalid status'),
    query('search').optional().isLength({ max: 100 }).withMessage('Search term too long')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = Math.min(parseInt(req.query.limit) || 20, 100);
      const offset = (page - 1) * limit;

      // For anonymous users, try to fetch all shipments (or a set) from Supabase without filtering by created_by
      // For authenticated users, filter by their ID
      let query = supabase
        .from('shipments')
        .select(`
          *,
          batches(id, batch_number, drug_name)
        `)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      // Only filter by created_by if user has a real ID (not 'anonymous')
      if (req.user && req.user.id && req.user.id !== 'anonymous') {
        query = query.eq('created_by', req.user.id);
      }

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
          pages: Math.ceil((count || 0) / limit)
        }
      });
    } catch (error) {
      console.error('Error fetching shipments:', error);

      // If Supabase fails, try local fallback for anonymous users
      if (req.user && req.user.id === 'anonymous') {
        try {
          const storageDir = path.join(process.cwd(), 'data');
          const filePath = path.join(storageDir, 'local_shipments.json');
          let local = [];
          if (fs.existsSync(filePath)) {
            try { local = JSON.parse(fs.readFileSync(filePath, 'utf8') || '[]'); } catch (e) { local = []; }
          }

          return res.json({
            success: true,
            data: local,
            pagination: { page: 1, limit: local.length, total: local.length, pages: 1 },
            message: 'Supabase unavailable; returning local fallback shipments'
          });
        } catch (fsErr) {
          console.error('Failed to read local fallback:', fsErr);
          return res.json({ success: true, data: [], pagination: { page: 1, limit: 0, total: 0, pages: 0 } });
        }
      }

      // For authenticated users or if fallback fails, return error
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
      // Build query for fetching shipment
      let query = supabase
        .from('shipments')
        .select(`
          *,
          batches(id, batch_number, drug_name),
          shipment_events(id, event_type, event_data, location, temperature, humidity, timestamp, created_by),
          shipment_alerts(id, alert_type, severity, title, description, is_resolved, created_at)
        `)
        .eq('id', req.params.id);

      // Only filter by created_by for authenticated users (not anonymous)
      if (req.user && req.user.id && req.user.id !== 'anonymous') {
        query = query.eq('created_by', req.user.id);
      }

      const { data, error } = await query.single();

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
    body('status').isIn(['pending', 'in_transit', 'in_factory', 'delivered', 'delayed', 'damaged', 'lost']).withMessage('Invalid status'),
    body('location').optional().isLength({ max: 255 }).withMessage('Location too long'),
    body('notes').optional().isLength({ max: 1000 }).withMessage('Notes too long')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { id } = req.params;
      const { status, location, notes } = req.body;

      // Get current shipment (allow anonymous users to update any shipment in dev mode)
      let query = supabase
        .from('shipments')
        .select('*')
        .eq('id', id);

      // Only filter by created_by for authenticated users (not anonymous)
      if (req.user && req.user.id && req.user.id !== 'anonymous') {
        query = query.eq('created_by', req.user.id);
      }

      const { data: currentShipment, error: fetchError } = await query.single();

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

      const message = (error && error.message) ? error.message.toString() : '';
      const shouldFallback = (
        message.toLowerCase().includes('fetch failed') ||
        message.toLowerCase().includes('getaddrinfo') ||
        (error && error.cause && typeof error.cause.code === 'string' && (error.cause.code === 'ENOTFOUND' || error.cause.code === 'EAI_AGAIN'))
      );

      if (shouldFallback) {
        try {
          const storageDir = path.join(process.cwd(), 'data');
          if (!fs.existsSync(storageDir)) fs.mkdirSync(storageDir, { recursive: true });
          const filePath = path.join(storageDir, 'local_shipment_updates.json');
          let local = [];
          if (fs.existsSync(filePath)) {
            try { local = JSON.parse(fs.readFileSync(filePath, 'utf8') || '[]'); } catch (e) { local = []; }
          }

          // Build a fallback update record
          const updateRecord = {
            id: req.params.id,
            status: req.body.status,
            location: req.body.location || null,
            notes: req.body.notes || null,
            actual_delivery_date: req.body.actual_delivery_date || null,
            previous_status: null,
            created_by: req.user?.id || 'anonymous',
            requested_at: new Date().toISOString(),
            retry_count: 0,
            _fallback: true
          };

          // Attempt to capture previous_status from current shipment if available
          try {
            if (!updateRecord.previous_status) {
              const existing = local.find(u => u.shipment_id === req.params.id && u.previous_status);
              if (existing) updateRecord.previous_status = existing.previous_status;
            }
          } catch (e) { /* ignore */ }

          // Prepend to queue
          local.unshift(updateRecord);
          fs.writeFileSync(filePath, JSON.stringify(local, null, 2));

          return res.status(201).json({
            success: true,
            data: updateRecord,
            message: 'Status update saved locally (Supabase unavailable)'
          });
        } catch (fsErr) {
          console.error('Failed to persist local status update fallback:', fsErr);
          return res.status(500).json({ error: 'Failed to update shipment status', details: fsErr.message });
        }
      }

      res.status(500).json({
        error: 'Failed to update shipment status',
        details: error.message
      });
    }
  }
);

  // Retry pending local status updates (admin/dev endpoint)
  router.post('/local-updates/retry',
    authenticateUser,
    async (req, res) => {
      try {
        const storageDir = path.join(process.cwd(), 'data');
        const filePath = path.join(storageDir, 'local_shipment_updates.json');
        if (!fs.existsSync(filePath)) {
          return res.json({ success: true, message: 'No local updates to retry', processed: 0 });
        }

        let updates = [];
        try { updates = JSON.parse(fs.readFileSync(filePath, 'utf8') || '[]'); } catch (e) { updates = []; }

        if (!updates.length) {
          return res.json({ success: true, message: 'No local updates to retry', processed: 0 });
        }

        const results = [];
        const remaining = [];

        for (const upd of updates) {
          const sid = upd.shipment_id || upd.id || upd.shipmentId;
          try {
            // attempt to apply the status update to Supabase
            const updateData = { status: upd.status };
            if (upd.actual_delivery_date) updateData.actual_delivery_date = upd.actual_delivery_date;

            const { data, error } = await supabase
              .from('shipments')
              .update(updateData)
              .eq('id', sid)
              .select()
              .single();

            if (error) {
              // cannot apply now; increment retry_count and keep it
              upd.retry_count = (upd.retry_count || 0) + 1;
              remaining.push(upd);
              results.push({ shipment_id: upd.shipment_id, ok: false, error: error.message });
              continue;
            }

            // create shipment_event to record status change
            await supabase.from('shipment_events').insert([{
              shipment_id: sid,
              event_type: upd.status,
              event_data: {
                previous_status: upd.previous_status || null,
                new_status: upd.status,
                location: upd.location || null,
                notes: upd.notes || null
              },
              location: upd.location || null,
              created_by: upd.created_by || 'system'
            }]);

            results.push({ id: sid, ok: true, data });
          } catch (err) {
            // treat as transient and keep for retry
            upd.retry_count = (upd.retry_count || 0) + 1;
            remaining.push(upd);
            results.push({ id: sid, ok: false, error: err.message });
          }
        }

        // write remaining back to file
        try {
          if (!fs.existsSync(storageDir)) fs.mkdirSync(storageDir, { recursive: true });
          fs.writeFileSync(filePath, JSON.stringify(remaining, null, 2));
        } catch (werr) {
          console.error('Failed to write remaining local updates:', werr);
        }

        res.json({ success: true, processed: results.length, results });
      } catch (error) {
        console.error('Error retrying local updates:', error);
        res.status(500).json({ error: 'Failed to retry local updates', details: error.message });
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

// Helper: retry pending local updates (used by admin endpoint and background worker)
async function retryPendingLocalUpdates() {
  const storageDir = path.join(process.cwd(), 'data');
  const filePath = path.join(storageDir, 'local_shipment_updates.json');
  if (!fs.existsSync(filePath)) {
    return { success: true, message: 'No local updates to retry', processed: 0, results: [] };
  }

  let updates = [];
  try { updates = JSON.parse(fs.readFileSync(filePath, 'utf8') || '[]'); } catch (e) { updates = []; }

  if (!updates.length) {
    return { success: true, message: 'No local updates to retry', processed: 0, results: [] };
  }

  const results = [];
  const remaining = [];

  for (const upd of updates) {
    const sid = upd.shipment_id || upd.id || upd.shipmentId;
    try {
      const updateData = { status: upd.status };
      if (upd.actual_delivery_date) updateData.actual_delivery_date = upd.actual_delivery_date;

      const { data, error } = await supabase
        .from('shipments')
        .update(updateData)
        .eq('id', sid)
        .select()
        .single();

      if (error) {
        upd.retry_count = (upd.retry_count || 0) + 1;
        remaining.push(upd);
        results.push({ id: sid, ok: false, error: error.message });
        continue;
      }

      await supabase.from('shipment_events').insert([{
        shipment_id: sid,
        event_type: upd.status,
        event_data: {
          previous_status: upd.previous_status || null,
          new_status: upd.status,
          location: upd.location || null,
          notes: upd.notes || null
        },
        location: upd.location || null,
        created_by: upd.created_by || 'system'
      }]);

      results.push({ id: sid, ok: true, data });
    } catch (err) {
      upd.retry_count = (upd.retry_count || 0) + 1;
      remaining.push(upd);
      results.push({ id: sid, ok: false, error: err.message });
    }
  }

  try {
    if (!fs.existsSync(storageDir)) fs.mkdirSync(storageDir, { recursive: true });
    fs.writeFileSync(filePath, JSON.stringify(remaining, null, 2));
  } catch (werr) {
    console.error('Failed to write remaining local updates:', werr);
  }

  return { success: true, processed: results.length, results };
}

module.exports = router;
module.exports.retryPendingLocalUpdates = retryPendingLocalUpdates;