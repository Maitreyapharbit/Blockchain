const request = require('supertest');
const app = require('../../index');
const testUtils = require('../testUtils');

describe('Compliance Routes', () => {
  let authToken;
  let testBatch;
  let testComplianceRecord;

  beforeAll(async () => {
    // Setup test data
    testBatch = testUtils.createMockBatch();
    testComplianceRecord = testUtils.createMockComplianceRecord();
  });

  describe('POST /api/compliance/check', () => {
    it('should add compliance check', async () => {
      const response = await request(app)
        .post('/api/compliance/check')
        .set('Authorization', `Bearer ${authToken}`)
        .send(testComplianceRecord)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.complianceRecord).toMatchObject({
        batchId: testComplianceRecord.batchId,
        checkType: testComplianceRecord.checkType,
        passed: testComplianceRecord.passed
      });
    });

    it('should return 400 for invalid compliance data', async () => {
      const invalidCompliance = {
        batchId: '', // Invalid: empty batch ID
        checkType: 'INVALID_TYPE', // Invalid: unknown check type
        passed: 'not-boolean' // Invalid: not boolean
      };

      await request(app)
        .post('/api/compliance/check')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidCompliance)
        .expect(400);
    });

    it('should return 401 without authentication', async () => {
      await request(app)
        .post('/api/compliance/check')
        .send(testComplianceRecord)
        .expect(401);
    });
  });

  describe('GET /api/compliance/:batchId', () => {
    it('should get compliance history for batch', async () => {
      const response = await request(app)
        .get(`/api/compliance/${testBatch.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.complianceRecords)).toBe(true);
    });

    it('should return empty array for batch with no compliance records', async () => {
      const response = await request(app)
        .get('/api/compliance/non-existent-batch')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data.complianceRecords).toEqual([]);
    });

    it('should return 401 without authentication', async () => {
      await request(app)
        .get(`/api/compliance/${testBatch.id}`)
        .expect(401);
    });
  });

  describe('PUT /api/compliance/:id', () => {
    it('should update compliance record', async () => {
      const updateData = {
        passed: false,
        notes: 'Updated compliance record'
      };

      const response = await request(app)
        .put(`/api/compliance/${testComplianceRecord.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.complianceRecord.passed).toBe(false);
    });

    it('should return 404 for non-existent compliance record', async () => {
      await request(app)
        .put('/api/compliance/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ passed: true })
        .expect(404);
    });
  });

  describe('GET /api/compliance/stats/:batchId', () => {
    it('should get compliance statistics for batch', async () => {
      const response = await request(app)
        .get(`/api/compliance/stats/${testBatch.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.stats).toMatchObject({
        totalChecks: expect.any(Number),
        passedChecks: expect.any(Number),
        failedChecks: expect.any(Number),
        complianceRate: expect.any(Number)
      });
    });
  });
});
