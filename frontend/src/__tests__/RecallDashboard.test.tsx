import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import RecallDashboard from '../components/RecallManagement/RecallDashboard';
import { Recall } from '../types';

// Mock store
const mockStore = configureStore({
  reducer: {
    recall: (state = {
      recalls: [],
      stats: null,
      pagination: { page: 1, limit: 10, total: 0, hasNext: false, hasPrev: false },
      filters: { status: '', severity: '', search: '' },
    }) => state,
  },
});

// Mock data
const mockRecalls: Recall[] = [
  {
    id: '1',
    title: 'Test Recall 1',
    description: 'Test description',
    severity: 'high',
    status: 'in_progress',
    affectedBatches: ['batch1', 'batch2'],
    initiatedBy: 'Test User',
    initiatedDate: '2023-01-01T00:00:00Z',
    reason: 'Test reason',
    actions: [],
  },
  {
    id: '2',
    title: 'Test Recall 2',
    description: 'Test description 2',
    severity: 'critical',
    status: 'completed',
    affectedBatches: ['batch3'],
    initiatedBy: 'Test User 2',
    initiatedDate: '2023-01-02T00:00:00Z',
    reason: 'Test reason 2',
    actions: [],
  },
];

const mockStats = {
  total: 2,
  active: 1,
  completed: 1,
  bySeverity: { high: 1, critical: 1 },
  byStatus: { in_progress: 1, completed: 1 },
};

const defaultProps = {
  recalls: mockRecalls,
  loading: false,
  error: undefined,
  onRefresh: jest.fn(),
  onRecallClick: jest.fn(),
};

const renderWithProvider = (props = {}) => {
  return render(
    <Provider store={mockStore}>
      <RecallDashboard {...defaultProps} {...props} />
    </Provider>
  );
};

describe('RecallDashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    renderWithProvider();
    expect(screen.getByText('Recall Management Dashboard')).toBeInTheDocument();
  });

  it('displays recall statistics', () => {
    renderWithProvider();
    expect(screen.getByText('Total Recalls')).toBeInTheDocument();
    expect(screen.getByText('Active Recalls')).toBeInTheDocument();
    expect(screen.getByText('Completed')).toBeInTheDocument();
    expect(screen.getByText('Critical')).toBeInTheDocument();
  });

  it('displays recalls in table', () => {
    renderWithProvider();
    expect(screen.getByText('Test Recall 1')).toBeInTheDocument();
    expect(screen.getByText('Test Recall 2')).toBeInTheDocument();
    expect(screen.getByText('Test User')).toBeInTheDocument();
    expect(screen.getByText('Test User 2')).toBeInTheDocument();
  });

  it('shows loading state', () => {
    renderWithProvider({ loading: true, recalls: [] });
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

  it('calls onRecallClick when recall is clicked', () => {
    const onRecallClick = jest.fn();
    renderWithProvider({ onRecallClick });
    
    const viewButton = screen.getByText('View Details');
    fireEvent.click(viewButton);
    
    expect(onRecallClick).toHaveBeenCalledTimes(1);
  });

  it('filters recalls by search term', () => {
    renderWithProvider();
    
    const searchInput = screen.getByPlaceholderText('Search recalls...');
    fireEvent.change(searchInput, { target: { value: 'Test Recall 1' } });
    
    expect(screen.getByText('Test Recall 1')).toBeInTheDocument();
    expect(screen.queryByText('Test Recall 2')).not.toBeInTheDocument();
  });

  it('filters recalls by status', () => {
    renderWithProvider();
    
    const statusSelect = screen.getByLabelText('Status');
    fireEvent.mouseDown(statusSelect);
    
    const inProgressOption = screen.getByText('In Progress');
    fireEvent.click(inProgressOption);
    
    expect(screen.getByText('Test Recall 1')).toBeInTheDocument();
    expect(screen.queryByText('Test Recall 2')).not.toBeInTheDocument();
  });

  it('filters recalls by severity', () => {
    renderWithProvider();
    
    const severitySelect = screen.getByLabelText('Severity');
    fireEvent.mouseDown(severitySelect);
    
    const highOption = screen.getByText('High');
    fireEvent.click(highOption);
    
    expect(screen.getByText('Test Recall 1')).toBeInTheDocument();
    expect(screen.queryByText('Test Recall 2')).not.toBeInTheDocument();
  });

  it('displays correct severity chips', () => {
    renderWithProvider();
    
    expect(screen.getByText('HIGH')).toBeInTheDocument();
    expect(screen.getByText('CRITICAL')).toBeInTheDocument();
  });

  it('displays correct status chips', () => {
    renderWithProvider();
    
    expect(screen.getByText('IN PROGRESS')).toBeInTheDocument();
    expect(screen.getByText('COMPLETED')).toBeInTheDocument();
  });

  it('shows affected batches count', () => {
    renderWithProvider();
    
    expect(screen.getByText('2 batches')).toBeInTheDocument();
    expect(screen.getByText('1 batches')).toBeInTheDocument();
  });
});