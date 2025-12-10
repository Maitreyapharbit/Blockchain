const express = require('express');
const cors = require('cors');
const path = require('path');
const http = require('http');

// Import route modules
const recallRoutes = require('./routes/recalls');
const counterfeitRoutes = require('./routes/counterfeit');
const shipmentsRoutes = require('./routes/shipments');
const pricesRoutes = require('./routes/prices');
// eventsRoutes removed (feature rollback)

// Create Express app and HTTP server
const app = express();
const server = http.createServer(app);

// Simple SSE (EventSource) clients set
const sseClients = new Set();

// Get port from environment variable or use default
const PORT = process.env.API_PORT || process.env.PORT || 3001;

// CORS configuration for local and GitHub Codespaces
const corsOptions = {
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) {
      console.log(`[CORS] Allowing request with no origin`);
      return callback(null, true);
    }

    const envOrigin = process.env.CORS_ORIGIN;
    const localOrigins = [
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      // Allow backend local host origins which can appear when CRA proxy forwards requests
      'http://localhost:3001',
      'http://127.0.0.1:3001',
      // Codespaces frontend origin
      'https://crispy-umbrella-g4wqjxg7rr772xxw-3000.app.github.dev'
    ];
    
    // Check if it's a GitHub Codespaces preview URL
    const isGitHubDev = origin && (origin.includes('.app.github.dev') || origin.includes('.github.dev'));
    
    // Check if it's a local origin
    const isLocalOrigin = localOrigins.includes(origin);
    
    // Check if it matches environment variable
    const isEnvOrigin = envOrigin && origin === envOrigin;

    if (isGitHubDev || isLocalOrigin || isEnvOrigin) {
      console.log(`[CORS] ✓ Allowing origin: ${origin}`);
      return callback(null, true);
    }

    console.log(`[CORS] ✗ Blocked origin: ${origin}`);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  optionsSuccessStatus: 200
};

// Enable CORS pre-flight requests
app.options('*', (req, res) => {
  // Use cors middleware for preflight but reflect allowed origin header
  const origin = req.get('Origin');
  try {
    cors(corsOptions)(req, res, () => {
      res.setHeader('Access-Control-Allow-Origin', origin || '*');
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS,PATCH');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization,X-Requested-With,Accept');
      res.sendStatus(200);
    });
  } catch (err) {
    res.status(403).json({ success: false, error: 'CORS preflight failed' });
  }
});

// Apply CORS middleware (reflect origin on allowed requests)
app.use((req, res, next) => {
  const origin = req.get('Origin');
  cors(corsOptions)(req, res, (err) => {
    if (err) return next(err);
    if (origin) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Access-Control-Allow-Credentials', 'true');
    }
    next();
  });
});

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Mount API routes (both root and /api prefix to support different dev servers / proxies)
app.use('/recalls', recallRoutes);
app.use('/counterfeit', counterfeitRoutes);
app.use('/shipments', shipmentsRoutes);
app.use('/prices', pricesRoutes);
// Also mount under /api for clients expecting /api/ prefixed endpoints
app.use('/api/recalls', recallRoutes);
app.use('/api/counterfeit', counterfeitRoutes);
app.use('/api/shipments', shipmentsRoutes);
app.use('/api/prices', pricesRoutes);

// CORS debug endpoint
app.get('/api/cors-debug', (req, res) => {
  const origin = req.get('Origin');
  res.set('Access-Control-Allow-Origin', origin || '*');
  res.set('Access-Control-Allow-Credentials', 'true');
  res.json({
    origin,
    allowed: !!origin && (origin.endsWith('.app.github.dev') || origin.endsWith('.github.dev')),
    envOrigin: process.env.CORS_ORIGIN,
    message: 'CORS debug info',
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// SSE endpoint for notifications (EventSource clients connect here)
app.get('/notifications/stream', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  // send a comment to establish the stream
  res.write(': connected\n\n');

  // Keep connection alive with periodic comments
  const keepalive = setInterval(() => {
    try { res.write(': keepalive\n\n'); } catch (e) { /* ignore */ }
  }, 20000);

  sseClients.add(res);

  req.on('close', () => {
    clearInterval(keepalive);
    sseClients.delete(res);
  });
});

// Helper to broadcast SSE to all connected clients
function broadcastNotification(event, data) {
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const client of sseClients) {
    try { client.write(payload); } catch (e) { /* ignore broken clients */ }
  }
}

// Test endpoint to push notifications (useful for local testing)
app.post('/notifications/push', (req, res) => {
  const { event = 'message', data = {} } = req.body || {};
  broadcastNotification(event, data);
  res.json({ ok: true });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'PharbitChain API Server is running',
    timestamp: new Date().toISOString(),
    status: 'healthy'
  });
});

// WebSocket removed: inform clients SSE is available instead
app.get('/api/websocket', (req, res) => {
  const host = req.get('host');
  const notificationUrl = `${req.protocol}://${host}/notifications/stream`;
  res.json({
    success: true,
    websocket: null,
    message: 'WebSockets removed; use Server-Sent Events at /notifications/stream',
    notifications: { url: notificationUrl }
  });
});

// CORS diagnostic endpoint (mirror for /api paths)
app.get('/api/cors-debug', (req, res) => {
  res.json({
    success: true,
    origin: req.get('Origin') || null,
    headers: {
      'Access-Control-Request-Method': req.get('Access-Control-Request-Method') || null,
      'Access-Control-Request-Headers': req.get('Access-Control-Request-Headers') || null,
    },
    message: 'CORS debug - server received your request'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Internal Server Error',
    error: err.message
  });
});

// Start the server
server.listen(PORT, () => {
  console.log(`🚀 PharbitChain API Server running on port ${PORT}`);
  console.log('📡 Available endpoints:');
  console.log('  - GET  /health              - Health check');
  console.log('  - GET  /api/websocket       - WebSocket info');
  console.log('  - GET  /api/recalls         - Get all recalls');
  console.log('  - POST /api/recalls/initiate - Initiate new recall');
  console.log('  - GET  /api/counterfeit     - Get counterfeit reports');
  console.log('🔌 Server-Sent Events available at:');
  console.log(`  - http://localhost:${PORT}/notifications/stream (local)`);
  console.log(`  - https://${process.env.CODESPACE_NAME || 'your-codespace'}-${PORT}.app.github.dev/notifications/stream (Codespaces)`);
});

// Background worker: periodic retry of local shipment status updates
try {
  const retryInterval = parseInt(process.env.LOCAL_UPDATES_RETRY_INTERVAL_MS || '300000', 10); // default 5 minutes
  if (typeof shipmentsRoutes.retryPendingLocalUpdates === 'function') {
    // Run once at startup
    (async () => {
      try {
        console.log(`[local-updates] Running initial retry of pending local shipment updates`);
        const result = await shipmentsRoutes.retryPendingLocalUpdates();
        console.log('[local-updates] initial retry result:', result && result.processed ? `${result.processed} processed` : result.message);
      } catch (err) {
        console.error('[local-updates] initial retry failed:', err);
      }
    })();

    // Schedule periodic retries
    setInterval(async () => {
      try {
        console.log('[local-updates] periodic retry triggered');
        const result = await shipmentsRoutes.retryPendingLocalUpdates();
        console.log('[local-updates] periodic retry result:', result && result.processed ? `${result.processed} processed` : result.message);
      } catch (err) {
        console.error('[local-updates] periodic retry failed:', err);
      }
    }, retryInterval);

    console.log(`[local-updates] Scheduled periodic retry every ${retryInterval} ms`);
  }
} catch (err) {
  console.error('[local-updates] Failed to schedule periodic retry:', err);
}