import React, { useState } from 'react';

function PriceSubmit({ defaultProductId = '' }) {
  const [productId, setProductId] = useState(defaultProductId || '');
  const [sellerId, setSellerId] = useState('');
  const [price, setPrice] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    setStatus('Submitting...');

    let fileBuffer = null;
    let fileName = null;
    if (file) {
      fileName = file.name;
      const b = await file.arrayBuffer();
      // browser-safe ArrayBuffer -> base64
      const arrayBufferToBase64 = (buffer) => {
        let binary = '';
        const bytes = new Uint8Array(buffer);
        const len = bytes.byteLength;
        for (let i = 0; i < len; i++) {
          binary += String.fromCharCode(bytes[i]);
        }
        return btoa(binary);
      };
      fileBuffer = b && b.byteLength ? arrayBufferToBase64(b) : null;
    }

    try {
      const res = await fetch('/api/prices/cash', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, sellerId, price: parseFloat(price), currency, fileBuffer, fileName })
      });
      const json = await res.json();
      if (res.ok) {
        setStatus('Submitted — tx: ' + (json.tx && json.tx.hash ? json.tx.hash : 'pending'));
      } else {
        setStatus('Error: ' + (json.error || JSON.stringify(json)));
      }
    } catch (err) {
      setStatus('Network error: ' + err.message);
    }
  };

  return (
    <div style={{ padding: 20, color: '#111', background: '#fff', borderRadius: 8 }}>
      <h2>Submit Cash Price</h2>
      <form onSubmit={submit}>
        <div style={{ marginBottom: 8 }}>
          <label>Product ID</label><br />
          <input value={productId} onChange={e => setProductId(e.target.value)} required />
        </div>
        <div style={{ marginBottom: 8 }}>
          <label>Seller ID</label><br />
          <input value={sellerId} onChange={e => setSellerId(e.target.value)} required />
        </div>
        <div style={{ marginBottom: 8 }}>
          <label>Price</label><br />
          <input value={price} onChange={e => setPrice(e.target.value)} required type="number" step="0.01" />
        </div>
        <div style={{ marginBottom: 8 }}>
          <label>Currency</label><br />
          <input value={currency} onChange={e => setCurrency(e.target.value)} />
        </div>
        <div style={{ marginBottom: 8 }}>
          <label>Receipt (optional)</label><br />
          <input type="file" onChange={e => setFile(e.target.files && e.target.files[0])} />
        </div>
        <div style={{ marginTop: 12 }}>
          <button type="submit">Submit Price</button>
        </div>
      </form>
      {status && <div style={{ marginTop: 12 }}>{status}</div>}
    </div>
  );
}

export default PriceSubmit;
