const express = require('express');
const cors = require('cors');
const path = require('path');
const WebSocket = require('ws');
const http = require('http');

// Import route modules
const recallRoutes = require('./routes/recalls');
const counterfeitRoutes = require('./routes/counterfeit');

// Add error handling for missing dependencies
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Get port from environment variable or use default
const PORT = process.env.API_PORT || process.env.PORT || 3001;

// CORS configuration for local and GitHub Codespaces
const corsOptions = {
  origin: [
    'https://verbose-tribble-7vxrwqqxr4g5fr9j5-3000.app.github.dev',
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'https://*.app.github.dev',
    'http://localhost:3001',
    'http://127.0.0.1:3001'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

app.use(express.json({ limit: '10mb' }));
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

// Mount API routes
app.use('/api/recalls', recallRoutes);
app.use('/api/counterfeit', counterfeitRoutes);

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
server.listen(PORT, () => {
  console.log(`🚀 PharbitChain API Server running on port ${PORT}`);
  console.log('📡 Available endpoints:');
  console.log('  - GET  /health              - Health check');
  console.log('  - GET  /api/websocket       - WebSocket info');
  console.log('  - GET  /api/recalls         - Get all recalls');
  console.log('  - POST /api/recalls/initiate - Initiate new recall');
  console.log('  - GET  /api/counterfeit     - Get counterfeit reports');
  console.log('🔌 WebSocket available at:');
  console.log(`  - ws://localhost:${PORT} (local)`);
  console.log(`  - wss://${process.env.CODESPACE_NAME || 'your-codespace'}-${PORT}.app.github.dev (GitHub Codespaces)`);
});