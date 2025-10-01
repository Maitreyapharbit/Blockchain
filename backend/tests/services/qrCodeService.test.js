const QRCodeService = require('../../services/qrCodeService');
const QRCode = require('qrcode');

describe('QRCodeService', () => {
  const mockBatch = {
    id: '123',
    name: 'Test Batch',
    manufacturer: '0x123456789',
    manufacturingDate: '2025-10-01',
    expiryDate: '2026-10-01',
    quantity: 100,
    location: 'Test Location',
    transactionHash: '0xabc123def456',
    status: 'MINED',
    blockchainId: '789'
  };

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  describe('generateBatchQRCode', () => {
    it('should generate QR code for a batch successfully', async () => {
      const qrCode = await QRCodeService.generateBatchQRCode(mockBatch);
      
      // Verify QR code is a valid base64 string
      expect(qrCode).toMatch(/^data:image\/png;base64,/);
      
      // Decode the QR code content
      const base64Data = qrCode.replace(/^data:image\/png;base64,/, '');
      const decodedData = Buffer.from(base64Data, 'base64').toString('utf8');
      
      // Verify the decoded data contains all batch information
      const parsedData = JSON.parse(decodedData);
      expect(parsedData).toMatchObject({
        batchId: mockBatch.id,
        name: mockBatch.name,
        manufacturer: mockBatch.manufacturer,
        manufacturingDate: mockBatch.manufacturingDate,
        expiryDate: mockBatch.expiryDate,
        quantity: mockBatch.quantity,
        location: mockBatch.location,
        transactionHash: mockBatch.transactionHash,
        status: mockBatch.status,
        blockchainId: mockBatch.blockchainId
      });
    });

    it('should handle errors during QR code generation', async () => {
      // Mock QRCode.toDataURL to throw an error
      jest.spyOn(QRCode, 'toDataURL').mockRejectedValue(new Error('QR code generation failed'));
      
      await expect(QRCodeService.generateBatchQRCode(mockBatch))
        .rejects
        .toThrow('Failed to generate QR code for batch');
    });
  });

  describe('generateCustomQRCode', () => {
    it('should generate QR code with custom data', async () => {
      const customData = { test: 'data', number: 123 };
      const qrCode = await QRCodeService.generateCustomQRCode(customData);
      
      // Verify QR code is a valid base64 string
      expect(qrCode).toMatch(/^data:image\/png;base64,/);
      
      // Decode and verify the content
      const base64Data = qrCode.replace(/^data:image\/png;base64,/, '');
      const decodedData = Buffer.from(base64Data, 'base64').toString('utf8');
      const parsedData = JSON.parse(decodedData);
      
      expect(parsedData).toEqual(customData);
    });

    it('should handle errors during custom QR code generation', async () => {
      // Mock QRCode.toDataURL to throw an error
      jest.spyOn(QRCode, 'toDataURL').mockRejectedValue(new Error('QR code generation failed'));
      
      await expect(QRCodeService.generateCustomQRCode({ test: 'data' }))
        .rejects
        .toThrow('Failed to generate custom QR code');
    });
  });
});