const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
require('express-async-errors');

// Import configuration
const config = require('./config/env');
const logger = require('./utils/logger');

// Import middleware
const { errorHandler } = require('./middleware/errorHandler');

// Import routes
const authRoutes = require('./routes/auth');
const batchRoutes = require('./routes/batches');
const complianceRoutes = require('./routes/compliance');
const fileRoutes = require('./routes/files');
const walletRoutes = require('./routes/wallets');
const healthRoutes = require('./routes/health');
const recallRoutes = require('./routes/recalls');
const counterfeitRoutes = require('./routes/counterfeit');
const shipmentsRoutes = require('./routes/shipments');
const pricingRoutes = require('./routes/pricing');
const calibrationRoutes = require('./routes/calibration');

const app = express();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ['\'self\''],
      styleSrc: ['\'self\'', '\'unsafe-inline\''],
      scriptSrc: ['\'self\''],
      imgSrc: ['\'self\'', 'data:', 'https:'],
    },
  },
}));

// CORS configuration
// Use dynamic CORS handling to support github.dev preview URLs and configured origin
app.use((req, res, next) => {
  const origin = req.get('Origin');

  const envOrigin = config.cors.origin;
  const localOrigins = ['http://localhost:3000', 'http://127.0.0.1:3000'];
  const isGitHubDev = origin && (origin.endsWith('.app.github.dev') || origin.endsWith('.github.dev'));

  if (!origin || isGitHubDev || localOrigins.indexOf(origin) !== -1 || (envOrigin && origin === envOrigin)) {
    // Reflect the origin to allow credentials
    if (origin) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Access-Control-Allow-Credentials', String(config.cors.credentials));
      res.setHeader('Vary', 'Origin');
    }
    res.setHeader('Access-Control-Expose-Headers', 'Content-Range,X-Content-Range');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS,PATCH');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization,X-Requested-With,Accept');
    // Handle preflight
    if (req.method === 'OPTIONS') return res.sendStatus(200);
    return next();
  }

  // Not allowed
  res.status(403).json({ success: false, error: 'Not allowed by CORS' });
});

// Rate limiting
const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_ERROR',
      message: 'Too many requests, please try again later.',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression middleware
app.use(compression());

// Logging middleware
if (config.env === 'development') {
  app.use(morgan('combined', { stream: { write: (message) => logger.info(message.trim()) } }));
}

// Health check endpoint (before rate limiting)
app.use('/health', healthRoutes);

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/batches', batchRoutes);
app.use('/api/compliance', complianceRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/wallets', walletRoutes);
app.use('/api/recalls', recallRoutes);
app.use('/api/counterfeit', counterfeitRoutes);
app.use('/api/shipments', shipmentsRoutes);
app.use('/api/pricing', pricingRoutes);
app.use('/api/calibration', calibrationRoutes);

// CORS diagnostic endpoint
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

// API documentation
if (config.env === 'development') {
  const swaggerUi = require('swagger-ui-express');
  const swaggerSpec = require('./utils/swagger');
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'PharbitChain API Documentation',
  }));
}

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'PharbitChain API Server',
    version: '1.0.0',
    environment: config.env,
    timestamp: new Date().toISOString(),
    endpoints: {
      health: '/health',
      api: '/api',
      docs: config.env === 'development' ? '/api/docs' : 'Not available in production',
    },
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
app.use(errorHandler);

// Start server
const PORT = config.port;
const HOST = config.host;

const server = app.listen(PORT, HOST, () => {
  logger.info(`PharbitChain API Server running on http://${HOST}:${PORT}`);
  logger.info(`Environment: ${config.env}`);
  logger.info(`Health check: http://${HOST}:${PORT}/health`);
  if (config.env === 'development') {
    logger.info(`API Documentation: http://${HOST}:${PORT}/api/docs`);
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => {
    logger.info('Process terminated');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  server.close(() => {
    logger.info('Process terminated');
    process.exit(0);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

module.exports = app;
