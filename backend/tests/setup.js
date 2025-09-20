// Test setup file for backend tests
const { createClient: _createClient } = require('@supabase/supabase-js');
const { ethers: _ethers } = require('ethers');

// Mock external services for testing
jest.mock('@supabase/supabase-js');
jest.mock('ethers');
jest.mock('aws-sdk');

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.SUPABASE_URL = 'https://test.supabase.co';
process.env.SUPABASE_ANON_KEY = 'test-anon-key';
process.env.AWS_ACCESS_KEY_ID = 'test-access-key';
process.env.AWS_SECRET_ACCESS_KEY = 'test-secret-key';
process.env.AWS_S3_BUCKET = 'test-bucket';
process.env.ETHEREUM_RPC_URL = 'http://localhost:8545';

// Global test setup
beforeAll(async () => {
  // Setup test database
  console.log('Setting up test environment...');
});

afterAll(async () => {
  // Cleanup test database
  console.log('Cleaning up test environment...');
});

// Global test utilities
global.testUtils = {
  createMockUser: () => ({
    id: 'test-user-id',
    email: 'test@example.com',
    role: 'manufacturer',
    walletAddress: '0x1234567890123456789012345678901234567890'
  }),

  createMockBatch: () => ({
    id: 'test-batch-id',
    drugName: 'Test Drug',
    manufacturer: '0x1234567890123456789012345678901234567890',
    manufactureDate: '2024-01-01',
    expiryDate: '2026-01-01',
    quantity: 1000,
    status: 'CREATED'
  }),

  createMockComplianceRecord: () => ({
    id: 'test-compliance-id',
    batchId: 'test-batch-id',
    checkType: 'FDA_APPROVAL',
    passed: true,
    timestamp: new Date().toISOString(),
    auditor: '0x1234567890123456789012345678901234567890',
    notes: 'Test compliance record'
  })
};
