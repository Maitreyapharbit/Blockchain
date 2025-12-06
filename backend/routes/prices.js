const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { supabase } = require('../config/supabase');
const { uploadBufferToS3 } = require('../lib/s3');
const { createAndBroadcastTx } = require('../lib/blockchain');

// POST /prices/cash
// Accepts JSON body. fileBuffer may be an Array (bytes) or base64 string.
router.post('/cash', async (req, res) => {
  try {
    const { productId, sellerId, price, currency = 'USD', effectiveAt, actor, notes, fileBuffer, fileName } = req.body;

    if (!productId || !sellerId || !price) return res.status(400).json({ error: 'productId, sellerId and price are required' });

    let fileHash = null;
    let fileUrl = null;

    if (fileBuffer && fileName) {
      // handle either base64 string or array-like
      let buffer;
      if (typeof fileBuffer === 'string') {
        // assume base64
        buffer = Buffer.from(fileBuffer, 'base64');
      } else if (Array.isArray(fileBuffer)) {
        buffer = Buffer.from(fileBuffer);
      } else if (fileBuffer && fileBuffer.data) {
        buffer = Buffer.from(fileBuffer.data);
      } else {
        buffer = null;
      }

      if (buffer) {
        fileHash = crypto.createHash('sha256').update(buffer).digest('hex');
        try {
          const upload = await uploadBufferToS3(buffer, fileName, 'application/octet-stream');
          fileUrl = upload.s3Uri || upload.s3Key || null;
        } catch (err) {
          console.warn('S3 upload failed, continuing without fileUrl:', err.message || err);
        }
      }
    }

    // Insert index row into Supabase for fast querying
    const record = {
      product_id: productId,
      seller_id: sellerId,
      price: price,
      currency: currency,
      effective_at: effectiveAt || new Date().toISOString(),
      actor_id: actor || null,
      notes: notes || null,
      file_hash: fileHash,
      file_url: fileUrl
    };

    const { data, error } = await supabase.from('price_records').insert([record]).select().single();
    if (error) {
      console.warn('Supabase insert error for price_records:', error);
      // continue to create on-chain tx even if supabase fails, but respond with warning
    }

    // create the on-chain transaction anchor
    const tx = {
      type: 'PRICE_RECORD',
      productId,
      sellerId,
      price,
      currency,
      effectiveAt: record.effective_at,
      actor: actor || null,
      notes: notes || null,
      fileHash,
      fileUrl
    };

    const txResult = createAndBroadcastTx(tx);

    // Update Supabase row with tx_hash if possible
    if (data && txResult && txResult.hash) {
      try {
        await supabase.from('price_records').update({ tx_hash: txResult.hash }).eq('id', data.id);
      } catch (e) {
        console.warn('Failed to update tx_hash in supabase:', e.message || e);
      }
    }

    return res.json({ success: true, record: data || record, tx: txResult });
  } catch (err) {
    console.error('Error in POST /prices/cash', err);
    return res.status(500).json({ error: err.message || err });
  }
});

// GET /prices/:productId
router.get('/:productId', async (req, res) => {
  try {
    const productId = req.params.productId;
    const limit = parseInt(req.query.limit) || 50;
    const { data, error } = await supabase.from('price_records').select('*').eq('product_id', productId).order('effective_at', { ascending: false }).limit(limit);
    if (error) return res.status(500).json({ error });
    return res.json({ success: true, data });
  } catch (err) {
    console.error('Error in GET /prices/:productId', err);
    return res.status(500).json({ error: err.message || err });
  }
});

module.exports = router;
