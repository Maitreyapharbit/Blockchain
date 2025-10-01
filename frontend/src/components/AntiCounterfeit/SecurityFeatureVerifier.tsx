import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  TextField,
  Alert,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Paper,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  Avatar,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  LinearProgress,
  Badge,
} from '@mui/material';
import {
  QrCode,
  Security,
  CheckCircle,
  Error,
  Warning,
  Info,
  CameraAlt,
  Upload,
  Refresh,
  Assignment,
  VerifiedUser,
  Block,
  Schedule,
  LocationOn,
  Inventory,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
  scanQRCode,
  verifyHologram,
  verifySerialNumber,
  fetchBatchSecurityFeatures,
  fetchRealTimeVerificationStatus,
} from '../../store/counterfeitSlice';
import { SecurityFeatureVerifierProps, SecurityFeature, VerificationResult } from '../../types';
import { blockchainValidator } from '../../utils/blockchainValidation';
import { format } from 'date-fns';

const SecurityFeatureVerifier: React.FC<SecurityFeatureVerifierProps> = ({
  batchId,
  onVerificationComplete,
  loading,
}) => {
  const dispatch = useAppDispatch();
  const {
    currentBatch, 
    securityFeatures, 
    realTimeStatus 
  } = useAppSelector((state) => state.counterfeit);
  
  const [activeStep, setActiveStep] = useState(0);
  const [verificationData, setVerificationData] = useState({
    qrCode: '',
    hologram: '',
    serialNumber: '',
    tamperEvidence: '',
  });
  const [verificationResults, setVerificationResults] = useState<VerificationResult[]>([]);
  const [currentVerification, setCurrentVerification] = useState<VerificationResult | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [scanResult, setScanResult] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const steps = [
    'QR Code Verification',
    'Hologram Check',
    'Serial Number Validation',
    'Tamper Evidence',
    'Blockchain Verification',
    'Final Assessment',
  ];

  useEffect(() => {
    if (batchId) {
      dispatch(fetchBatchSecurityFeatures(batchId));
      dispatch(fetchRealTimeVerificationStatus(batchId));
    }
  }, [dispatch, batchId]);

  const handleInputChange = (field: string, value: string) => {
    setVerificationData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleQRCodeScan = async () => {
    if (!verificationData.qrCode.trim()) {
      setVerificationError('Please enter a QR code or scan one');
      return;
    }

    setIsVerifying(true);
    setVerificationError(null);

    try {
      const result = await dispatch(scanQRCode(verificationData.qrCode)).unwrap();
      const verificationResult: VerificationResult = {
        id: `qr_${Date.now()}`,
        batchId: result.batchId,
        verificationType: 'qr_scan',
        result: result.verificationResult.result,
        confidence: result.verificationResult.confidence,
        timestamp: new Date().toISOString(),
        details: result.verificationResult.details,
        verifiedBy: 'Current User',
      };
      
      setVerificationResults(prev => [...prev, verificationResult]);
      setCurrentVerification(verificationResult);
      
      if (verificationResult.result === 'authentic') {
        setActiveStep(1);
      }
    } catch (error) {
      setVerificationError('QR code verification failed');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleHologramVerification = async () => {
    if (!verificationData.hologram.trim()) {
      setVerificationError('Please enter hologram data or scan one');
      return;
    }

    setIsVerifying(true);
    setVerificationError(null);

    try {
      const result = await dispatch(verifyHologram({
        batchId,
        hologramData: verificationData.hologram,
      })).unwrap();
      
      setVerificationResults(prev => [...prev, result]);
      setCurrentVerification(result);
      
      if (result.result === 'authentic') {
        setActiveStep(2);
      }
    } catch (error) {
      setVerificationError('Hologram verification failed');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSerialNumberVerification = async () => {
    if (!verificationData.serialNumber.trim()) {
      setVerificationError('Please enter a serial number');
      return;
    }

    setIsVerifying(true);
    setVerificationError(null);

    try {
      const result = await dispatch(verifySerialNumber({
        batchId,
        serialNumber: verificationData.serialNumber,
      })).unwrap();
      
      setVerificationResults(prev => [...prev, result]);
      setCurrentVerification(result);
      
      if (result.result === 'authentic') {
        setActiveStep(3);
      }
    } catch (error) {
      setVerificationError('Serial number verification failed');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleTamperEvidenceCheck = async () => {
    setIsVerifying(true);
    setVerificationError(null);

    try {
      // Simulate tamper evidence check
      const isIntact = verificationData.tamperEvidence === 'intact';
      const result: VerificationResult = {
        id: `tamper_${Date.now()}`,
        batchId,
        verificationType: 'serial_validation',
        result: isIntact ? 'authentic' : 'counterfeit',
        confidence: isIntact ? 95 : 85,
        timestamp: new Date().toISOString(),
        details: isIntact ? 'Tamper evidence intact' : 'Tamper evidence compromised',
        verifiedBy: 'Current User',
      };
      
      setVerificationResults(prev => [...prev, result]);
      setCurrentVerification(result);
      
      if (result.result === 'authentic') {
        setActiveStep(4);
      }
    } catch (error) {
      setVerificationError('Tamper evidence check failed');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleBlockchainVerification = async () => {
    if (!currentBatch) {
      setVerificationError('No batch data available for blockchain verification');
      return;
    }

    setIsVerifying(true);
    setVerificationError(null);

    try {
      const result = await blockchainValidator.validateBatchAuthenticity(currentBatch);
      
      const verificationResult: VerificationResult = {
        id: `blockchain_${Date.now()}`,
        batchId,
        verificationType: 'blockchain_verify',
        result: result.isValid ? 'authentic' : 'counterfeit',
        confidence: result.confidence,
        timestamp: new Date().toISOString(),
        details: result.details,
        verifiedBy: 'Blockchain Validator',
      };
      
      setVerificationResults(prev => [...prev, verificationResult]);
      setCurrentVerification(verificationResult);
      
      if (verificationResult.result === 'authentic') {
        setActiveStep(5);
      }
    } catch (error) {
      setVerificationError('Blockchain verification failed');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleFinalAssessment = () => {
    const authenticCount = verificationResults.filter(r => r.result === 'authentic').length;
    const totalCount = verificationResults.length;
    const authenticityScore = totalCount > 0 ? (authenticCount / totalCount) * 100 : 0;
    
    const finalResult: VerificationResult = {
      id: `final_${Date.now()}`,
      batchId,
      verificationType: 'qr_scan',
      result: authenticityScore >= 80 ? 'authentic' : authenticityScore >= 50 ? 'suspicious' : 'counterfeit',
      confidence: authenticityScore,
      timestamp: new Date().toISOString(),
      details: `Final assessment: ${authenticityScore.toFixed(1)}% authentic based on ${totalCount} verifications`,
      verifiedBy: 'System',
    };
    
    setVerificationResults(prev => [...prev, finalResult]);
    setCurrentVerification(finalResult);
    onVerificationComplete(finalResult);
  };

  const handleCameraScan = () => {
    setCameraOpen(true);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Simulate file processing
      setScanResult('File uploaded successfully');
    }
  };

  const getVerificationIcon = (result: string) => {
    switch (result) {
      case 'authentic': return <CheckCircle color="success" />;
      case 'counterfeit': return <Error color="error" />;
      case 'suspicious': return <Warning color="warning" />;
      default: return <Info color="info" />;
    }
  };

  const getVerificationColor = (result: string) => {
    switch (result) {
      case 'authentic': return 'success';
      case 'counterfeit': return 'error';
      case 'suspicious': return 'warning';
      default: return 'info';
    }
  };

  const getStepIcon = (step: number) => {
    if (step < activeStep) return <CheckCircle />;
    if (step === activeStep) return <Schedule />;
    return <Info />;
  };

  const getStepColor = (step: number) => {
    if (step < activeStep) return 'success';
    if (step === activeStep) return 'primary';
    return 'default';
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress size={60} />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Security Feature Verifier
      </Typography>

      {verificationError && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {verificationError}
        </Alert>
      )}

      {/* Batch Information */}
      {currentBatch && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Batch Information
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Typography variant="body2" color="textSecondary">
                  Product: {currentBatch.productName}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Batch Number: {currentBatch.batchNumber}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Location: {currentBatch.location}
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="body2" color="textSecondary">
                  Manufactured: {format(new Date(currentBatch.manufacturingDate), 'MMM dd, yyyy')}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Expires: {format(new Date(currentBatch.expiryDate), 'MMM dd, yyyy')}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Quantity: {currentBatch.quantity.toLocaleString()}
                </Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Verification Stepper */}
      <Card>
        <CardContent>
          <Stepper activeStep={activeStep} orientation="vertical">
            {/* Step 1: QR Code Verification */}
            <Step>
              <StepLabel
                icon={getStepIcon(0)}
                color={getStepColor(0)}
              >
                QR Code Verification
              </StepLabel>
              <StepContent>
                <Box mb={2}>
                  <TextField
                    fullWidth
                    label="QR Code Data"
                    value={verificationData.qrCode}
                    onChange={(e) => handleInputChange('qrCode', e.target.value)}
                    placeholder="Enter QR code data or scan with camera"
                    InputProps={{
                      endAdornment: (
                        <Box display="flex" gap={1}>
                          <IconButton onClick={handleCameraScan}>
                            <CameraAlt />
                          </IconButton>
                          <IconButton onClick={() => fileInputRef.current?.click()}>
                            <Upload />
                          </IconButton>
                        </Box>
                      ),
                    }}
                  />
                  <input
                    type="file"
                    ref={fileInputRef}
                    style={{ display: 'none' }}
                    accept="image/*"
                    onChange={handleFileUpload}
                  />
                </Box>
                <Button
                  variant="contained"
                  onClick={handleQRCodeScan}
                  disabled={isVerifying || !verificationData.qrCode.trim()}
                  startIcon={isVerifying ? <CircularProgress size={20} /> : <QrCode />}
                >
                  {isVerifying ? 'Verifying...' : 'Verify QR Code'}
                </Button>
              </StepContent>
            </Step>

            {/* Step 2: Hologram Check */}
            <Step>
              <StepLabel
                icon={getStepIcon(1)}
                color={getStepColor(1)}
              >
                Hologram Check
              </StepLabel>
              <StepContent>
                <Box mb={2}>
                  <TextField
                    fullWidth
                    label="Hologram Data"
                    value={verificationData.hologram}
                    onChange={(e) => handleInputChange('hologram', e.target.value)}
                    placeholder="Enter hologram verification data"
                  />
                </Box>
                <Button
                  variant="contained"
                  onClick={handleHologramVerification}
                  disabled={isVerifying || !verificationData.hologram.trim()}
                  startIcon={isVerifying ? <CircularProgress size={20} /> : <Security />}
                >
                  {isVerifying ? 'Verifying...' : 'Verify Hologram'}
                </Button>
              </StepContent>
            </Step>

            {/* Step 3: Serial Number Validation */}
            <Step>
              <StepLabel
                icon={getStepIcon(2)}
                color={getStepColor(2)}
              >
                Serial Number Validation
              </StepLabel>
              <StepContent>
                <Box mb={2}>
                  <TextField
                    fullWidth
                    label="Serial Number"
                    value={verificationData.serialNumber}
                    onChange={(e) => handleInputChange('serialNumber', e.target.value)}
                    placeholder="Enter serial number"
                  />
                </Box>
                <Button
                  variant="contained"
                  onClick={handleSerialNumberVerification}
                  disabled={isVerifying || !verificationData.serialNumber.trim()}
                  startIcon={isVerifying ? <CircularProgress size={20} /> : <Assignment />}
                >
                  {isVerifying ? 'Verifying...' : 'Verify Serial Number'}
                </Button>
              </StepContent>
            </Step>

            {/* Step 4: Tamper Evidence */}
            <Step>
              <StepLabel
                icon={getStepIcon(3)}
                color={getStepColor(3)}
              >
                Tamper Evidence Check
              </StepLabel>
              <StepContent>
                <Box mb={2}>
                  <FormControl fullWidth>
                    <InputLabel>Tamper Evidence Status</InputLabel>
                    <Select
                      value={verificationData.tamperEvidence}
                      label="Tamper Evidence Status"
                      onChange={(e) => handleInputChange('tamperEvidence', e.target.value)}
                    >
                      <MenuItem value="intact">Intact</MenuItem>
                      <MenuItem value="compromised">Compromised</MenuItem>
                      <MenuItem value="unknown">Unknown</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
                <Button
                  variant="contained"
                  onClick={handleTamperEvidenceCheck}
                  disabled={isVerifying || !verificationData.tamperEvidence}
                  startIcon={isVerifying ? <CircularProgress size={20} /> : <Block />}
                >
                  {isVerifying ? 'Checking...' : 'Check Tamper Evidence'}
                </Button>
              </StepContent>
            </Step>

            {/* Step 5: Blockchain Verification */}
            <Step>
              <StepLabel
                icon={getStepIcon(4)}
                color={getStepColor(4)}
              >
                Blockchain Verification
              </StepLabel>
              <StepContent>
                <Box mb={2}>
                  <Alert severity="info">
                    This will verify the batch against the blockchain to ensure authenticity.
                  </Alert>
                </Box>
                <Button
                  variant="contained"
                  onClick={handleBlockchainVerification}
                  disabled={isVerifying}
                  startIcon={isVerifying ? <CircularProgress size={20} /> : <VerifiedUser />}
                >
                  {isVerifying ? 'Verifying...' : 'Verify on Blockchain'}
                </Button>
              </StepContent>
            </Step>

            {/* Step 6: Final Assessment */}
            <Step>
              <StepLabel
                icon={getStepIcon(5)}
                color={getStepColor(5)}
              >
                Final Assessment
              </StepLabel>
              <StepContent>
                <Box mb={2}>
                  <Typography variant="body1" paragraph>
                    Based on all verification steps, the system will provide a final assessment
                    of the product's authenticity.
                  </Typography>
                </Box>
                <Button
                  variant="contained"
                  onClick={handleFinalAssessment}
                  disabled={isVerifying}
                  startIcon={isVerifying ? <CircularProgress size={20} /> : <CheckCircle />}
                >
                  {isVerifying ? 'Assessing...' : 'Complete Assessment'}
                </Button>
              </StepContent>
            </Step>
          </Stepper>
        </CardContent>
      </Card>

      {/* Verification Results */}
      {verificationResults.length > 0 && (
        <Card sx={{ mt: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Verification Results
            </Typography>
            <List>
              {verificationResults.map((result, index) => (
                <motion.div
                  key={result.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <ListItem>
                    <ListItemIcon>
                      <Avatar
                        sx={{
                          bgcolor: getVerificationColor(result.result),
                        }}
                      >
                        {getVerificationIcon(result.result)}
                      </Avatar>
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Box display="flex" alignItems="center" gap={1}>
                          <Typography variant="subtitle1">
                            {result.verificationType.replace('_', ' ').toUpperCase()}
                          </Typography>
                          <Chip
                            label={result.result.toUpperCase()}
                            color={getVerificationColor(result.result) as any}
                            size="small"
                          />
                          <Chip
                            label={`${result.confidence}%`}
                            color="primary"
                            size="small"
                            variant="outlined"
                          />
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography variant="body2" color="textSecondary">
                            {result.details}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            {format(new Date(result.timestamp), 'MMM dd, yyyy HH:mm')} - {result.verifiedBy}
                          </Typography>
                        </Box>
                      }
                    />
                  </ListItem>
                </motion.div>
              ))}
            </List>
          </CardContent>
        </Card>
      )}

      {/* Current Verification Status */}
      {currentVerification && (
        <Card sx={{ mt: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Current Verification Status
            </Typography>
            <Box display="flex" alignItems="center" gap={2} mb={2}>
              <Avatar
                sx={{
                  bgcolor: getVerificationColor(currentVerification.result),
                  width: 60,
                  height: 60,
                }}
              >
                {getVerificationIcon(currentVerification.result)}
              </Avatar>
              <Box>
                <Typography variant="h5" fontWeight="bold">
                  {currentVerification.result.toUpperCase()}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Confidence: {currentVerification.confidence}%
                </Typography>
              </Box>
            </Box>
            <Typography variant="body1" paragraph>
              {currentVerification.details}
            </Typography>
            <LinearProgress
              variant="determinate"
              value={currentVerification.confidence}
              color={getVerificationColor(currentVerification.result) as any}
              sx={{ height: 8, borderRadius: 4 }}
            />
          </CardContent>
        </Card>
      )}

      {/* Camera Dialog */}
      <Dialog
        open={cameraOpen}
        onClose={() => setCameraOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Scan QR Code
        </DialogTitle>
        <DialogContent>
          <Box textAlign="center" py={4}>
            <CameraAlt sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              Camera functionality would be implemented here
            </Typography>
            <Typography variant="body2" color="textSecondary">
              This would integrate with the device camera to scan QR codes
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCameraOpen(false)}>
            Close
          </Button>
          <Button
            variant="contained"
            onClick={() => {
              setScanResult('QR Code scanned successfully');
              setCameraOpen(false);
            }}
          >
            Simulate Scan
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SecurityFeatureVerifier;