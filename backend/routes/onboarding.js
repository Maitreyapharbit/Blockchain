const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const blockchainService = require('../services/blockchainService');
const databaseService = require('../services/databaseService');
const auth = require('../middleware/auth');

// Request registration
router.post('/register',
  [
    body('walletAddress').isEthereumAddress(),
    body('role').isIn(['MANUFACTURER', 'DISTRIBUTOR']),
    body('companyName').trim().notEmpty(),
    body('companyDetails').trim().notEmpty()
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { walletAddress, role, companyName, companyDetails } = req.body;
      
      // Check if address is already registered or has pending request
      const existingRequest = await databaseService.getRegistrationRequest(walletAddress);
      if (existingRequest) {
        return res.status(400).json({ 
          error: 'Registration request already exists for this address' 
        });
      }

      // Create registration request
      const request = await databaseService.createRegistrationRequest({
        walletAddress,
        role,
        companyName,
        companyDetails,
        status: 'PENDING'
      });

      res.status(201).json(request);
    } catch (error) {
      console.error('Registration request error:', error);
      res.status(500).json({ error: 'Failed to submit registration request' });
    }
});

// Admin: List registration requests
router.get('/requests', auth.requireAdmin, async (req, res) => {
  try {
    const requests = await databaseService.getRegistrationRequests();
    res.json(requests);
  } catch (error) {
    console.error('Error fetching registration requests:', error);
    res.status(500).json({ error: 'Failed to fetch registration requests' });
  }
});

// Admin: Approve/reject registration
router.post('/requests/:id/:action',
  auth.requireAdmin,
  [
    body('action').isIn(['approve', 'reject']),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { id, action } = req.params;
      const request = await databaseService.getRegistrationRequestById(id);
      
      if (!request) {
        return res.status(404).json({ error: 'Registration request not found' });
      }

      if (request.status !== 'PENDING') {
        return res.status(400).json({ error: 'Request has already been processed' });
      }

      if (action === 'approve') {
        // Grant role on blockchain
        if (request.role === 'MANUFACTURER') {
          await blockchainService.grantManufacturerRole(request.walletAddress);
        } else if (request.role === 'DISTRIBUTOR') {
          await blockchainService.grantDistributorRole(request.walletAddress);
        }

        // Update request status
        await databaseService.updateRegistrationRequest(id, {
          status: 'APPROVED',
          processedAt: new Date()
        });
      } else {
        // Update request status to rejected
        await databaseService.updateRegistrationRequest(id, {
          status: 'REJECTED',
          processedAt: new Date()
        });
      }

      res.json({ message: `Registration request ${action}ed successfully` });
    } catch (error) {
      console.error(`Error ${req.params.action}ing registration:`, error);
      res.status(500).json({ error: `Failed to ${req.params.action} registration` });
    }
});

module.exports = router;