const express = require('express');
const router = express.Router();
const { sendSuccessResponse, sendErrorResponse } = require('../middleware/errorHandler');
const blockchainService = require('../services/blockchainService');
const databaseService = require('../services/databaseService');
const s3Service = require('../services/s3Service');
const logger = require('../utils/logger');

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Health check endpoint
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Service is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     status:
 *                       type: string
 *                       enum: [healthy, unhealthy]
 *                     timestamp:
 *                       type: string
 *                       format: date-time
 *                     services:
 *                       type: object
 *                       properties:
 *                         database:
 *                           type: object
 *                           properties:
 *                             status:
 *                               type: string
 *                             responseTime:
 *                               type: number
 *                         blockchain:
 *                           type: object
 *                           properties:
 *                             status:
 *                               type: string
 *                             network:
 *                               type: string
 *                             blockNumber:
 *                               type: number
 *                         s3:
 *                           type: object
 *                           properties:
 *                             status:
 *                               type: string
 *                             bucket:
 *                               type: string
 *       503:
 *         description: Service is unhealthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 error:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     status:
 *                       type: string
 *                       enum: [unhealthy]
 *                     timestamp:
 *                       type: string
 *                       format: date-time
 *                     services:
 *                       type: object
 */
router.get('/', async (req, res) => {
  const startTime = Date.now();
  const healthCheck = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: {}
  };

  let overallStatus = 'healthy';

  try {
    // Check database service
    const dbStartTime = Date.now();
    try {
      await databaseService.testConnection();
      healthCheck.services.database = {
        status: 'healthy',
        responseTime: Date.now() - dbStartTime
      };
    } catch (error) {
      healthCheck.services.database = {
        status: 'unhealthy',
        error: error.message,
        responseTime: Date.now() - dbStartTime
      };
      overallStatus = 'unhealthy';
    }

    // Check blockchain service
    const blockchainStartTime = Date.now();
    try {
      const networkInfo = await blockchainService.getNetworkInfo();
      healthCheck.services.blockchain = {
        status: 'healthy',
        network: networkInfo.name,
        chainId: networkInfo.chainId,
        blockNumber: networkInfo.blockNumber,
        responseTime: Date.now() - blockchainStartTime
      };
    } catch (error) {
      healthCheck.services.blockchain = {
        status: 'unhealthy',
        error: error.message,
        responseTime: Date.now() - blockchainStartTime
      };
      overallStatus = 'unhealthy';
    }

    // Check S3 service
    const s3StartTime = Date.now();
    try {
      await s3Service.testConnection();
      const bucketInfo = await s3Service.getBucketInfo();
      healthCheck.services.s3 = {
        status: 'healthy',
        bucket: bucketInfo.name,
        region: bucketInfo.region,
        responseTime: Date.now() - s3StartTime
      };
    } catch (error) {
      healthCheck.services.s3 = {
        status: 'unhealthy',
        error: error.message,
        responseTime: Date.now() - s3StartTime
      };
      overallStatus = 'unhealthy';
    }

    // Add overall response time
    healthCheck.responseTime = Date.now() - startTime;
    healthCheck.status = overallStatus;

    // Log health check
    logger.info('Health check completed', {
      status: overallStatus,
      responseTime: healthCheck.responseTime,
      services: healthCheck.services
    });

    if (overallStatus === 'healthy') {
      sendSuccessResponse(res, healthCheck, 'Service is healthy');
    } else {
      res.status(503).json({
        success: false,
        error: 'Service is unhealthy',
        data: healthCheck
      });
    }
  } catch (error) {
    logger.error('Health check failed:', error);

    healthCheck.status = 'unhealthy';
    healthCheck.error = error.message;
    healthCheck.responseTime = Date.now() - startTime;

    res.status(503).json({
      success: false,
      error: 'Health check failed',
      data: healthCheck
    });
  }
});

/**
 * @swagger
 * /health/ready:
 *   get:
 *     summary: Readiness check endpoint
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Service is ready
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     status:
 *                       type: string
 *                       enum: [ready]
 *                     timestamp:
 *                       type: string
 *                       format: date-time
 *       503:
 *         description: Service is not ready
 */
router.get('/ready', async (req, res) => {
  try {
    // Check if all critical services are initialized
    const checks = [
      databaseService.isInitialized,
      blockchainService.isInitialized,
      s3Service.isInitialized
    ];

    const allReady = checks.every((check) => check === true);

    if (allReady) {
      sendSuccessResponse(res, {
        status: 'ready',
        timestamp: new Date().toISOString()
      }, 'Service is ready');
    } else {
      res.status(503).json({
        success: false,
        error: 'Service is not ready',
        data: {
          status: 'not ready',
          timestamp: new Date().toISOString(),
          services: {
            database: databaseService.isInitialized,
            blockchain: blockchainService.isInitialized,
            s3: s3Service.isInitialized
          }
        }
      });
    }
  } catch (error) {
    logger.error('Readiness check failed:', error);
    res.status(503).json({
      success: false,
      error: 'Readiness check failed',
      data: {
        status: 'not ready',
        timestamp: new Date().toISOString(),
        error: error.message
      }
    });
  }
});

/**
 * @swagger
 * /health/live:
 *   get:
 *     summary: Liveness check endpoint
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Service is alive
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     status:
 *                       type: string
 *                       enum: [alive]
 *                     timestamp:
 *                       type: string
 *                       format: date-time
 *                     uptime:
 *                       type: number
 *       503:
 *         description: Service is not alive
 */
router.get('/live', (req, res) => {
  const uptime = process.uptime();

  sendSuccessResponse(res, {
    status: 'alive',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(uptime)
  }, 'Service is alive');
});

/**
 * @swagger
 * /health/metrics:
 *   get:
 *     summary: Get service metrics
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Metrics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     system:
 *                       type: object
 *                       properties:
 *                         uptime:
 *                           type: number
 *                         memory:
 *                           type: object
 *                         cpu:
 *                           type: object
 *                     application:
 *                       type: object
 *                       properties:
 *                         version:
 *                           type: string
 *                         environment:
 *                           type: string
 *                         nodeVersion:
 *                           type: string
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/metrics', (req, res) => {
  try {
    const memoryUsage = process.memoryUsage();
    const uptime = process.uptime();

    const metrics = {
      system: {
        uptime: Math.floor(uptime),
        memory: {
          rss: Math.round(memoryUsage.rss / 1024 / 1024), // MB
          heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024), // MB
          heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024), // MB
          external: Math.round(memoryUsage.external / 1024 / 1024) // MB
        },
        cpu: {
          usage: process.cpuUsage()
        }
      },
      application: {
        version: process.env.npm_package_version || '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch
      }
    };

    sendSuccessResponse(res, metrics, 'Metrics retrieved successfully');
  } catch (error) {
    logger.error('Metrics retrieval failed:', error);
    sendErrorResponse(res, 'Failed to retrieve metrics', 500, 'METRICS_ERROR');
  }
});

module.exports = router;
