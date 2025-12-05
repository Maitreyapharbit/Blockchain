import React, { useState } from 'react';
import PriceUpdateModal from './components/PriceUpdateModal';
import CalibrationEventModal from './components/CalibrationEventModal';
import EventHistory from './components/EventHistory';

const EventDemo = () => {
  const [showPriceModal, setShowPriceModal] = useState(false);
  const [showCalibrationModal, setShowCalibrationModal] = useState(false);

  return (
    <div>
      <h2>Blockchain Event Demo</h2>
      <button onClick={() => setShowPriceModal(true)}>
        Submit Drug Price Update
      </button>
      <button onClick={() => setShowCalibrationModal(true)} style={{ marginLeft: '1rem' }}>
        Submit Calibration Event
      </button>
      <PriceUpdateModal show={showPriceModal} onClose={() => setShowPriceModal(false)} />
      <CalibrationEventModal show={showCalibrationModal} onClose={() => setShowCalibrationModal(false)} />
      <div style={{ marginTop: '2rem' }}>
        <EventHistory />
      </div>
    </div>
  );
};

export default EventDemo;
