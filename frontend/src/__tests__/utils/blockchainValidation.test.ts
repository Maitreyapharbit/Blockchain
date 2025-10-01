import { blockchainValidator, formatBlockchainAddress, formatTransactionHash, getBlockchainExplorerUrl } from '../../utils/blockchainValidation';
import { Batch } from '../../types';

// Mock fetch
global.fetch = jest.fn();

describe('blockchainValidator', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('validateBatchAuthenticity', () => {
    const mockBatch: Batch = {
      id: 'batch1',
      productName: 'Test Product',
      batchNumber: 'BATCH001',
      manufacturingDate: '2023-01-01T00:00:00Z',
      expiryDate: '2024-01-01T00:00:00Z',
      quantity: 1000,
      location: 'Test Location',
      status: 'active',
      blockchainHash: '0x1234567890abcdef',
      securityFeatures: [
        {
          id: '1',
          type: 'qr_code',
          value: 'test-qr-code',
          verified: true,
          verificationDate: '2023-01-01T00:00:00Z',
        },
      ],
    };

    it('should validate batch successfully when blockchain hash exists', async () => {
      const mockTransaction = {
        hash: '0x1234567890abcdef',
        blockNumber: 12345,
        timestamp: '2023-01-01T00:00:00Z',
        from: '0xfrom',
        to: '0xto',
        value: '0',
        gasUsed: '21000',
        status: 'success',
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockTransaction,
      });

      const result = await blockchainValidator.validateBatchAuthenticity(mockBatch);

      expect(result.isValid).toBe(true);
      expect(result.confidence).toBeGreaterThan(0);
      expect(result.blockchainHash).toBe('0x1234567890abcdef');
      expect(result.blockNumber).toBe(12345);
    });

    it('should return invalid when batch has no blockchain hash', async () => {
      const batchWithoutHash = { ...mockBatch, blockchainHash: '' };

      const result = await blockchainValidator.validateBatchAuthenticity(batchWithoutHash);

      expect(result.isValid).toBe(false);
      expect(result.confidence).toBe(0);
      expect(result.errors).toContain('Batch does not have blockchain hash');
    });

    it('should return invalid when transaction is not found', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
      });

      const result = await blockchainValidator.validateBatchAuthenticity(mockBatch);

      expect(result.isValid).toBe(false);
      expect(result.confidence).toBe(0);
      expect(result.errors).toContain('Blockchain transaction not found');
    });

    it('should return invalid when transaction failed', async () => {
      const mockTransaction = {
        hash: '0x1234567890abcdef',
        blockNumber: 12345,
        timestamp: '2023-01-01T00:00:00Z',
        from: '0xfrom',
        to: '0xto',
        value: '0',
        gasUsed: '21000',
        status: 'failed',
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockTransaction,
      });

      const result = await blockchainValidator.validateBatchAuthenticity(mockBatch);

      expect(result.isValid).toBe(false);
      expect(result.confidence).toBe(0);
      expect(result.errors).toContain('Blockchain transaction failed');
    });

    it('should handle network errors', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      const result = await blockchainValidator.validateBatchAuthenticity(mockBatch);

      expect(result.isValid).toBe(false);
      expect(result.confidence).toBe(0);
      expect(result.errors).toContain('System error during validation');
    });
  });

  describe('verifyOwnershipChain', () => {
    it('should verify ownership chain successfully', async () => {
      const mockChain = [
        {
          owner: '0xowner1',
          timestamp: '2023-01-01T00:00:00Z',
          transactionHash: '0xhash1',
        },
        {
          owner: '0xowner2',
          timestamp: '2023-01-02T00:00:00Z',
          transactionHash: '0xhash2',
        },
      ];

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ chain: mockChain }),
      });

      const result = await blockchainValidator.verifyOwnershipChain('batch1');

      expect(result.isValid).toBe(true);
      expect(result.chain).toEqual(mockChain);
      expect(result.errors).toEqual([]);
    });

    it('should handle errors when fetching ownership chain', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
      });

      const result = await blockchainValidator.verifyOwnershipChain('batch1');

      expect(result.isValid).toBe(false);
      expect(result.chain).toEqual([]);
      expect(result.errors).toContain('Failed to fetch ownership chain');
    });

    it('should handle network errors', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      const result = await blockchainValidator.verifyOwnershipChain('batch1');

      expect(result.isValid).toBe(false);
      expect(result.chain).toEqual([]);
      expect(result.errors).toContain('System error during ownership verification');
    });
  });

  describe('getVerificationHistory', () => {
    it('should fetch verification history successfully', async () => {
      const mockVerifications = [
        {
          id: '1',
          batchId: 'batch1',
          verificationType: 'qr_scan',
          result: 'authentic',
          confidence: 95,
          timestamp: '2023-01-01T00:00:00Z',
          details: 'QR code verified',
          verifiedBy: 'Test User',
        },
      ];

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ verifications: mockVerifications }),
      });

      const result = await blockchainValidator.getVerificationHistory('batch1');

      expect(result).toEqual(mockVerifications);
    });

    it('should return empty array when fetch fails', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
      });

      const result = await blockchainValidator.getVerificationHistory('batch1');

      expect(result).toEqual([]);
    });

    it('should handle network errors', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      const result = await blockchainValidator.getVerificationHistory('batch1');

      expect(result).toEqual([]);
    });
  });

  describe('registerVerification', () => {
    it('should register verification successfully', async () => {
      const mockVerification = {
        id: '1',
        batchId: 'batch1',
        verificationType: 'qr_scan',
        result: 'authentic',
        confidence: 95,
        timestamp: '2023-01-01T00:00:00Z',
        details: 'QR code verified',
        verifiedBy: 'Test User',
      };

      const mockResponse = {
        transactionHash: '0xverificationhash',
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await blockchainValidator.registerVerification(mockVerification);

      expect(result.success).toBe(true);
      expect(result.transactionHash).toBe('0xverificationhash');
    });

    it('should handle errors when registering verification', async () => {
      const mockVerification = {
        id: '1',
        batchId: 'batch1',
        verificationType: 'qr_scan',
        result: 'authentic',
        confidence: 95,
        timestamp: '2023-01-01T00:00:00Z',
        details: 'QR code verified',
        verifiedBy: 'Test User',
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: 'Registration failed' }),
      });

      const result = await blockchainValidator.registerVerification(mockVerification);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Registration failed');
    });

    it('should handle network errors', async () => {
      const mockVerification = {
        id: '1',
        batchId: 'batch1',
        verificationType: 'qr_scan',
        result: 'authentic',
        confidence: 95,
        timestamp: '2023-01-01T00:00:00Z',
        details: 'QR code verified',
        verifiedBy: 'Test User',
      };

      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      const result = await blockchainValidator.registerVerification(mockVerification);

      expect(result.success).toBe(false);
      expect(result.error).toBe('System error during verification registration');
    });
  });
});

describe('utility functions', () => {
  describe('formatBlockchainAddress', () => {
    it('should format blockchain address correctly', () => {
      const address = '0x1234567890abcdef1234567890abcdef12345678';
      const formatted = formatBlockchainAddress(address);
      expect(formatted).toBe('0x1234...5678');
    });

    it('should handle empty address', () => {
      const formatted = formatBlockchainAddress('');
      expect(formatted).toBe('');
    });

    it('should handle short address', () => {
      const address = '0x1234';
      const formatted = formatBlockchainAddress(address);
      expect(formatted).toBe('0x1234');
    });
  });

  describe('formatTransactionHash', () => {
    it('should format transaction hash correctly', () => {
      const hash = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
      const formatted = formatTransactionHash(hash);
      expect(formatted).toBe('0x123456...90abcdef');
    });

    it('should handle empty hash', () => {
      const formatted = formatTransactionHash('');
      expect(formatted).toBe('');
    });

    it('should handle short hash', () => {
      const hash = '0x1234';
      const formatted = formatTransactionHash(hash);
      expect(formatted).toBe('0x1234');
    });
  });

  describe('getBlockchainExplorerUrl', () => {
    it('should return correct URL for mainnet', () => {
      const hash = '0x1234567890abcdef';
      const url = getBlockchainExplorerUrl(hash, 'mainnet');
      expect(url).toBe('https://etherscan.io/tx/0x1234567890abcdef');
    });

    it('should return correct URL for ropsten', () => {
      const hash = '0x1234567890abcdef';
      const url = getBlockchainExplorerUrl(hash, 'ropsten');
      expect(url).toBe('https://ropsten.etherscan.io/tx/0x1234567890abcdef');
    });

    it('should return correct URL for rinkeby', () => {
      const hash = '0x1234567890abcdef';
      const url = getBlockchainExplorerUrl(hash, 'rinkeby');
      expect(url).toBe('https://rinkeby.etherscan.io/tx/0x1234567890abcdef');
    });

    it('should return local URL for unknown network', () => {
      const hash = '0x1234567890abcdef';
      const url = getBlockchainExplorerUrl(hash, 'unknown');
      expect(url).toBe('http://localhost:8080/tx/0x1234567890abcdef');
    });

    it('should default to local URL when no network specified', () => {
      const hash = '0x1234567890abcdef';
      const url = getBlockchainExplorerUrl(hash);
      expect(url).toBe('http://localhost:8080/tx/0x1234567890abcdef');
    });
  });
});