import React, { useState } from 'react';
import styled from 'styled-components';
import { useMetaMask } from '../contexts/MetaMaskContext';
import { useBlockchain } from '../contexts/BlockchainContext';
import toast from 'react-hot-toast';

const Container = styled.div`
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 15px;
  padding: 2rem;
  margin: 1rem 0;
  border: 1px solid rgba(255, 255, 255, 0.2);
`;

const Title = styled.h2`
  margin: 0 0 1.5rem 0;
  color: #fff;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const Form = styled.form`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-bottom: 1.5rem;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const Label = styled.label`
  color: #fff;
  font-weight: 500;
  font-size: 0.9rem;
`;

const Input = styled.input`
  padding: 0.75rem;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
  font-size: 1rem;
  
  &::placeholder {
    color: rgba(255, 255, 255, 0.6);
  }
  
  &:focus {
    outline: none;
    border-color: #4CAF50;
    box-shadow: 0 0 0 2px rgba(76, 175, 80, 0.2);
  }
`;

const TextArea = styled.textarea`
  padding: 0.75rem;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
  font-size: 1rem;
  min-height: 80px;
  resize: vertical;
  grid-column: 1 / -1;
  
  &::placeholder {
    color: rgba(255, 255, 255, 0.6);
  }
  
  &:focus {
    outline: none;
    border-color: #4CAF50;
    box-shadow: 0 0 0 2px rgba(76, 175, 80, 0.2);
  }
`;

const Button = styled.button`
  background: linear-gradient(135deg, #4CAF50, #45a049);
  color: white;
  border: none;
  padding: 1rem 2rem;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  grid-column: 1 / -1;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3);
  }
  
  &:disabled {
    background: rgba(255, 255, 255, 0.2);
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
`;

const StatusCard = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  padding: 1rem;
  margin-top: 1rem;
  border-left: 4px solid #4CAF50;
`;

const StatusText = styled.p`
  margin: 0;
  color: #fff;
  font-size: 0.9rem;
`;

const LoadingSpinner = styled.div`
  display: inline-block;
  width: 20px;
  height: 20px;
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: #fff;
  animation: spin 1s ease-in-out infinite;
  
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;

const BatchCreator = () => {
  const { isConnected, account, connect } = useMetaMask();
  const { createBatch, loading } = useBlockchain();
  const [formData, setFormData] = useState({
    drugName: '',
    quantity: '',
    manufacturer: '',
    lotNumber: '',
    dosageForm: '',
    strength: '',
    packaging: '',
    description: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastBatch, setLastBatch] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!isConnected) {
      toast.error('Please connect your wallet first');
      const result = await connect();
      if (!result.success) return;
    }

    if (!formData.drugName || !formData.quantity) {
      toast.error('Please fill in required fields');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const batchData = {
        drugName: formData.drugName,
        quantity: parseInt(formData.quantity),
        manufacturer: formData.manufacturer || account,
        lotNumber: formData.lotNumber || `LOT-${Date.now()}`,
        dosageForm: formData.dosageForm || 'Tablet',
        strength: formData.strength || '100mg',
        packaging: formData.packaging || 'Bottle',
        description: formData.description
      };

      const result = await createBatch(batchData);
      
      if (result.success) {
        setLastBatch(result.batch);
        toast.success('Batch created successfully!');
        setFormData({
          drugName: '',
          quantity: '',
          manufacturer: '',
          lotNumber: '',
          dosageForm: '',
          strength: '',
          packaging: '',
          description: ''
        });
      } else {
        toast.error(result.error || 'Failed to create batch');
      }
    } catch (error) {
      console.error('Error creating batch:', error);
      toast.error('An error occurred while creating the batch');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Container>
      <Title>
        💊 Create New Pharmaceutical Batch
      </Title>
      
      {!isConnected && (
        <StatusCard>
          <StatusText>
            ⚠️ Please connect your MetaMask wallet to create batches
          </StatusText>
          <Button onClick={connect} style={{ marginTop: '1rem', gridColumn: 'auto' }}>
            Connect Wallet
          </Button>
        </StatusCard>
      )}

      <Form onSubmit={handleSubmit}>
        <FormGroup>
          <Label htmlFor="drugName">Drug Name *</Label>
          <Input
            type="text"
            id="drugName"
            name="drugName"
            value={formData.drugName}
            onChange={handleInputChange}
            placeholder="e.g., Aspirin 100mg"
            required
          />
        </FormGroup>

        <FormGroup>
          <Label htmlFor="quantity">Quantity *</Label>
          <Input
            type="number"
            id="quantity"
            name="quantity"
            value={formData.quantity}
            onChange={handleInputChange}
            placeholder="e.g., 1000"
            min="1"
            required
          />
        </FormGroup>

        <FormGroup>
          <Label htmlFor="manufacturer">Manufacturer</Label>
          <Input
            type="text"
            id="manufacturer"
            name="manufacturer"
            value={formData.manufacturer}
            onChange={handleInputChange}
            placeholder="e.g., PharmCorp Manufacturing"
          />
        </FormGroup>

        <FormGroup>
          <Label htmlFor="lotNumber">Lot Number</Label>
          <Input
            type="text"
            id="lotNumber"
            name="lotNumber"
            value={formData.lotNumber}
            onChange={handleInputChange}
            placeholder="e.g., LOT-2024-001"
          />
        </FormGroup>

        <FormGroup>
          <Label htmlFor="dosageForm">Dosage Form</Label>
          <Input
            type="text"
            id="dosageForm"
            name="dosageForm"
            value={formData.dosageForm}
            onChange={handleInputChange}
            placeholder="e.g., Tablet, Capsule, Liquid"
          />
        </FormGroup>

        <FormGroup>
          <Label htmlFor="strength">Strength</Label>
          <Input
            type="text"
            id="strength"
            name="strength"
            value={formData.strength}
            onChange={handleInputChange}
            placeholder="e.g., 100mg, 500mg"
          />
        </FormGroup>

        <FormGroup>
          <Label htmlFor="packaging">Packaging</Label>
          <Input
            type="text"
            id="packaging"
            name="packaging"
            value={formData.packaging}
            onChange={handleInputChange}
            placeholder="e.g., Bottle of 100 tablets"
          />
        </FormGroup>

        <FormGroup>
          <Label htmlFor="description">Description</Label>
          <TextArea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            placeholder="Additional details about the batch..."
          />
        </FormGroup>

        <Button type="submit" disabled={!isConnected || isSubmitting || loading}>
          {isSubmitting ? (
            <>
              <LoadingSpinner /> Creating Batch...
            </>
          ) : (
            '🚀 Create Batch & Mine Block'
          )}
        </Button>
      </Form>

      {lastBatch && (
        <StatusCard>
          <StatusText>
            ✅ <strong>Batch Created Successfully!</strong>
          </StatusText>
          <StatusText>
            📋 Batch ID: {lastBatch.batchId}
          </StatusText>
          <StatusText>
            🔗 Transaction: {lastBatch.txHash}
          </StatusText>
          <StatusText>
            ⛓️ Block: {lastBatch.blockNumber}
          </StatusText>
        </StatusCard>
      )}
    </Container>
  );
};

export default BatchCreator;
