const express = require('express');
const router = express.Router();
const { uploadBufferToS3, getPresignedUrl } = require('../lib/s3');
const { createAndBroadcastTx, getChain } = require('../lib/blockchain');
const crypto = require('crypto');

// POST /events/price-update
router.post('/price-update', async (req, res) => {
  try {
    const { drugId, oldPrice, newPrice, actor, notes, fileBuffer, fileName } = req.body;
    let fileHash, fileUrl;
    if (fileBuffer && fileName) {
      fileHash = crypto.createHash('sha256').update(fileBuffer).digest('hex');
      fileUrl = await uploadBufferToS3(fileBuffer, fileName);
    }
    const tx = {
      type: 'PRICE_UPDATE',
      drugId,
      oldPrice,
      newPrice,
      actor,
      notes,
      fileHash,
      fileUrl
    };
    const result = createAndBroadcastTx(tx);
    res.json({ success: true, tx: result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /events/calibration
router.post('/calibration', async (req, res) => {
  try {
    const { equipmentId, calibrationDate, actor, notes, fileBuffer, fileName } = req.body;
    let fileHash, fileUrl;
    if (fileBuffer && fileName) {
      fileHash = crypto.createHash('sha256').update(fileBuffer).digest('hex');
      fileUrl = await uploadBufferToS3(fileBuffer, fileName);
    }
    const tx = {
      type: 'CALIBRATION_EVENT',
      equipmentId,
      calibrationDate,
      actor,
      notes,
      fileHash,
      fileUrl
    };
    const result = createAndBroadcastTx(tx);
    res.json({ success: true, tx: result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /events/history
router.get('/history', (req, res) => {
  const chain = getChain();
  const events = chain.filter(tx => tx.type === 'PRICE_UPDATE' || tx.type === 'CALIBRATION_EVENT');
  res.json({ events });
});

module.exports = router;
