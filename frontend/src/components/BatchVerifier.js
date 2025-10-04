import React, { useState } from 'react';
import styled from 'styled-components';
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

const SearchForm = styled.form`
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
`;

const Input = styled.input`
  flex: 1;
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
    border-color: #2196F3;
    box-shadow: 0 0 0 2px rgba(33, 150, 243, 0.2);
  }
`;

const Button = styled.button`
  background: linear-gradient(135deg, #2196F3, #1976D2);
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  white-space: nowrap;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(33, 150, 243, 0.3);
  }
  
  &:disabled {
    background: rgba(255, 255, 255, 0.2);
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
`;

const BatchCard = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  padding: 1.5rem;
  margin: 1rem 0;
  border: 1px solid rgba(255, 255, 255, 0.1);
`;

const BatchHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
`;

const BatchId = styled.h3`
  margin: 0;
  color: #4CAF50;
  font-size: 1.2rem;
`;

const Status = styled.span`
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 600;
  background: ${props => props.verified ? '#4CAF50' : '#FF9800'};
  color: white;
`;

const BatchDetails = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
`;

const DetailItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

const DetailLabel = styled.span`
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.8rem;
  font-weight: 500;
`;

const DetailValue = styled.span`
  color: #fff;
  font-size: 0.9rem;
  word-break: break-all;
`;

const VerificationResult = styled.div`
  background: ${props => props.$verified ? 'rgba(76, 175, 80, 0.1)' : 'rgba(244, 67, 54, 0.1)'};
  border: 1px solid ${props => props.$verified ? '#4CAF50' : '#F44336'};
  border-radius: 8px;
  padding: 1rem;
  margin-top: 1rem;
`;

const VerificationText = styled.p`
  margin: 0;
  color: ${props => props.$verified ? '#4CAF50' : '#F44336'};
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.5rem;
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

const AvailableBatches = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  padding: 1rem;
  margin-top: 1rem;
`;

const BatchList = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 0.5rem;
  margin-top: 0.5rem;
`;

const BatchItem = styled.div`
  background: rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  padding: 0.5rem;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid rgba(255, 255, 255, 0.1);
  
  &:hover {
    background: rgba(255, 255, 255, 0.15);
    border-color: #2196F3;
  }
`;

const BatchItemText = styled.div`
  color: #fff;
  font-size: 0.8rem;
  font-weight: 500;
`;

const BatchItemSubtext = styled.div`
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.7rem;
  margin-top: 0.25rem;
`;

const QRCodeContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 1rem;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.1);
`;

const QRCodeImage = styled.img`
  width: 200px;
  height: 200px;
  border-radius: 8px;
  margin-bottom: 1rem;
  border: 2px solid rgba(255, 255, 255, 0.2);
`;

const QRCodeInfo = styled.div`
  text-align: center;
  color: #fff;
`;

const QRCodeTitle = styled.h4`
  margin: 0 0 0.5rem 0;
  color: #4CAF50;
  font-size: 1rem;
`;

const QRCodeText = styled.p`
  margin: 0.25rem 0;
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.8);
  word-break: break-all;
`;

const DownloadButton = styled.button`
  background: linear-gradient(135deg, #2196F3, #1976D2);
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-top: 0.5rem;
  
  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(33, 150, 243, 0.3);
  }
`;

const BatchVerifier = () => {
  const { getBatch, loading, batches } = useBlockchain();
  const [searchId, setSearchId] = useState('');
  const [batch, setBatch] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);

  const handleSearch = async (e) => {
    e.preventDefault();
    
    if (!searchId.trim()) {
      toast.error('Please enter a batch ID');
      return;
    }

    setIsSearching(true);
    setVerificationResult(null);
    
    try {
      const result = await getBatch(searchId);
      
      if (result.success) {
        setBatch(result.batch);
        setVerificationResult({
          verified: true,
          message: 'Batch verified on blockchain',
          timestamp: new Date().toLocaleString()
        });
        toast.success('Batch found and verified!');
      } else {
        setBatch(null);
        setVerificationResult({
          verified: false,
          message: result.error || 'Batch not found',
          timestamp: new Date().toLocaleString()
        });
        toast.error('Batch not found');
      }
    } catch (error) {
      console.error('Error searching batch:', error);
      setBatch(null);
      setVerificationResult({
        verified: false,
        message: 'Error occurred while searching',
        timestamp: new Date().toLocaleString()
      });
      toast.error('An error occurred while searching');
    } finally {
      setIsSearching(false);
    }
  };

  const formatAddress = (address) => {
    if (!address) return 'N/A';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'N/A';
    return new Date(Number(timestamp) * 1000).toLocaleString();
  };

  const handleBatchClick = (batchId) => {
    setSearchId(batchId.toString());
  };

  return (
    <Container>
      <Title>
        🔍 Verify Batch on Blockchain
      </Title>
      
      <SearchForm onSubmit={handleSearch}>
        <Input
          type="text"
          value={searchId}
          onChange={(e) => setSearchId(e.target.value)}
          placeholder="Enter Batch ID (e.g., 0, 1, 2...)"
        />
        <Button type="submit" disabled={isSearching || loading}>
          {isSearching ? (
            <>
              <LoadingSpinner /> Searching...
            </>
          ) : (
            '🔍 Verify Batch'
          )}
        </Button>
      </SearchForm>

      {batches.length > 0 && (
        <AvailableBatches>
          <DetailLabel style={{ marginBottom: '0.5rem', display: 'block' }}>
            📋 Available Batches ({batches.length})
          </DetailLabel>
          <BatchList>
            {batches.map((batch) => (
              <BatchItem key={batch.batchId} onClick={() => handleBatchClick(batch.batchId)}>
                <BatchItemText>Batch #{batch.batchId}</BatchItemText>
                <BatchItemSubtext>{batch.drugName}</BatchItemSubtext>
              </BatchItem>
            ))}
          </BatchList>
        </AvailableBatches>
      )}

      {verificationResult && (
        <VerificationResult $verified={verificationResult.verified}>
          <VerificationText $verified={verificationResult.verified}>
            {verificationResult.verified ? '✅' : '❌'} {verificationResult.message}
          </VerificationText>
          <VerificationText $verified={verificationResult.verified} style={{ fontSize: '0.8rem', fontWeight: 'normal' }}>
            Verified at: {verificationResult.timestamp}
          </VerificationText>
        </VerificationResult>
      )}

      {batch && (
        <BatchCard>
          <BatchHeader>
            <BatchId>Batch #{batch.batchId || searchId}</BatchId>
            <Status $verified={verificationResult?.verified}>
              {verificationResult?.verified ? 'VERIFIED' : 'UNVERIFIED'}
            </Status>
          </BatchHeader>
          
          <BatchDetails>
            <DetailItem>
              <DetailLabel>Drug Name</DetailLabel>
              <DetailValue>{batch.drugName || 'N/A'}</DetailValue>
            </DetailItem>
            
            <DetailItem>
              <DetailLabel>Quantity</DetailLabel>
              <DetailValue>{batch.quantity ? batch.quantity.toString() : 'N/A'}</DetailValue>
            </DetailItem>
            
            <DetailItem>
              <DetailLabel>Manufacturer</DetailLabel>
              <DetailValue>{formatAddress(batch.manufacturer)}</DetailValue>
            </DetailItem>
            
            <DetailItem>
              <DetailLabel>Created At</DetailLabel>
              <DetailValue>{formatTimestamp(batch.createdAt)}</DetailValue>
            </DetailItem>
            
            <DetailItem>
              <DetailLabel>Lot Number</DetailLabel>
              <DetailValue>{batch.lotNumber || 'N/A'}</DetailValue>
            </DetailItem>
            
            <DetailItem>
              <DetailLabel>Dosage Form</DetailLabel>
              <DetailValue>{batch.dosageForm || 'N/A'}</DetailValue>
            </DetailItem>
            
            <DetailItem>
              <DetailLabel>Strength</DetailLabel>
              <DetailValue>{batch.strength || 'N/A'}</DetailValue>
            </DetailItem>
            
            <DetailItem>
              <DetailLabel>Packaging</DetailLabel>
              <DetailValue>{batch.packaging || 'N/A'}</DetailValue>
            </DetailItem>
          </BatchDetails>
          
          {batch.qrCode && (
            <QRCodeContainer>
              <QRCodeTitle>🔍 Batch QR Code</QRCodeTitle>
              <QRCodeImage 
                src={batch.qrCode.dataUrl} 
                alt="Batch QR Code"
                title="Scan this QR code to verify the batch"
              />
              <QRCodeInfo>
                <QRCodeText>
                  <strong>Batch URL:</strong> {batch.qrCode.batchUrl}
                </QRCodeText>
                <QRCodeText>
                  <strong>QR Hash:</strong> {batch.qrCode.hash.substring(0, 16)}...
                </QRCodeText>
                <QRCodeText>
                  <strong>Generated:</strong> {new Date(batch.qrCode.generatedAt).toLocaleString()}
                </QRCodeText>
                <DownloadButton 
                  onClick={() => {
                    const link = document.createElement('a');
                    link.href = batch.qrCode.dataUrl;
                    link.download = `batch_${batch.batchId || searchId}_qr.png`;
                    link.click();
                  }}
                >
                  📥 Download QR Code
                </DownloadButton>
              </QRCodeInfo>
            </QRCodeContainer>
          )}
        </BatchCard>
      )}
    </Container>
  );
};

export default BatchVerifier;
