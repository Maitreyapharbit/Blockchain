import React, { useState, useRef, useEffect } from 'react';
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

const ScannerContainer = styled.div`
  position: relative;
  width: 100%;
  max-width: 400px;
  margin: 0 auto;
  border-radius: 12px;
  overflow: hidden;
  background: #000;
`;

const Video = styled.video`
  width: 100%;
  height: 300px;
  object-fit: cover;
`;

const Canvas = styled.canvas`
  display: none;
`;

const ScannerOverlay = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 200px;
  height: 200px;
  border: 2px solid #4CAF50;
  border-radius: 12px;
  background: transparent;
  
  &::before {
    content: '';
    position: absolute;
    top: -2px;
    left: -2px;
    right: -2px;
    bottom: -2px;
    border: 2px solid rgba(76, 175, 80, 0.3);
    border-radius: 12px;
    animation: pulse 2s infinite;
  }
  
  @keyframes pulse {
    0% { opacity: 1; }
    50% { opacity: 0.5; }
    100% { opacity: 1; }
  }
`;

const Controls = styled.div`
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
  justify-content: center;
`;

const Button = styled.button`
  background: linear-gradient(135deg, #4CAF50, #45a049);
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  
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

const StopButton = styled(Button)`
  background: linear-gradient(135deg, #F44336, #D32F2F);
  
  &:hover {
    box-shadow: 0 4px 12px rgba(244, 67, 54, 0.3);
  }
`;

const StatusText = styled.p`
  color: #fff;
  text-align: center;
  margin: 1rem 0;
  font-size: 0.9rem;
`;

const ResultContainer = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  padding: 1rem;
  margin-top: 1rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
`;

const ResultText = styled.p`
  color: #4CAF50;
  margin: 0;
  font-weight: 600;
  text-align: center;
`;

const QRCodeScanner = () => {
  const { getBatch } = useBlockchain();
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [error, setError] = useState(null);

  const startScanning = async () => {
    try {
      setError(null);
      setScanResult(null);
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      });
      
      streamRef.current = stream;
      videoRef.current.srcObject = stream;
      setIsScanning(true);
      
      // Start scanning for QR codes
      scanForQRCode();
      
    } catch (err) {
      console.error('Error accessing camera:', err);
      setError('Camera access denied or not available');
      toast.error('Camera access denied or not available');
    }
  };

  const stopScanning = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsScanning(false);
  };

  const scanForQRCode = () => {
    if (!isScanning) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      
      // Simple QR code detection (in a real app, you'd use a library like jsQR)
      // For now, we'll simulate detection
      setTimeout(() => {
        if (isScanning) {
          // Simulate finding a QR code with batch ID
          const mockBatchId = Math.floor(Math.random() * 10);
          handleQRCodeDetected(`https://pharbit.com/verify/${mockBatchId}`);
        }
      }, 2000);
    }

    if (isScanning) {
      requestAnimationFrame(scanForQRCode);
    }
  };

  const handleQRCodeDetected = async (qrData) => {
    try {
      // Extract batch ID from URL
      const batchIdMatch = qrData.match(/\/verify\/(\d+)/);
      if (!batchIdMatch) {
        setError('Invalid QR code format');
        return;
      }

      const batchId = batchIdMatch[1];
      setScanResult(`Found batch ID: ${batchId}`);
      
      // Verify the batch
      const result = await getBatch(batchId);
      if (result.success) {
        toast.success(`Batch ${batchId} verified successfully!`);
        setScanResult(`✅ Batch ${batchId} verified: ${result.batch.drugName}`);
      } else {
        toast.error(`Batch ${batchId} not found`);
        setScanResult(`❌ Batch ${batchId} not found`);
      }
      
      stopScanning();
      
    } catch (error) {
      console.error('Error processing QR code:', error);
      setError('Error processing QR code');
      toast.error('Error processing QR code');
    }
  };

  const handleManualInput = () => {
    const batchId = prompt('Enter batch ID to verify:');
    if (batchId) {
      handleQRCodeDetected(`https://pharbit.com/verify/${batchId}`);
    }
  };

  useEffect(() => {
    return () => {
      stopScanning();
    };
  }, []);

  return (
    <Container>
      <Title>
        📱 Scan QR Code to Verify Batch
      </Title>
      
      <ScannerContainer>
        <Video
          ref={videoRef}
          autoPlay
          playsInline
          muted
        />
        <Canvas ref={canvasRef} />
        {isScanning && <ScannerOverlay />}
      </ScannerContainer>

      <Controls>
        {!isScanning ? (
          <Button onClick={startScanning}>
            📷 Start Scanning
          </Button>
        ) : (
          <StopButton onClick={stopScanning}>
            ⏹️ Stop Scanning
          </StopButton>
        )}
        <Button onClick={handleManualInput}>
          ⌨️ Manual Input
        </Button>
      </Controls>

      {isScanning && (
        <StatusText>
          📡 Scanning for QR codes... Point your camera at a batch QR code
        </StatusText>
      )}

      {error && (
        <StatusText style={{ color: '#F44336' }}>
          ❌ {error}
        </StatusText>
      )}

      {scanResult && (
        <ResultContainer>
          <ResultText>{scanResult}</ResultText>
        </ResultContainer>
      )}
    </Container>
  );
};

export default QRCodeScanner;