const express = require('express');
const cors = require('cors');
const path = require('path');

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

// Basic middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'PharbitChain API Server is running',
    timestamp: new Date().toISOString(),
    status: 'healthy'
  });
});

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'PharbitChain API Server is running',
    timestamp: new Date().toISOString(),
    status: 'healthy'
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'PharbitChain API Server',
    version: '1.0.0',
    environment: 'development',
    timestamp: new Date().toISOString(),
    endpoints: {
      health: '/health',
      api: '/api',
    },
  });
});

// API Routes
app.use('/api/recalls', recallRoutes);
app.use('/api/counterfeit', counterfeitRoutes);

// Basic API routes
app.get('/api', (req, res) => {
  res.json({
    success: true,
    message: 'PharbitChain API',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      batches: '/api/batches',
      compliance: '/api/compliance',
      files: '/api/files',
      wallets: '/api/wallets',
      recalls: '/api/recalls',
      counterfeit: '/api/counterfeit',
    },
  });
});

// Mock API routes for testing
app.get('/api/batches', (req, res) => {
  res.json({
    success: true,
    data: [],
    message: 'Batches endpoint - not implemented yet'
  });
});

app.get('/api/compliance', (req, res) => {
  res.json({
    success: true,
    data: [],
    message: 'Compliance endpoint - not implemented yet'
  });
});

app.get('/api/files', (req, res) => {
  res.json({
    success: true,
    data: [],
    message: 'Files endpoint - not implemented yet'
  });
});

app.get('/api/wallets', (req, res) => {
  res.json({
    success: true,
    data: [],
    message: 'Wallets endpoint - not implemented yet'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: 'Endpoint not found',
      path: req.originalUrl,
    },
  });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('Global error handler:', error);
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }
  });
});

// Start server
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || 'localhost';

const server = app.listen(PORT, HOST, () => {
  console.log(`PharbitChain API Server running on http://${HOST}:${PORT}`);
  console.log(`Health check: http://${HOST}:${PORT}/health`);
  console.log(`API Documentation: http://${HOST}:${PORT}/api`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Handle server errors
server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Please free the port or use a different port.`);
  } else {
    console.error('Server error:', error);
  }
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
    process.exit(0);
  });
});

module.exports = app;