import React, { useEffect, useState } from 'react';
import axios from 'axios';

const EventHistory = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await axios.get('/events/history');
        setEvents(res.data.events || []);
      } catch (err) {
        setError(err.response?.data?.error || err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  if (loading) return <div>Loading event history...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div>
      <h2>Event History</h2>
      <table>
        <thead>
          <tr>
            <th>Type</th>
            <th>ID</th>
            <th>Date</th>
            <th>Actor</th>
            <th>Notes</th>
            <th>File</th>
          </tr>
        </thead>
        <tbody>
          {events.map((ev, i) => (
            <tr key={i}>
              <td>{ev.type}</td>
              <td>{ev.type === 'PRICE_UPDATE' ? ev.drugId : ev.equipmentId}</td>
              <td>{ev.timestamp || ev.calibrationDate}</td>
              <td>{ev.actor}</td>
              <td>{ev.notes}</td>
              <td>{ev.fileUrl ? <a href={ev.fileUrl} target="_blank" rel="noopener noreferrer">View</a> : '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default EventHistory;
