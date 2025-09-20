const express = require('express');
const router = express.Router();
const { ethers } = require('ethers');
const crypto = require('crypto');
const { authenticate } = require('../middleware/auth');
const { walletSchemas, validateJoi } = require('../middleware/validation');
const { asyncHandler, sendSuccessResponse, sendErrorResponse } = require('../middleware/errorHandler');
const databaseService = require('../services/databaseService');
const logger = require('../utils/logger');

/**
 * @swagger
 * /api/wallets/generate:
 *   post:
 *     summary: Generate new wallets
 *     tags: [Wallets]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/GenerateWalletsRequest'
 *     responses:
 *       201:
 *         description: Wallets generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Wallet'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.post('/generate',
  authenticate,
  validateJoi(walletSchemas.generate),
  asyncHandler(async (req, res) => {
    const { count = 1 } = req.body;
    const wallets = [];

    for (let i = 0; i < count; i++) {
      // Generate new wallet
      const wallet = ethers.Wallet.createRandom();

      // Encrypt private key and mnemonic
      const encryptionKey = process.env.JWT_SECRET || 'default-encryption-key';
      const privateKeyEncrypted = encrypt(wallet.privateKey, encryptionKey);
      const mnemonicEncrypted = encrypt(wallet.mnemonic.phrase, encryptionKey);

      // Save wallet to database
      const walletData = {
        address: wallet.address,
        private_key_encrypted: privateKeyEncrypted,
        mnemonic_encrypted: mnemonicEncrypted,
        name: `Generated Wallet ${i + 1}`,
        user_id: req.user.id,
        is_active: true
      };

      const dbWallet = await databaseService.createWallet(walletData);

      wallets.push({
        id: dbWallet.id,
        address: wallet.address,
        name: walletData.name,
        isActive: dbWallet.is_active,
        createdAt: dbWallet.created_at
      });
    }

    logger.audit('generate_wallets', 'wallet', req.user.id, {
      count,
      addresses: wallets.map((w) => w.address)
    });

    sendSuccessResponse(res, wallets, 'Wallets generated successfully', 201);
  })
);

/**
 * @swagger
 * /api/wallets/import:
 *   post:
 *     summary: Import existing wallet
 *     tags: [Wallets]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ImportWalletRequest'
 *     responses:
 *       201:
 *         description: Wallet imported successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Wallet'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       409:
 *         $ref: '#/components/responses/Conflict'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.post('/import',
  authenticate,
  validateJoi(walletSchemas.import),
  asyncHandler(async (req, res) => {
    const { privateKey, name } = req.body;

    try {
      // Create wallet from private key
      const wallet = new ethers.Wallet(privateKey);

      // Check if wallet already exists
      const existingWallet = await databaseService.getWallet(wallet.address);
      if (existingWallet) {
        return sendErrorResponse(res, 'Wallet already exists', 409, 'WALLET_EXISTS');
      }

      // Encrypt private key
      const encryptionKey = process.env.JWT_SECRET || 'default-encryption-key';
      const privateKeyEncrypted = encrypt(privateKey, encryptionKey);

      // Save wallet to database
      const walletData = {
        address: wallet.address,
        private_key_encrypted: privateKeyEncrypted,
        mnemonic_encrypted: null, // No mnemonic for imported wallet
        name: name || 'Imported Wallet',
        user_id: req.user.id,
        is_active: true
      };

      const dbWallet = await databaseService.createWallet(walletData);

      logger.audit('import_wallet', 'wallet', req.user.id, {
        address: wallet.address,
        name: walletData.name
      });

      sendSuccessResponse(res, {
        id: dbWallet.id,
        address: wallet.address,
        name: dbWallet.name,
        isActive: dbWallet.is_active,
        createdAt: dbWallet.created_at
      }, 'Wallet imported successfully', 201);
    } catch (error) {
      if (error.code === 'INVALID_ARGUMENT') {
        return sendErrorResponse(res, 'Invalid private key', 400, 'INVALID_PRIVATE_KEY');
      }
      throw error;
    }
  })
);

/**
 * @swagger
 * /api/wallets:
 *   get:
 *     summary: Get user's wallets
 *     tags: [Wallets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: active
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *     responses:
 *       200:
 *         description: Wallets retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Wallet'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/',
  authenticate,
  asyncHandler(async (req, res) => {
    const { active } = req.query;

    let query = databaseService.getClient()
      .from('wallets')
      .select('id, address, name, is_active, created_at')
      .eq('user_id', req.user.id);

    if (active !== undefined) {
      query = query.eq('is_active', active === 'true');
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;

    const wallets = (data || []).map((wallet) => ({
      id: wallet.id,
      address: wallet.address,
      name: wallet.name,
      isActive: wallet.is_active,
      createdAt: wallet.created_at
    }));

    sendSuccessResponse(res, wallets, 'Wallets retrieved successfully');
  })
);

/**
 * @swagger
 * /api/wallets/{address}:
 *   get:
 *     summary: Get wallet by address
 *     tags: [Wallets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: address
 *         required: true
 *         schema:
 *           type: string
 *         description: Wallet address
 *     responses:
 *       200:
 *         description: Wallet retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Wallet'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/:address',
  authenticate,
  asyncHandler(async (req, res) => {
    const { address } = req.params;

    const wallet = await databaseService.getWallet(address);
    if (!wallet) {
      return sendErrorResponse(res, 'Wallet not found', 404, 'WALLET_NOT_FOUND');
    }

    // Check if user owns this wallet
    if (wallet.user_id !== req.user.id) {
      return sendErrorResponse(res, 'Access denied', 403, 'ACCESS_DENIED');
    }

    sendSuccessResponse(res, {
      id: wallet.id,
      address: wallet.address,
      name: wallet.name,
      isActive: wallet.is_active,
      createdAt: wallet.created_at
    }, 'Wallet retrieved successfully');
  })
);

/**
 * @swagger
 * /api/wallets/{address}/balance:
 *   get:
 *     summary: Get wallet balance
 *     tags: [Wallets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: address
 *         required: true
 *         schema:
 *           type: string
 *         description: Wallet address
 *     responses:
 *       200:
 *         description: Balance retrieved successfully
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
 *                     address:
 *                       type: string
 *                     balance:
 *                       type: string
 *                     balanceWei:
 *                       type: string
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/:address/balance',
  authenticate,
  asyncHandler(async (req, res) => {
    const { address } = req.params;

    // Verify wallet exists and user owns it
    const wallet = await databaseService.getWallet(address);
    if (!wallet || wallet.user_id !== req.user.id) {
      return sendErrorResponse(res, 'Wallet not found or access denied', 404, 'WALLET_NOT_FOUND');
    }

    // Get balance from blockchain
    const blockchainService = require('../services/blockchainService');
    const balance = await blockchainService.getBalance(address);

    sendSuccessResponse(res, {
      address,
      balance,
      balanceWei: ethers.parseEther(balance).toString()
    }, 'Balance retrieved successfully');
  })
);

/**
 * @swagger
 * /api/wallets/{address}/export:
 *   post:
 *     summary: Export wallet private key
 *     tags: [Wallets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: address
 *         required: true
 *         schema:
 *           type: string
 *         description: Wallet address
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               password:
 *                 type: string
 *                 description: User password for verification
 *             required:
 *               - password
 *     responses:
 *       200:
 *         description: Wallet exported successfully
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
 *                     address:
 *                       type: string
 *                     privateKey:
 *                       type: string
 *                     mnemonic:
 *                       type: string
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.post('/:address/export',
  authenticate,
  asyncHandler(async (req, res) => {
    const { address } = req.params;
    const { password } = req.body;

    if (!password) {
      return sendErrorResponse(res, 'Password required for wallet export', 400, 'PASSWORD_REQUIRED');
    }

    // Verify wallet exists and user owns it
    const wallet = await databaseService.getWallet(address);
    if (!wallet || wallet.user_id !== req.user.id) {
      return sendErrorResponse(res, 'Wallet not found or access denied', 404, 'WALLET_NOT_FOUND');
    }

    // Decrypt private key and mnemonic
    const encryptionKey = process.env.JWT_SECRET || 'default-encryption-key';
    const privateKey = decrypt(wallet.private_key_encrypted, encryptionKey);
    const mnemonic = wallet.mnemonic_encrypted ? decrypt(wallet.mnemonic_encrypted, encryptionKey) : null;

    logger.audit('export_wallet', 'wallet', req.user.id, {
      address,
      exported: true
    });

    sendSuccessResponse(res, {
      address,
      privateKey,
      mnemonic
    }, 'Wallet exported successfully');
  })
);

/**
 * @swagger
 * /api/wallets/{address}:
 *   put:
 *     summary: Update wallet
 *     tags: [Wallets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: address
 *         required: true
 *         schema:
 *           type: string
 *         description: Wallet address
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: New wallet name
 *               isActive:
 *                 type: boolean
 *                 description: Wallet active status
 *     responses:
 *       200:
 *         description: Wallet updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Wallet'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.put('/:address',
  authenticate,
  asyncHandler(async (req, res) => {
    const { address } = req.params;
    const { name, isActive } = req.body;

    // Verify wallet exists and user owns it
    const wallet = await databaseService.getWallet(address);
    if (!wallet || wallet.user_id !== req.user.id) {
      return sendErrorResponse(res, 'Wallet not found or access denied', 404, 'WALLET_NOT_FOUND');
    }

    // Update wallet
    const { data, error } = await databaseService.getClient()
      .from('wallets')
      .update({
        name: name || wallet.name,
        is_active: isActive !== undefined ? isActive : wallet.is_active,
        updated_at: new Date().toISOString()
      })
      .eq('address', address)
      .select()
      .single();

    if (error) throw error;

    logger.audit('update_wallet', 'wallet', req.user.id, {
      address,
      name,
      isActive
    });

    sendSuccessResponse(res, {
      id: data.id,
      address: data.address,
      name: data.name,
      isActive: data.is_active,
      createdAt: data.created_at
    }, 'Wallet updated successfully');
  })
);

/**
 * @swagger
 * /api/wallets/{address}:
 *   delete:
 *     summary: Delete wallet
 *     tags: [Wallets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: address
 *         required: true
 *         schema:
 *           type: string
 *         description: Wallet address
 *     responses:
 *       200:
 *         description: Wallet deleted successfully
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.delete('/:address',
  authenticate,
  asyncHandler(async (req, res) => {
    const { address } = req.params;

    // Verify wallet exists and user owns it
    const wallet = await databaseService.getWallet(address);
    if (!wallet || wallet.user_id !== req.user.id) {
      return sendErrorResponse(res, 'Wallet not found or access denied', 404, 'WALLET_NOT_FOUND');
    }

    // Delete wallet
    const { error } = await databaseService.getClient()
      .from('wallets')
      .delete()
      .eq('address', address);

    if (error) throw error;

    logger.audit('delete_wallet', 'wallet', req.user.id, {
      address
    });

    sendSuccessResponse(res, null, 'Wallet deleted successfully');
  })
);

// Helper functions for encryption/decryption
function encrypt(text, key) {
  const algorithm = 'aes-256-cbc';
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipher(algorithm, key);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

function decrypt(encryptedText, key) {
  const algorithm = 'aes-256-cbc';
  const textParts = encryptedText.split(':');
  const iv = Buffer.from(textParts.shift(), 'hex');
  const encrypted = textParts.join(':');
  const decipher = crypto.createDecipheriv(algorithm, key, iv);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

module.exports = router;
