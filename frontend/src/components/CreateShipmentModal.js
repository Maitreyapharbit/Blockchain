import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { FaTimes } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { supabase } from '../config/supabase';
import AuthModal from './AuthModal';

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background: white;
  border-radius: 16px;
  padding: 32px;
  max-width: 500px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.2);
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 2px solid #e5e7eb;
`;

const ModalTitle = styled.h2`
  margin: 0;
  color: #1f2937;
  font-size: 24px;
  font-weight: 700;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: #6b7280;
  cursor: pointer;
  font-size: 24px;
  padding: 0;
  transition: color 0.2s ease;
  
  &:hover {
    color: #1f2937;
  }
`;

const FormGroup = styled.div`
  margin-bottom: 20px;
  display: flex;
  flex-direction: column;
`;

const Label = styled.label`
  color: #1f2937;
  font-weight: 600;
  margin-bottom: 8px;
  font-size: 14px;
`;

const Input = styled.input`
  padding: 12px;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-size: 14px;
  font-family: inherit;
  transition: all 0.2s ease;
  
  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
`;

const Select = styled.select`
  padding: 12px;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-size: 14px;
  font-family: inherit;
  background: white;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
`;

const FormRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 20px;
  
  @media (max-width: 500px) {
    grid-template-columns: 1fr;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 12px;
  margin-top: 28px;
`;

const Button = styled.button`
  flex: 1;
  padding: 12px 20px;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 14px;
`;

const SubmitButton = styled(Button)`
  background: #10b981;
  color: white;
  
  &:hover:not(:disabled) {
    background: #059669;
    transform: translateY(-1px);
  }
  
  &:disabled {
    background: #9ca3af;
    cursor: not-allowed;
  }
`;

const CancelButton = styled(Button)`
  background: #f3f4f6;
  color: #1f2937;
  
  &:hover {
    background: #e5e7eb;
  }
`;

const RequiredLabel = styled.span`
  color: #ef4444;
`;

const HelperText = styled.p`
  color: #6b7280;
  font-size: 12px;
  margin: 6px 0 0 0;
`;

const CreateShipmentModal = ({ isOpen, onClose, onSubmit }) => {
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchingBatches, setFetchingBatches] = useState(true);
  const [formData, setFormData] = useState({
    batch_id: '',
    status: 'pending',
    tracking_number: '',
    origin_location: '',
    destination_location: '',
    expected_delivery_date: '',
    temperature_min: '',
    temperature_max: '',
    humidity_min: '',
    humidity_max: '',
    metadata: {},
    // Price transparency fields
    seller_id: '',
    price: '',
    currency: 'USD'
  });

  // Fetch available batches
  useEffect(() => {
    const fetchBatches = async () => {
      try {
        setFetchingBatches(true);
        // Try to fetch from Supabase first
        const { data, error } = await supabase
          .from('batches')
          .select('id, batch_number, drug_name')
          .order('created_at', { ascending: false });

        if (error) {
          console.warn('Error fetching batches from Supabase:', error);
        }

        let fetchedBatches = data || [];

        // Also fetch from localStorage (batches created in the frontend)
        try {
          const localBatches = JSON.parse(localStorage.getItem('pharbitBatches') || '[]');
          // Convert local batches to match Supabase format
          const convertedLocalBatches = localBatches.map(batch => ({
            id: batch.batchId?.toString() || batch.id,
            batch_number: batch.batchNumber || `BATCH-${batch.batchId}`,
            drug_name: batch.drugName || 'Unknown Drug'
          }));

          // Merge and deduplicate (prefer Supabase batches)
          const allBatches = [...fetchedBatches];
          for (const localBatch of convertedLocalBatches) {
            if (!allBatches.find(b => b.id === localBatch.id)) {
              allBatches.push(localBatch);
            }
          }

          setBatches(allBatches);
        } catch (localError) {
          console.warn('Error fetching local batches:', localError);
          setBatches(fetchedBatches);
        }
      } catch (error) {
        console.error('Error fetching batches:', error);
        toast.error('Failed to load batches');
      } finally {
        setFetchingBatches(false);
      }
    };

    if (isOpen) {
      fetchBatches();
    }
  }, [isOpen]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.batch_id || !formData.tracking_number || 
        !formData.origin_location || !formData.destination_location ||
        !formData.seller_id || !formData.price) {
      toast.error('Please fill in all required fields');
      return;
    }

    // Ensure user intent for server persistence when not authenticated
    // Check session and optionally show auth modal
    let showAuth = false;
    try {
      const { data: { session } = {} } = await supabase.auth.getSession();
      if (!session) showAuth = true;
    } catch (sesErr) {
      console.warn('Failed to check session before shipment create:', sesErr);
      showAuth = true;
    }

    if (showAuth) {
      // Open modal in parent by dispatching a custom event — parent pages/providers may listen
      const ev = new CustomEvent('pharbit:show-auth-modal', { detail: { reason: 'create-shipment' } });
      window.dispatchEvent(ev);
      return;
    }

    setLoading(true);
    try {
      const shipmentData = {
        batch_id: formData.batch_id,
        tracking_number: formData.tracking_number,
        origin_location: formData.origin_location,
        destination_location: formData.destination_location,
        status: formData.status || 'pending',
        expected_delivery_date: formData.expected_delivery_date || null,
        temperature_min: formData.temperature_min ? parseFloat(formData.temperature_min) : null,
        temperature_max: formData.temperature_max ? parseFloat(formData.temperature_max) : null,
        humidity_min: formData.humidity_min ? parseFloat(formData.humidity_min) : null,
        humidity_max: formData.humidity_max ? parseFloat(formData.humidity_max) : null,
        metadata: formData.metadata,
        // Include optional price transparency fields if provided
        seller_id: formData.seller_id || undefined,
        price: formData.price ? parseFloat(formData.price) : undefined,
        currency: formData.currency || undefined
      };

      await onSubmit(shipmentData);
      
      // Reset form
      setFormData({
        batch_id: '',
        tracking_number: '',
        origin_location: '',
        destination_location: '',
        expected_delivery_date: '',
        temperature_min: '',
        temperature_max: '',
        humidity_min: '',
        humidity_max: '',
        metadata: {},
        seller_id: '',
        price: '',
        currency: 'USD'
      });
      
      toast.success('Shipment created successfully');
      onClose();
    } catch (error) {
      console.error('Error creating shipment:', error);
      toast.error(error.message || 'Failed to create shipment');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <ModalOverlay onClick={onClose}>
      <ModalContent onClick={e => e.stopPropagation()}>
        <ModalHeader>
          <ModalTitle>Create New Shipment</ModalTitle>
          <CloseButton onClick={onClose}>
            <FaTimes />
          </CloseButton>
        </ModalHeader>

        <form onSubmit={handleSubmit}>
          {/* Batch Selection */}
          <FormGroup>
            <Label>
              Batch <RequiredLabel>*</RequiredLabel>
            </Label>
            <Select
              name="batch_id"
              value={formData.batch_id}
              onChange={handleInputChange}
              disabled={fetchingBatches || loading}
              required
            >
              <option value="">
                {fetchingBatches ? 'Loading batches...' : 'Select a batch'}
              </option>
              {batches.map(batch => (
                <option key={batch.id} value={batch.id}>
                  {batch.batch_number} - {batch.drug_name}
                </option>
              ))}
            </Select>
          </FormGroup>

          {/* Tracking Number */}
          <FormGroup>
            <Label>
              Tracking Number <RequiredLabel>*</RequiredLabel>
            </Label>
            <Input
              type="text"
              name="tracking_number"
              value={formData.tracking_number}
              onChange={handleInputChange}
              placeholder="e.g., TRACK-2024-001"
              disabled={loading}
              required
            />
          </FormGroup>

          {/* Initial Status */}
          <FormGroup>
            <Label>Initial Status</Label>
            <Select
              name="status"
              value={formData.status}
              onChange={handleInputChange}
              disabled={loading}
            >
              <option value="pending">Pending</option>
              <option value="in_transit">In Transit</option>
              <option value="in_factory">In Factory</option>
              <option value="delivered">Delivered</option>
              <option value="delayed">Delayed</option>
              <option value="damaged">Damaged</option>
              <option value="lost">Lost</option>
            </Select>
            <HelperText>If you know the initial status, set it here.</HelperText>
          </FormGroup>

          {/* Origin Location */}
          <FormGroup>
            <Label>
              Origin Location <RequiredLabel>*</RequiredLabel>
            </Label>
            <Input
              type="text"
              name="origin_location"
              value={formData.origin_location}
              onChange={handleInputChange}
              placeholder="e.g., Manufacturer, New York"
              disabled={loading}
              required
            />
          </FormGroup>

          {/* Destination Location */}
          <FormGroup>
            <Label>
              Destination Location <RequiredLabel>*</RequiredLabel>
            </Label>
            <Input
              type="text"
              name="destination_location"
              value={formData.destination_location}
              onChange={handleInputChange}
              placeholder="e.g., Pharmacy, Los Angeles"
              disabled={loading}
              required
            />
          </FormGroup>

          {/* Expected Delivery Date */}
          <FormGroup>
            <Label>Expected Delivery Date</Label>
            <Input
              type="date"
              name="expected_delivery_date"
              value={formData.expected_delivery_date}
              onChange={handleInputChange}
              disabled={loading}
            />
          </FormGroup>

          {/* Temperature Range */}
          <Label>Temperature Range (°C)</Label>
          <FormRow>
            <FormGroup>
              <Label style={{ marginBottom: '4px', fontSize: '12px' }}>Min</Label>
              <Input
                type="number"
                name="temperature_min"
                value={formData.temperature_min}
                onChange={handleInputChange}
                placeholder="Min"
                step="0.1"
                disabled={loading}
              />
            </FormGroup>
            <FormGroup>
              <Label style={{ marginBottom: '4px', fontSize: '12px' }}>Max</Label>
              <Input
                type="number"
                name="temperature_max"
                value={formData.temperature_max}
                onChange={handleInputChange}
                placeholder="Max"
                step="0.1"
                disabled={loading}
              />
            </FormGroup>
          </FormRow>

          {/* Humidity Range */}
          <Label>Humidity Range (%)</Label>
          <FormRow>
            <FormGroup>
              <Label style={{ marginBottom: '4px', fontSize: '12px' }}>Min</Label>
              <Input
                type="number"
                name="humidity_min"
                value={formData.humidity_min}
                onChange={handleInputChange}
                placeholder="Min"
                step="0.1"
                disabled={loading}
              />
            </FormGroup>
            <FormGroup>
              <Label style={{ marginBottom: '4px', fontSize: '12px' }}>Max</Label>
              <Input
                type="number"
                name="humidity_max"
                value={formData.humidity_max}
                onChange={handleInputChange}
                placeholder="Max"
                step="0.1"
                disabled={loading}
              />
            </FormGroup>
          </FormRow>

          {/* Price fields for transparency */}
          <FormGroup>
            <Label>Seller ID <RequiredLabel>*</RequiredLabel></Label>
            <Input
              type="text"
              name="seller_id"
              value={formData.seller_id}
              onChange={handleInputChange}
              placeholder="e.g., seller-123"
              disabled={loading}
              required
            />
            <HelperText>Record the seller who provided the cash price.</HelperText>
          </FormGroup>

          <FormRow>
            <FormGroup>
              <Label>Price <RequiredLabel>*</RequiredLabel></Label>
              <Input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleInputChange}
                placeholder="e.g., 9.99"
                step="0.01"
                disabled={loading}
                required
              />
            </FormGroup>
            <FormGroup>
              <Label>Currency</Label>
              <Select name="currency" value={formData.currency} onChange={handleInputChange} disabled={loading}>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="INR">INR</option>
                <option value="GBP">GBP</option>
              </Select>
            </FormGroup>
          </FormRow>

          {/* Buttons */}
          <ButtonGroup>
            <CancelButton
              type="button"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </CancelButton>
            <SubmitButton
              type="submit"
              disabled={loading || fetchingBatches}
            >
              {loading ? 'Creating...' : 'Create Shipment'}
            </SubmitButton>
          </ButtonGroup>
        </form>
      </ModalContent>
    </ModalOverlay>
  );
};

export default CreateShipmentModal;
