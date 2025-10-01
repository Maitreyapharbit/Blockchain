const request = require('supertest');
const app = require('../../index');
const QRCodeService = require('../../services/qrCodeService');
const { generateAuthToken } = require('../../utils/auth');

describe('Batch QR Code Integration Tests', () => {
  let authToken;
  const mockBatch = {
    drugName: 'Test Medicine',
    drugCode: 'TM001',
    manufacturer: '0x123456789',
    quantity: 100,
    manufacturingDate: '2025-10-01',
    expiryDate: '2026-10-01'
  };

  beforeEach(() => {
    // Generate auth token for testing
    authToken = generateAuthToken({
      id: '1',
      address: '0x123456789',
      role: 'manufacturer'
    });
  });

  describe('GET /api/batches/:id/qr', () => {
    it('should return QR code for existing batch', async () => {
      // First create a batch
      const createResponse = await request(app)
        .post('/api/batches')
        .set('Authorization', `Bearer ${authToken}`)
        .send(mockBatch);

      expect(createResponse.status).toBe(201);
      const batchId = createResponse.body.data.id;

      // Then get its QR code
      const qrResponse = await request(app)
        .get(`/api/batches/${batchId}/qr`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(qrResponse.status).toBe(200);
      expect(qrResponse.body.data).toHaveProperty('qrCode');
      expect(qrResponse.body.data.qrCode).toMatch(/^data:image\/png;base64,/);
    });

    it('should return 404 for non-existent batch', async () => {
      const response = await request(app)
        .get('/api/batches/999999/qr')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .get('/api/batches/1/qr');

      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/batches', () => {
    it('should create batch with QR code', async () => {
      const response = await request(app)
        .post('/api/batches')
        .set('Authorization', `Bearer ${authToken}`)
        .send(mockBatch);

      expect(response.status).toBe(201);
      expect(response.body.data).toHaveProperty('qrCode');
      expect(response.body.data.qrCode).toMatch(/^data:image\/png;base64,/);

      // Verify QR code contains batch information
      const base64Data = response.body.data.qrCode.replace(/^data:image\/png;base64,/, '');
      const decodedData = Buffer.from(base64Data, 'base64').toString('utf8');
      const parsedData = JSON.parse(decodedData);

      expect(parsedData).toMatchObject({
        drugName: mockBatch.drugName,
        manufacturer: mockBatch.manufacturer
      });
    });
  });
});