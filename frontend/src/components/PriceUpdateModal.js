import React, { useState } from 'react';
import axios from 'axios';

const PriceUpdateModal = ({ show, onClose, onSuccess }) => {
  const [drugId, setDrugId] = useState('');
  const [oldPrice, setOldPrice] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [actor, setActor] = useState('');
  const [notes, setNotes] = useState('');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      let fileBuffer, fileName;
      if (file) {
        fileBuffer = await file.arrayBuffer();
        fileName = file.name;
      }
      const res = await axios.post('/events/price-update', {
        drugId,
        oldPrice,
        newPrice,
        actor,
        notes,
        fileBuffer,
        fileName
      });
      onSuccess && onSuccess(res.data.tx);
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!show) return null;
  return (
    <div className="modal-overlay">
      <div className="modal">
        <h2>Submit Drug Price Update</h2>
        <form onSubmit={handleSubmit}>
          <input placeholder="Drug ID" value={drugId} onChange={e => setDrugId(e.target.value)} required />
          <input placeholder="Old Price" value={oldPrice} onChange={e => setOldPrice(e.target.value)} required />
          <input placeholder="New Price" value={newPrice} onChange={e => setNewPrice(e.target.value)} required />
          <input placeholder="Actor" value={actor} onChange={e => setActor(e.target.value)} required />
          <textarea placeholder="Notes" value={notes} onChange={e => setNotes(e.target.value)} />
          <input type="file" onChange={e => setFile(e.target.files[0])} />
          {error && <div className="error">{error}</div>}
          <button type="submit" disabled={loading}>{loading ? 'Submitting...' : 'Submit'}</button>
          <button type="button" onClick={onClose}>Cancel</button>
        </form>
      </div>
    </div>
  );
};

export default PriceUpdateModal;
