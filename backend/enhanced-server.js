const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();

// Basic middleware
app.use(cors({
  origin: 'http://localhost:3000',
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
    status: 'healthy',
    environment: {
      nodeEnv: process.env.NODE_ENV,
      port: process.env.PORT,
      hasSupabase: !!process.env.SUPABASE_URL,
      hasAWS: !!process.env.AWS_ACCESS_KEY_ID,
      hasInfura: !!process.env.INFURA_PROJECT_ID,
      hasPrivateKey: !!process.env.PRIVATE_KEY
    }
  });
});

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'PharbitChain API Server is running',
    timestamp: new Date().toISOString(),
    status: 'healthy',
    environment: {
      nodeEnv: process.env.NODE_ENV,
      port: process.env.PORT,
      hasSupabase: !!process.env.SUPABASE_URL,
      hasAWS: !!process.env.AWS_ACCESS_KEY_ID,
      hasInfura: !!process.env.INFURA_PROJECT_ID,
      hasPrivateKey: !!process.env.PRIVATE_KEY
    }
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'PharbitChain API Server',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
    endpoints: {
      health: '/health',
      api: '/api',
    },
  });
});

// Import route modules
const shipmentsRoutes = require('./routes/shipments');
const alertsRoutes = require('./routes/alerts');

// API routes
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
      shipments: '/api/shipments',
      alerts: '/api/alerts',
    },
  });
});

// Mount route modules
app.use('/api/shipments', shipmentsRoutes);
app.use('/api/alerts', alertsRoutes);

// Test Supabase connection
app.get('/api/test/supabase', (req, res) => {
  try {
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY
    );
    
    res.json({
      success: true,
      message: 'Supabase client created successfully',
      supabaseUrl: process.env.SUPABASE_URL,
      hasAnonKey: !!process.env.SUPABASE_ANON_KEY,
      hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Test AWS connection
app.get('/api/test/aws', (req, res) => {
  try {
    res.json({
      success: true,
      message: 'AWS configuration loaded successfully',
      region: process.env.AWS_REGION,
      bucket: process.env.AWS_S3_BUCKET,
      hasAccessKey: !!process.env.AWS_ACCESS_KEY_ID,
      hasSecretKey: !!process.env.AWS_SECRET_ACCESS_KEY,
      ec2InstanceId: process.env.EC2_INSTANCE_ID,
      ec2PublicDNS: process.env.EC2_PUBLIC_DNS,
      ec2PublicIP: process.env.EC2_PUBLIC_IP,
      awsCredentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID ? 'Configured' : 'Not configured',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ? 'Configured' : 'Not configured',
        region: process.env.AWS_REGION || 'Not configured'
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Test Ethereum connection
app.get('/api/test/ethereum', (req, res) => {
  try {
    const { ethers } = require('ethers');
    const provider = new ethers.JsonRpcProvider(process.env.ETHEREUM_RPC_URL);
    
    res.json({
      success: true,
      message: 'Ethereum provider created successfully',
      rpcUrl: process.env.ETHEREUM_RPC_URL,
      infuraProjectId: process.env.INFURA_PROJECT_ID,
      hasPrivateKey: !!process.env.PRIVATE_KEY
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Mock API routes for testing
app.get('/api/batches', (req, res) => {
  res.json({
    success: true,
    data: [],
    message: 'Batches endpoint - ready for implementation',
    environment: {
      hasSupabase: !!process.env.SUPABASE_URL,
      hasAWS: !!process.env.AWS_ACCESS_KEY_ID
    }
  });
});

app.get('/api/compliance', (req, res) => {
  res.json({
    success: true,
    data: [],
    message: 'Compliance endpoint - ready for implementation',
    environment: {
      hasSupabase: !!process.env.SUPABASE_URL,
      hasAWS: !!process.env.AWS_ACCESS_KEY_ID
    }
  });
});

app.get('/api/files', (req, res) => {
  res.json({
    success: true,
    data: [],
    message: 'Files endpoint - ready for implementation',
    environment: {
      hasAWS: !!process.env.AWS_ACCESS_KEY_ID,
      bucket: process.env.AWS_S3_BUCKET
    }
  });
});

app.get('/api/wallets', (req, res) => {
  res.json({
    success: true,
    data: [],
    message: 'Wallets endpoint - ready for implementation',
    environment: {
      hasEthereum: !!process.env.ETHEREUM_RPC_URL,
      hasPrivateKey: !!process.env.PRIVATE_KEY
    }
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

// Start server
const PORT = process.env.PORT || 3000; // Use env PORT or default to 3000
const HOST = process.env.HOST || 'localhost';

const server = app.listen(PORT, HOST, () => {
  console.log(`PharbitChain API Server running on http://${HOST}:${PORT}`);
  console.log(`Health check: http://${HOST}:${PORT}/health`);
  console.log(`API Documentation: http://${HOST}:${PORT}/api`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Supabase URL: ${process.env.SUPABASE_URL ? 'Configured' : 'Not configured'}`);
  console.log(`AWS Region: ${process.env.AWS_REGION || 'Not configured'}`);
  console.log(`Ethereum RPC: ${process.env.ETHEREUM_RPC_URL ? 'Configured' : 'Not configured'}`);
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
