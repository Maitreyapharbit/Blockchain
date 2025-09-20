const request = require('supertest');
const app = require('../../index');
const { testUtils } = require('../setup');

describe('Batch Routes', () => {
  let authToken;
  let testBatch;

  beforeAll(async () => {
    // Setup test data
    testBatch = testUtils.createMockBatch();
  });

  describe('POST /api/batches', () => {
    it('should create a new batch', async () => {
      const response = await request(app)
        .post('/api/batches')
        .set('Authorization', `Bearer ${authToken}`)
        .send(testBatch)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.batch).toMatchObject({
        drugName: testBatch.drugName,
        manufacturer: testBatch.manufacturer,
        quantity: testBatch.quantity
      });
    });

    it('should return 400 for invalid batch data', async () => {
      const invalidBatch = {
        drugName: '', // Invalid: empty name
        quantity: -1  // Invalid: negative quantity
      };

      await request(app)
        .post('/api/batches')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidBatch)
        .expect(400);
    });

    it('should return 401 without authentication', async () => {
      await request(app)
        .post('/api/batches')
        .send(testBatch)
        .expect(401);
    });
  });

  describe('GET /api/batches', () => {
    it('should get all batches', async () => {
      const response = await request(app)
        .get('/api/batches')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.batches)).toBe(true);
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get('/api/batches?page=1&limit=5')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data.pagination).toMatchObject({
        page: 1,
        limit: 5
      });
    });

    it('should filter by status', async () => {
      const response = await request(app)
        .get('/api/batches?status=CREATED')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('GET /api/batches/:id', () => {
    it('should get batch by id', async () => {
      const response = await request(app)
        .get(`/api/batches/${testBatch.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.batch.id).toBe(testBatch.id);
    });

    it('should return 404 for non-existent batch', async () => {
      await request(app)
        .get('/api/batches/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });

  describe('PUT /api/batches/:id/status', () => {
    it('should update batch status', async () => {
      const newStatus = 'IN_TRANSIT';

      const response = await request(app)
        .put(`/api/batches/${testBatch.id}/status`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ status: newStatus })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.batch.status).toBe(newStatus);
    });

    it('should return 400 for invalid status', async () => {
      await request(app)
        .put(`/api/batches/${testBatch.id}/status`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ status: 'INVALID_STATUS' })
        .expect(400);
    });
  });

  describe('POST /api/batches/:id/transfer', () => {
    it('should transfer batch ownership', async () => {
      const transferData = {
        to: '0x9876543210987654321098765432109876543210',
        quantity: 100
      };

      const response = await request(app)
        .post(`/api/batches/${testBatch.id}/transfer`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(transferData)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should return 400 for invalid transfer data', async () => {
      const invalidTransfer = {
        to: 'invalid-address',
        quantity: -1
      };

      await request(app)
        .post(`/api/batches/${testBatch.id}/transfer`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidTransfer)
        .expect(400);
    });
  });
});
