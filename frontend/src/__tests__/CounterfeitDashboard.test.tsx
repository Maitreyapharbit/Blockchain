import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { CounterfeitDashboard } from '../components/AntiCounterfeit/CounterfeitDashboard';
import { CounterfeitReport, SuspiciousActivity } from '../types';

// Mock store
const mockStore = configureStore({
  reducer: {
    counterfeit: (state = {
      reports: [],
      suspiciousActivities: [],
      stats: null,
      pagination: { page: 1, limit: 10, total: 0, hasNext: false, hasPrev: false },
      filters: { status: '', severity: '', activityType: '', search: '' },
    }) => state,
  },
});

// Mock data
const mockReports: CounterfeitReport[] = [
  {
    id: '1',
    batchId: 'batch1',
    productName: 'Test Product 1',
    reportedBy: 'Test User',
    reportDate: '2023-01-01T00:00:00Z',
    description: 'Test description',
    evidence: [],
    status: 'pending',
    severity: 'high',
    location: {
      latitude: 0,
      longitude: 0,
      address: 'Test Address',
    },
  },
  {
    id: '2',
    batchId: 'batch2',
    productName: 'Test Product 2',
    reportedBy: 'Test User 2',
    reportDate: '2023-01-02T00:00:00Z',
    description: 'Test description 2',
    evidence: [],
    status: 'verified',
    severity: 'critical',
    location: {
      latitude: 0,
      longitude: 0,
      address: 'Test Address 2',
    },
  },
];

const mockActivities: SuspiciousActivity[] = [
  {
    id: '1',
    batchId: 'batch1',
    activityType: 'unusual_pattern',
    description: 'Test activity',
    detectedAt: '2023-01-01T00:00:00Z',
    severity: 'medium',
    status: 'new',
    metadata: {},
  },
  {
    id: '2',
    batchId: 'batch2',
    activityType: 'failed_verification',
    description: 'Test activity 2',
    detectedAt: '2023-01-02T00:00:00Z',
    severity: 'high',
    status: 'investigating',
    metadata: {},
  },
];

const mockStats = {
  totalReports: 2,
  verifiedCounterfeits: 1,
  falsePositives: 0,
  pendingInvestigation: 1,
  bySeverity: { high: 1, critical: 1 },
  byStatus: { pending: 1, verified: 1 },
  verificationStats: {
    totalVerifications: 10,
    authenticCount: 8,
    counterfeitCount: 1,
    suspiciousCount: 1,
  },
};

const defaultProps = {
  reports: mockReports,
  activities: mockActivities,
  loading: false,
  error: null,
  onRefresh: jest.fn(),
  onReportClick: jest.fn(),
};

const renderWithProvider = (props = {}) => {
  return render(
    <Provider store={mockStore}>
      <CounterfeitDashboard {...defaultProps} {...props} />
    </Provider>
  );
};

describe('CounterfeitDashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    renderWithProvider();
    expect(screen.getByText('Anti-Counterfeit Dashboard')).toBeInTheDocument();
  });

  it('displays counterfeit statistics', () => {
    renderWithProvider();
    expect(screen.getByText('Total Reports')).toBeInTheDocument();
    expect(screen.getByText('Verified Counterfeits')).toBeInTheDocument();
    expect(screen.getByText('False Positives')).toBeInTheDocument();
    expect(screen.getByText('Pending Investigation')).toBeInTheDocument();
  });

  it('displays verification statistics', () => {
    renderWithProvider();
    expect(screen.getByText('Verification Statistics')).toBeInTheDocument();
    expect(screen.getByText('Total Verifications')).toBeInTheDocument();
    expect(screen.getByText('Authentic')).toBeInTheDocument();
    expect(screen.getByText('Counterfeit')).toBeInTheDocument();
    expect(screen.getByText('Suspicious')).toBeInTheDocument();
  });

  it('displays reports in table', () => {
    renderWithProvider();
    expect(screen.getByText('Test Product 1')).toBeInTheDocument();
    expect(screen.getByText('Test Product 2')).toBeInTheDocument();
    expect(screen.getByText('Test User')).toBeInTheDocument();
    expect(screen.getByText('Test User 2')).toBeInTheDocument();
  });

  it('shows loading state', () => {
    renderWithProvider({ loading: true, reports: [], activities: [] });
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('shows error message', () => {
    const errorMessage = 'Test error message';
    renderWithProvider({ error: errorMessage });
    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });

  it('calls onRefresh when refresh button is clicked', () => {
    const onRefresh = jest.fn();
    renderWithProvider({ onRefresh });
    
    const refreshButton = screen.getByText('Refresh');
    fireEvent.click(refreshButton);
    
    expect(onRefresh).toHaveBeenCalledTimes(1);
  });

  it('calls onReportClick when report is clicked', () => {
    const onReportClick = jest.fn();
    renderWithProvider({ onReportClick });
    
    const viewButton = screen.getByText('View Details');
    fireEvent.click(viewButton);
    
    expect(onReportClick).toHaveBeenCalledTimes(1);
  });

  it('switches between tabs', () => {
    renderWithProvider();
    
    const suspiciousTab = screen.getByText('Suspicious Activities (2)');
    fireEvent.click(suspiciousTab);
    
    expect(screen.getByText('Test activity')).toBeInTheDocument();
    expect(screen.getByText('Test activity 2')).toBeInTheDocument();
  });

  it('filters reports by search term', () => {
    renderWithProvider();
    
    const searchInput = screen.getByPlaceholderText('Search reports and activities...');
    fireEvent.change(searchInput, { target: { value: 'Test Product 1' } });
    
    expect(screen.getByText('Test Product 1')).toBeInTheDocument();
    expect(screen.queryByText('Test Product 2')).not.toBeInTheDocument();
  });

  it('filters reports by status', () => {
    renderWithProvider();
    
    const statusSelect = screen.getByLabelText('Status');
    fireEvent.mouseDown(statusSelect);
    
    const pendingOption = screen.getByText('Pending');
    fireEvent.click(pendingOption);
    
    expect(screen.getByText('Test Product 1')).toBeInTheDocument();
    expect(screen.queryByText('Test Product 2')).not.toBeInTheDocument();
  });

  it('filters reports by severity', () => {
    renderWithProvider();
    
    const severitySelect = screen.getByLabelText('Severity');
    fireEvent.mouseDown(severitySelect);
    
    const highOption = screen.getByText('High');
    fireEvent.click(highOption);
    
    expect(screen.getByText('Test Product 1')).toBeInTheDocument();
    expect(screen.queryByText('Test Product 2')).not.toBeInTheDocument();
  });

  it('displays correct severity chips', () => {
    renderWithProvider();
    
    expect(screen.getByText('HIGH')).toBeInTheDocument();
    expect(screen.getByText('CRITICAL')).toBeInTheDocument();
  });

  it('displays correct status chips', () => {
    renderWithProvider();
    
    expect(screen.getByText('PENDING')).toBeInTheDocument();
    expect(screen.getByText('VERIFIED')).toBeInTheDocument();
  });

  it('shows evidence count', () => {
    renderWithProvider();
    
    expect(screen.getByText('0')).toBeInTheDocument();
  });

  it('displays floating action buttons', () => {
    renderWithProvider();
    
    expect(screen.getByLabelText('Scan QR Code')).toBeInTheDocument();
    expect(screen.getByLabelText('Take Photo')).toBeInTheDocument();
    expect(screen.getByLabelText('New Report')).toBeInTheDocument();
  });
});