import React from 'react';
import PropTypes from 'prop-types';
import { Box, Typography } from '@mui/material';

const BatchQRCode = ({ qrCode, batchId }) => {
  if (!qrCode) return null;

  return (
    <Box sx={{ textAlign: 'center', my: 2 }}>
      <Typography variant="h6" gutterBottom>
        Batch QR Code
      </Typography>
      <Box 
        component="img"
        src={qrCode}
        alt={`QR Code for batch ${batchId}`}
        sx={{
          maxWidth: '300px',
          width: '100%',
          height: 'auto',
          border: '1px solid #ddd',
          borderRadius: '4px',
          padding: '8px',
          backgroundColor: '#fff'
        }}
      />
      <Typography variant="caption" display="block" sx={{ mt: 1 }}>
        Scan to view batch details
      </Typography>
    </Box>
  );
};

BatchQRCode.propTypes = {
  qrCode: PropTypes.string,
  batchId: PropTypes.string.isRequired
};

export default BatchQRCode;