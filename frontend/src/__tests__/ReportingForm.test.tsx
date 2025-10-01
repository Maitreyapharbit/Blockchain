import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { ReportingForm } from '../components/AntiCounterfeit/ReportingForm';

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

const defaultProps = {
  onSubmit: jest.fn(),
  loading: false,
  error: null,
};

const renderWithProvider = (props = {}) => {
  return render(
    <Provider store={mockStore}>
      <ReportingForm {...defaultProps} {...props} />
    </Provider>
  );
};

describe('ReportingForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    renderWithProvider();
    expect(screen.getByText('Report Counterfeit Product')).toBeInTheDocument();
  });

  it('displays form steps', () => {
    renderWithProvider();
    expect(screen.getByText('Basic Information')).toBeInTheDocument();
    expect(screen.getByText('Location Details')).toBeInTheDocument();
    expect(screen.getByText('Evidence Upload')).toBeInTheDocument();
    expect(screen.getByText('Contact Information')).toBeInTheDocument();
    expect(screen.getByText('Review & Submit')).toBeInTheDocument();
  });

  it('shows loading state', () => {
    renderWithProvider({ loading: true });
    expect(screen.getByText('Submitting Report...')).toBeInTheDocument();
  });

  it('shows error message', () => {
    const errorMessage = 'Test error message';
    renderWithProvider({ error: errorMessage });
    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });

  it('displays basic information fields', () => {
    renderWithProvider();
    expect(screen.getByLabelText('Batch ID')).toBeInTheDocument();
    expect(screen.getByLabelText('Product Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Description')).toBeInTheDocument();
    expect(screen.getByLabelText('Severity Level')).toBeInTheDocument();
  });

  it('displays location fields', () => {
    renderWithProvider();
    expect(screen.getByLabelText('Address')).toBeInTheDocument();
    expect(screen.getByLabelText('Latitude')).toBeInTheDocument();
    expect(screen.getByLabelText('Longitude')).toBeInTheDocument();
  });

  it('displays evidence upload section', () => {
    renderWithProvider();
    expect(screen.getByText('Upload Evidence')).toBeInTheDocument();
    expect(screen.getByText('Upload Files')).toBeInTheDocument();
    expect(screen.getByText('Take Photo')).toBeInTheDocument();
  });

  it('displays contact information fields', () => {
    renderWithProvider();
    expect(screen.getByLabelText('Full Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Email Address')).toBeInTheDocument();
    expect(screen.getByLabelText('Phone Number')).toBeInTheDocument();
  });

  it('validates required fields', () => {
    renderWithProvider();
    
    const nextButton = screen.getByText('Next');
    expect(nextButton).toBeDisabled();
    
    const batchIdInput = screen.getByLabelText('Batch ID');
    const productNameInput = screen.getByLabelText('Product Name');
    const descriptionInput = screen.getByLabelText('Description');
    
    fireEvent.change(batchIdInput, { target: { value: 'BATCH001' } });
    fireEvent.change(productNameInput, { target: { value: 'Test Product' } });
    fireEvent.change(descriptionInput, { target: { value: 'Test description' } });
    
    expect(nextButton).not.toBeDisabled();
  });

  it('navigates between steps', () => {
    renderWithProvider();
    
    // Fill basic information
    fireEvent.change(screen.getByLabelText('Batch ID'), { target: { value: 'BATCH001' } });
    fireEvent.change(screen.getByLabelText('Product Name'), { target: { value: 'Test Product' } });
    fireEvent.change(screen.getByLabelText('Description'), { target: { value: 'Test description' } });
    
    // Go to next step
    fireEvent.click(screen.getByText('Next'));
    
    // Should be on location step
    expect(screen.getByText('Location Details')).toBeInTheDocument();
    
    // Fill location
    fireEvent.change(screen.getByLabelText('Address'), { target: { value: 'Test Address' } });
    
    // Go to next step
    fireEvent.click(screen.getByText('Next'));
    
    // Should be on evidence step
    expect(screen.getByText('Evidence Upload')).toBeInTheDocument();
  });

  it('validates location step', () => {
    renderWithProvider();
    
    // Fill basic information and go to location step
    fireEvent.change(screen.getByLabelText('Batch ID'), { target: { value: 'BATCH001' } });
    fireEvent.change(screen.getByLabelText('Product Name'), { target: { value: 'Test Product' } });
    fireEvent.change(screen.getByLabelText('Description'), { target: { value: 'Test description' } });
    fireEvent.click(screen.getByText('Next'));
    
    const nextButton = screen.getByText('Next');
    expect(nextButton).toBeDisabled();
    
    fireEvent.change(screen.getByLabelText('Address'), { target: { value: 'Test Address' } });
    
    expect(nextButton).not.toBeDisabled();
  });

  it('validates evidence step', () => {
    renderWithProvider();
    
    // Fill basic information and go to evidence step
    fireEvent.change(screen.getByLabelText('Batch ID'), { target: { value: 'BATCH001' } });
    fireEvent.change(screen.getByLabelText('Product Name'), { target: { value: 'Test Product' } });
    fireEvent.change(screen.getByLabelText('Description'), { target: { value: 'Test description' } });
    fireEvent.click(screen.getByText('Next'));
    
    fireEvent.change(screen.getByLabelText('Address'), { target: { value: 'Test Address' } });
    fireEvent.click(screen.getByText('Next'));
    
    const nextButton = screen.getByText('Next');
    expect(nextButton).toBeDisabled();
    
    // Simulate file upload
    const fileInput = screen.getByLabelText('Upload Files');
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    fireEvent.change(fileInput, { target: { files: [file] } });
    
    // Wait for upload to complete
    waitFor(() => {
      expect(nextButton).not.toBeDisabled();
    });
  });

  it('validates contact information step', () => {
    renderWithProvider();
    
    // Fill all previous steps and go to contact step
    fireEvent.change(screen.getByLabelText('Batch ID'), { target: { value: 'BATCH001' } });
    fireEvent.change(screen.getByLabelText('Product Name'), { target: { value: 'Test Product' } });
    fireEvent.change(screen.getByLabelText('Description'), { target: { value: 'Test description' } });
    fireEvent.click(screen.getByText('Next'));
    
    fireEvent.change(screen.getByLabelText('Address'), { target: { value: 'Test Address' } });
    fireEvent.click(screen.getByText('Next'));
    
    // Simulate file upload
    const fileInput = screen.getByLabelText('Upload Files');
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    fireEvent.change(fileInput, { target: { files: [file] } });
    
    waitFor(() => {
      fireEvent.click(screen.getByText('Next'));
    });
    
    const nextButton = screen.getByText('Next');
    expect(nextButton).toBeDisabled();
    
    fireEvent.change(screen.getByLabelText('Full Name'), { target: { value: 'Test User' } });
    fireEvent.change(screen.getByLabelText('Email Address'), { target: { value: 'test@example.com' } });
    
    expect(nextButton).not.toBeDisabled();
  });

  it('shows review step with all information', () => {
    renderWithProvider();
    
    // Fill all steps
    fireEvent.change(screen.getByLabelText('Batch ID'), { target: { value: 'BATCH001' } });
    fireEvent.change(screen.getByLabelText('Product Name'), { target: { value: 'Test Product' } });
    fireEvent.change(screen.getByLabelText('Description'), { target: { value: 'Test description' } });
    fireEvent.click(screen.getByText('Next'));
    
    fireEvent.change(screen.getByLabelText('Address'), { target: { value: 'Test Address' } });
    fireEvent.click(screen.getByText('Next'));
    
    // Simulate file upload
    const fileInput = screen.getByLabelText('Upload Files');
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    fireEvent.change(fileInput, { target: { files: [file] } });
    
    waitFor(() => {
      fireEvent.click(screen.getByText('Next'));
    });
    
    fireEvent.change(screen.getByLabelText('Full Name'), { target: { value: 'Test User' } });
    fireEvent.change(screen.getByLabelText('Email Address'), { target: { value: 'test@example.com' } });
    fireEvent.click(screen.getByText('Next'));
    
    // Should be on review step
    expect(screen.getByText('Review & Submit')).toBeInTheDocument();
    expect(screen.getByText('Recall Summary')).toBeInTheDocument();
    expect(screen.getByText('BATCH001')).toBeInTheDocument();
    expect(screen.getByText('Test Product')).toBeInTheDocument();
    expect(screen.getByText('Test Address')).toBeInTheDocument();
    expect(screen.getByText('Test User')).toBeInTheDocument();
    expect(screen.getByText('test@example.com')).toBeInTheDocument();
  });

  it('calls onSubmit when form is submitted', () => {
    const onSubmit = jest.fn();
    renderWithProvider({ onSubmit });
    
    // Fill all steps and submit
    fireEvent.change(screen.getByLabelText('Batch ID'), { target: { value: 'BATCH001' } });
    fireEvent.change(screen.getByLabelText('Product Name'), { target: { value: 'Test Product' } });
    fireEvent.change(screen.getByLabelText('Description'), { target: { value: 'Test description' } });
    fireEvent.click(screen.getByText('Next'));
    
    fireEvent.change(screen.getByLabelText('Address'), { target: { value: 'Test Address' } });
    fireEvent.click(screen.getByText('Next'));
    
    // Simulate file upload
    const fileInput = screen.getByLabelText('Upload Files');
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    fireEvent.change(fileInput, { target: { files: [file] } });
    
    waitFor(() => {
      fireEvent.click(screen.getByText('Next'));
    });
    
    fireEvent.change(screen.getByLabelText('Full Name'), { target: { value: 'Test User' } });
    fireEvent.change(screen.getByLabelText('Email Address'), { target: { value: 'test@example.com' } });
    fireEvent.click(screen.getByText('Next'));
    
    fireEvent.click(screen.getByText('Submit Report'));
    
    expect(onSubmit).toHaveBeenCalled();
  });

  it('shows severity options', () => {
    renderWithProvider();
    
    const severitySelect = screen.getByLabelText('Severity Level');
    fireEvent.mouseDown(severitySelect);
    
    expect(screen.getByText('Low')).toBeInTheDocument();
    expect(screen.getByText('Medium')).toBeInTheDocument();
    expect(screen.getByText('High')).toBeInTheDocument();
    expect(screen.getByText('Critical')).toBeInTheDocument();
  });

  it('shows tamper evidence options', () => {
    renderWithProvider();
    
    const tamperSelect = screen.getByLabelText('Tamper Evidence Status');
    fireEvent.mouseDown(tamperSelect);
    
    expect(screen.getByText('Intact')).toBeInTheDocument();
    expect(screen.getByText('Compromised')).toBeInTheDocument();
    expect(screen.getByText('Unknown')).toBeInTheDocument();
  });
});