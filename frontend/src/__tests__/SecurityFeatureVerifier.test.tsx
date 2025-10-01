import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { SecurityFeatureVerifier } from '../components/AntiCounterfeit/SecurityFeatureVerifier';
import { Batch, SecurityFeature } from '../types';

// Mock store
const mockStore = configureStore({
  reducer: {
    counterfeit: (state = {
      currentBatch: null,
      securityFeatures: [],
      verificationResults: [],
      realTimeStatus: null,
    }) => state,
  },
});

// Mock data
const mockBatch: Batch = {
  id: 'batch1',
  productName: 'Test Product',
  batchNumber: 'BATCH001',
  manufacturingDate: '2023-01-01T00:00:00Z',
  expiryDate: '2024-01-01T00:00:00Z',
  quantity: 1000,
  location: 'Test Location',
  status: 'active',
  blockchainHash: 'test-hash',
  securityFeatures: [],
};

const mockSecurityFeatures: SecurityFeature[] = [
  {
    id: '1',
    type: 'qr_code',
    value: 'test-qr-code',
    verified: true,
    verificationDate: '2023-01-01T00:00:00Z',
  },
  {
    id: '2',
    type: 'hologram',
    value: 'test-hologram',
    verified: false,
  },
  {
    id: '3',
    type: 'serial_number',
    value: 'SN123456',
    verified: true,
    verificationDate: '2023-01-01T00:00:00Z',
  },
  {
    id: '4',
    type: 'tamper_evident',
    value: 'intact',
    verified: true,
    verificationDate: '2023-01-01T00:00:00Z',
  },
];

const defaultProps = {
  batchId: 'batch1',
  onVerificationComplete: jest.fn(),
  loading: false,
};

const renderWithProvider = (props = {}) => {
  return render(
    <Provider store={mockStore}>
      <SecurityFeatureVerifier {...defaultProps} {...props} />
    </Provider>
  );
};

describe('SecurityFeatureVerifier', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    renderWithProvider();
    expect(screen.getByText('Security Feature Verifier')).toBeInTheDocument();
  });

  it('displays verification steps', () => {
    renderWithProvider();
    expect(screen.getByText('QR Code Verification')).toBeInTheDocument();
    expect(screen.getByText('Hologram Check')).toBeInTheDocument();
    expect(screen.getByText('Serial Number Validation')).toBeInTheDocument();
    expect(screen.getByText('Tamper Evidence')).toBeInTheDocument();
    expect(screen.getByText('Blockchain Verification')).toBeInTheDocument();
    expect(screen.getByText('Final Assessment')).toBeInTheDocument();
  });

  it('shows loading state', () => {
    renderWithProvider({ loading: true });
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('displays QR code input field', () => {
    renderWithProvider();
    expect(screen.getByLabelText('QR Code Data')).toBeInTheDocument();
  });

  it('displays hologram input field', () => {
    renderWithProvider();
    expect(screen.getByLabelText('Hologram Data')).toBeInTheDocument();
  });

  it('displays serial number input field', () => {
    renderWithProvider();
    expect(screen.getByLabelText('Serial Number')).toBeInTheDocument();
  });

  it('displays tamper evidence select', () => {
    renderWithProvider();
    expect(screen.getByLabelText('Tamper Evidence Status')).toBeInTheDocument();
  });

  it('shows camera scan button', () => {
    renderWithProvider();
    expect(screen.getByLabelText('Scan QR Code')).toBeInTheDocument();
  });

  it('shows file upload button', () => {
    renderWithProvider();
    expect(screen.getByLabelText('Upload Files')).toBeInTheDocument();
  });

  it('opens camera dialog when camera button is clicked', () => {
    renderWithProvider();
    
    const cameraButton = screen.getByLabelText('Scan QR Code');
    fireEvent.click(cameraButton);
    
    expect(screen.getByText('Scan QR Code')).toBeInTheDocument();
  });

  it('validates QR code input', () => {
    renderWithProvider();
    
    const qrInput = screen.getByLabelText('QR Code Data');
    const verifyButton = screen.getByText('Verify QR Code');
    
    expect(verifyButton).toBeDisabled();
    
    fireEvent.change(qrInput, { target: { value: 'test-qr-code' } });
    
    expect(verifyButton).not.toBeDisabled();
  });

  it('validates hologram input', () => {
    renderWithProvider();
    
    const hologramInput = screen.getByLabelText('Hologram Data');
    const verifyButton = screen.getByText('Verify Hologram');
    
    expect(verifyButton).toBeDisabled();
    
    fireEvent.change(hologramInput, { target: { value: 'test-hologram' } });
    
    expect(verifyButton).not.toBeDisabled();
  });

  it('validates serial number input', () => {
    renderWithProvider();
    
    const serialInput = screen.getByLabelText('Serial Number');
    const verifyButton = screen.getByText('Verify Serial Number');
    
    expect(verifyButton).toBeDisabled();
    
    fireEvent.change(serialInput, { target: { value: 'SN123456' } });
    
    expect(verifyButton).not.toBeDisabled();
  });

  it('validates tamper evidence selection', () => {
    renderWithProvider();
    
    const tamperSelect = screen.getByLabelText('Tamper Evidence Status');
    const verifyButton = screen.getByText('Check Tamper Evidence');
    
    expect(verifyButton).toBeDisabled();
    
    fireEvent.mouseDown(tamperSelect);
    const intactOption = screen.getByText('Intact');
    fireEvent.click(intactOption);
    
    expect(verifyButton).not.toBeDisabled();
  });

  it('shows verification results when available', () => {
    const mockVerificationResults = [
      {
        id: '1',
        batchId: 'batch1',
        verificationType: 'qr_scan',
        result: 'authentic',
        confidence: 95,
        timestamp: '2023-01-01T00:00:00Z',
        details: 'QR code verified successfully',
        verifiedBy: 'Test User',
      },
    ];

    const mockStoreWithResults = configureStore({
      reducer: {
        counterfeit: (state = {
          currentBatch: mockBatch,
          securityFeatures: mockSecurityFeatures,
          verificationResults: mockVerificationResults,
          realTimeStatus: null,
        }) => state,
      },
    });

    render(
      <Provider store={mockStoreWithResults}>
        <SecurityFeatureVerifier {...defaultProps} />
      </Provider>
    );

    expect(screen.getByText('Verification Results')).toBeInTheDocument();
    expect(screen.getByText('QR CODE SCAN')).toBeInTheDocument();
    expect(screen.getByText('AUTHENTIC')).toBeInTheDocument();
    expect(screen.getByText('95%')).toBeInTheDocument();
  });

  it('shows current verification status when available', () => {
    const mockCurrentVerification = {
      id: '1',
      batchId: 'batch1',
      verificationType: 'qr_scan',
      result: 'authentic',
      confidence: 95,
      timestamp: '2023-01-01T00:00:00Z',
      details: 'QR code verified successfully',
      verifiedBy: 'Test User',
    };

    const mockStoreWithStatus = configureStore({
      reducer: {
        counterfeit: (state = {
          currentBatch: mockBatch,
          securityFeatures: mockSecurityFeatures,
          verificationResults: [],
          realTimeStatus: {
            isVerifying: false,
            lastVerification: mockCurrentVerification,
            verificationInProgress: false,
          },
        }) => state,
      },
    });

    render(
      <Provider store={mockStoreWithStatus}>
        <SecurityFeatureVerifier {...defaultProps} />
      </Provider>
    );

    expect(screen.getByText('Current Verification Status')).toBeInTheDocument();
    expect(screen.getByText('AUTHENTIC')).toBeInTheDocument();
    expect(screen.getByText('Confidence: 95%')).toBeInTheDocument();
  });

  it('shows batch information when available', () => {
    const mockStoreWithBatch = configureStore({
      reducer: {
        counterfeit: (state = {
          currentBatch: mockBatch,
          securityFeatures: mockSecurityFeatures,
          verificationResults: [],
          realTimeStatus: null,
        }) => state,
      },
    });

    render(
      <Provider store={mockStoreWithBatch}>
        <SecurityFeatureVerifier {...defaultProps} />
      </Provider>
    );

    expect(screen.getByText('Batch Information')).toBeInTheDocument();
    expect(screen.getByText('Test Product')).toBeInTheDocument();
    expect(screen.getByText('BATCH001')).toBeInTheDocument();
    expect(screen.getByText('Test Location')).toBeInTheDocument();
  });

  it('shows security features when available', () => {
    const mockStoreWithFeatures = configureStore({
      reducer: {
        counterfeit: (state = {
          currentBatch: mockBatch,
          securityFeatures: mockSecurityFeatures,
          verificationResults: [],
          realTimeStatus: null,
        }) => state,
      },
    });

    render(
      <Provider store={mockStoreWithFeatures}>
        <SecurityFeatureVerifier {...defaultProps} />
      </Provider>
    );

    expect(screen.getByText('Security Features')).toBeInTheDocument();
    expect(screen.getByText('QR CODE')).toBeInTheDocument();
    expect(screen.getByText('HOLOGRAM')).toBeInTheDocument();
    expect(screen.getByText('SERIAL NUMBER')).toBeInTheDocument();
    expect(screen.getByText('TAMPER EVIDENT')).toBeInTheDocument();
  });
});