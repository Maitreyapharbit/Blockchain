const express = require('express');
const router = express.Router();
const { authenticate, generateToken } = require('../middleware/auth');
const { asyncHandler, sendSuccessResponse, sendErrorResponse } = require('../middleware/errorHandler');
const databaseService = require('../services/databaseService');
const logger = require('../utils/logger');

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register new user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterRequest'
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *                 token:
 *                   type: string
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       409:
 *         $ref: '#/components/responses/Conflict'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.post('/register',
  asyncHandler(async (req, res) => {
    const { address, role = 'user', permissions = [] } = req.body;

    if (!address) {
      return sendErrorResponse(res, 'Address is required', 400, 'ADDRESS_REQUIRED');
    }

    // Check if user already exists
    const existingUser = await databaseService.getUserByAddress(address);
    if (existingUser) {
      return sendErrorResponse(res, 'User already exists', 409, 'USER_EXISTS');
    }

    // Create new user
    const userData = {
      address: address.toLowerCase(),
      role,
      permissions,
      metadata: {}
    };

    const user = await databaseService.createUser(userData);

    // Generate JWT token
    const token = generateToken({
      id: user.id,
      address: user.address,
      role: user.role,
      permissions: user.permissions
    });

    logger.audit('register_user', 'user', user.id, {
      address: user.address,
      role: user.role
    });

    sendSuccessResponse(res, {
      user: {
        id: user.id,
        address: user.address,
        role: user.role,
        permissions: user.permissions,
        createdAt: user.created_at
      },
      token
    }, 'User registered successfully', 201);
  })
);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: User logged in successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *                 token:
 *                   type: string
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.post('/login',
  asyncHandler(async (req, res) => {
    const { address } = req.body;

    if (!address) {
      return sendErrorResponse(res, 'Address is required', 400, 'ADDRESS_REQUIRED');
    }

    // Get user by address
    const user = await databaseService.getUserByAddress(address);
    if (!user) {
      return sendErrorResponse(res, 'User not found', 401, 'USER_NOT_FOUND');
    }

    // Generate JWT token
    const token = generateToken({
      id: user.id,
      address: user.address,
      role: user.role,
      permissions: user.permissions
    });

    logger.audit('login_user', 'user', user.id, {
      address: user.address
    });

    sendSuccessResponse(res, {
      user: {
        id: user.id,
        address: user.address,
        role: user.role,
        permissions: user.permissions,
        createdAt: user.created_at
      },
      token
    }, 'User logged in successfully');
  })
);

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Get current user
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/me',
  authenticate,
  asyncHandler(async (req, res) => {
    const user = await databaseService.getUserByAddress(req.user.address);
    if (!user) {
      return sendErrorResponse(res, 'User not found', 404, 'USER_NOT_FOUND');
    }

    sendSuccessResponse(res, {
      id: user.id,
      address: user.address,
      role: user.role,
      permissions: user.permissions,
      createdAt: user.created_at,
      updatedAt: user.updated_at
    }, 'User retrieved successfully');
  })
);

/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     summary: Refresh JWT token
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Token refreshed successfully
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
 *                     token:
 *                       type: string
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.post('/refresh',
  authenticate,
  asyncHandler(async (req, res) => {
    // Generate new token with same user data
    const token = generateToken({
      id: req.user.id,
      address: req.user.address,
      role: req.user.role,
      permissions: req.user.permissions
    });

    logger.audit('refresh_token', 'user', req.user.id, {
      address: req.user.address
    });

    sendSuccessResponse(res, { token }, 'Token refreshed successfully');
  })
);

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Logout user
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User logged out successfully
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.post('/logout',
  authenticate,
  asyncHandler(async (req, res) => {
    logger.audit('logout_user', 'user', req.user.id, {
      address: req.user.address
    });

    sendSuccessResponse(res, null, 'User logged out successfully');
  })
);

/**
 * @swagger
 * /api/auth/verify:
 *   post:
 *     summary: Verify JWT token
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Token is valid
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
 *                     valid:
 *                       type: boolean
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.post('/verify',
  authenticate,
  asyncHandler(async (req, res) => {
    sendSuccessResponse(res, {
      valid: true,
      user: {
        id: req.user.id,
        address: req.user.address,
        role: req.user.role,
        permissions: req.user.permissions
      }
    }, 'Token is valid');
  })
);

module.exports = router;
