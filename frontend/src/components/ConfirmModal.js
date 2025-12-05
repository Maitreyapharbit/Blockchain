import React from 'react';

const overlayStyle = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(0,0,0,0.4)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 9999
};

const boxStyle = {
  background: 'white',
  borderRadius: 12,
  padding: 20,
  width: 420,
  boxShadow: '0 8px 30px rgba(0,0,0,0.2)'
};

const footerStyle = {
  display: 'flex',
  justifyContent: 'flex-end',
  gap: 8,
  marginTop: 16
};

export default function ConfirmModal({
  open,
  title = 'Confirm',
  message = '',
  onCancel = () => {},
  onConfirm = () => {},
  cancelLabel = 'Cancel',
  confirmLabel = 'Confirm',
  loading = false
}) {
  if (!open) return null;

  return (
    <div style={overlayStyle} role="dialog" aria-modal="true">
      <div style={boxStyle}>
        <h3 style={{ marginTop: 0 }}>{title}</h3>
        <div>{message}</div>

        <div style={footerStyle}>
          <button
            onClick={onCancel}
            style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #e5e7eb', background: 'white', cursor: 'pointer' }}
            disabled={loading}
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            style={{ padding: '8px 12px', borderRadius: 8, border: 'none', background: '#10b981', color: 'white', cursor: 'pointer' }}
            disabled={loading}
          >
            {loading ? 'Processing...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
