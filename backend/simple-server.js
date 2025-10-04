const express = require('express');
const cors = require('cors');
const path = require('path');
const WebSocket = require('ws');
const http = require('http');

// Import route modules
const recallRoutes = require('./routes/recalls');
const counterfeitRoutes = require('./routes/counterfeit');

// Create Express app and HTTP server
const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Get port from environment variable or use default
const PORT = process.env.API_PORT || process.env.PORT || 3001;

// CORS configuration for local and GitHub Codespaces
const corsOptions = {
  origin: function(origin, callback) {
    const allowedOrigins = [
      'https://verbose-tribble-7vxrwqqxr4g5fr9j5-3000.app.github.dev',
      'http://localhost:3000',
      'http://127.0.0.1:3000'
    ];
    
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1 || origin.endsWith('.app.github.dev')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  optionsSuccessStatus: 200
};

// Enable CORS pre-flight requests
app.options('*', cors(corsOptions));

// Apply CORS middleware
app.use(cors(corsOptions));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Mount API routes
app.use('/recalls', recallRoutes);
app.use('/counterfeit', counterfeitRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// WebSocket connection handling
wss.on('connection', (ws, req) => {
  console.log('New WebSocket connection from:', req.socket.remoteAddress);
  
  // Send welcome message
  ws.send(JSON.stringify({
    type: 'connection',
    message: 'Connected to PharbitChain WebSocket server',
    timestamp: new Date().toISOString()
  }));
  
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      console.log('Received WebSocket message:', data);
      
      // Echo back the message for testing
      ws.send(JSON.stringify({
        type: 'echo',
        originalMessage: data,
        timestamp: new Date().toISOString()
      }));
    } catch (error) {
      console.error('Error parsing WebSocket message:', error);
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Invalid JSON message',
        timestamp: new Date().toISOString()
      }));
    }
  });

  ws.on('close', (code, reason) => {
    console.log('Client disconnected:', code, reason.toString());
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
});

// Handle WebSocket server errors
wss.on('error', (error) => {
  console.error('WebSocket server error:', error);
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

// WebSocket endpoint info
app.get('/api/websocket', (req, res) => {
  const protocol = req.secure ? 'wss' : 'ws';
  const host = req.get('host');
  const wsUrl = `${protocol}://${host}`;
  
  res.json({
    success: true,
    websocket: {
      url: wsUrl,
      status: 'available',
      connections: wss.clients.size
    }
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
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 PharbitChain API Server running on port ${PORT}`);
  console.log('📡 Available endpoints:');
  console.log('  - GET  /health              - Health check');
  console.log('  - GET  /api/websocket       - WebSocket info');
  console.log('  - GET  /api/recalls         - Get all recalls');
  console.log('  - POST /api/recalls/initiate - Initiate new recall');
  console.log('  - GET  /api/counterfeit     - Get counterfeit reports');
  console.log('🔌 WebSocket available at:');
  console.log(`  - ws://localhost:${PORT} (local)`);
  console.log(`  - wss://verbose-tribble-7vxrwqqxr4g5fr9j5-${PORT}.app.github.dev (GitHub Codespaces)`);
});