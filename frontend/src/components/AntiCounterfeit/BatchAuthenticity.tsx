import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Alert,
  CircularProgress,
  Paper,
  Chip,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  Avatar,
  TextField,
  Tooltip,
  LinearProgress,
  Badge,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Stepper,
  Step,
  StepLabel,
  StepContent,
} from '@mui/material';
import {
  CheckCircle,
  Error,
  Warning,
  Info,
  QrCode,
  Security,
  Assignment,
  VerifiedUser,
  Block,
  Schedule,
  LocationOn,
  Inventory,
  TrendingUp,
  TrendingDown,
  Refresh,
  History,
  Download,
  Share,
  CameraAlt,
  QrCodeScanner,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
  verifyBatch,
  fetchVerificationHistory,
  fetchBatchSecurityFeatures,
  scanQRCode,
} from '../../store/counterfeitSlice';
import { BatchAuthenticityProps, VerificationResult, SecurityFeature } from '../../types';
import { blockchainValidator } from '../../utils/blockchainValidation';
import { format } from 'date-fns';

const BatchAuthenticity: React.FC<BatchAuthenticityProps> = ({
  batch,
  verificationHistory,
  onVerify,
  loading,
}) => {
  const dispatch = useAppDispatch();
  const { 
    securityFeatures, 
    realTimeStatus 
  } = useAppSelector((state) => state.counterfeit);
  
  const [verificationStep, setVerificationStep] = useState(0);
  const [verificationResults, setVerificationResults] = useState<VerificationResult[]>([]);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const [blockchainValidation, setBlockchainValidation] = useState<any>(null);
  const [verificationDialogOpen, setVerificationDialogOpen] = useState(false);
  const [qrScanDialogOpen, setQrScanDialogOpen] = useState(false);
  const [qrCode, setQrCode] = useState('');

  useEffect(() => {
    if (batch) {
      dispatch(fetchBatchSecurityFeatures(batch.id));
      dispatch(fetchVerificationHistory(batch.id));
    }
  }, [dispatch, batch]);

  const verificationSteps = [
    'QR Code Scan',
    'Hologram Check',
    'Serial Number Validation',
    'Tamper Evidence',
    'Blockchain Verification',
    'Final Assessment',
  ];

  const handleVerification = async (verificationType: VerificationResult['verificationType']) => {
    if (!batch) return;

    setIsVerifying(true);
    setVerificationError(null);

    try {
      const result = await dispatch(verifyBatch({
        batchId: batch.id,
        verificationType,
      })).unwrap();
      
      setVerificationResults(prev => [...prev, result]);
      setVerificationStep(prev => prev + 1);
    } catch (error) {
      setVerificationError('Verification failed');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleQRCodeScan = async () => {
    if (!qrCode.trim()) {
      setVerificationError('Please enter a QR code');
      return;
    }

    setIsVerifying(true);
    setVerificationError(null);

    try {
      const result = await dispatch(scanQRCode(qrCode)).unwrap();
      setVerificationResults(prev => [...prev, result.verificationResult]);
      setVerificationStep(1);
      setQrScanDialogOpen(false);
    } catch (error) {
      setVerificationError('QR code scan failed');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleBlockchainVerification = async () => {
    if (!batch) return;

    setIsVerifying(true);
    setVerificationError(null);

    try {
      const result = await blockchainValidator.validateBatchAuthenticity(batch);
      setBlockchainValidation(result);
      setVerificationStep(prev => prev + 1);
    } catch (error) {
      setVerificationError('Blockchain verification failed');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleCompleteVerification = () => {
    onVerify();
    setVerificationDialogOpen(false);
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

  const getSecurityFeatureIcon = (type: SecurityFeature['type']) => {
    switch (type) {
      case 'qr_code': return <QrCode />;
      case 'hologram': return <Security />;
      case 'serial_number': return <Assignment />;
      case 'tamper_evident': return <Block />;
      default: return <Info />;
    }
  };

  const getSecurityFeatureColor = (verified: boolean) => {
    return verified ? 'success' : 'error';
  };

  const getOverallAuthenticity = () => {
    if (verificationResults.length === 0) return { score: 0, status: 'unknown' };
    
    const authenticCount = verificationResults.filter(r => r.result === 'authentic').length;
    const totalCount = verificationResults.length;
    const score = totalCount > 0 ? (authenticCount / totalCount) * 100 : 0;
    
    let status = 'unknown';
    if (score >= 80) status = 'authentic';
    else if (score >= 50) status = 'suspicious';
    else status = 'counterfeit';
    
    return { score, status };
  };

  const getAuthenticityColor = (status: string) => {
    switch (status) {
      case 'authentic': return 'success';
      case 'suspicious': return 'warning';
      case 'counterfeit': return 'error';
      default: return 'default';
    }
  };

  const getAuthenticityIcon = (status: string) => {
    switch (status) {
      case 'authentic': return <CheckCircle />;
      case 'suspicious': return <Warning />;
      case 'counterfeit': return <Error />;
      default: return <Info />;
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress size={60} />
      </Box>
    );
  }

  if (!batch) {
    return (
      <Alert severity="error">
        No batch data available
      </Alert>
    );
  }

  const authenticity = getOverallAuthenticity();

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Batch Authenticity Verification
      </Typography>

      {verificationError && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {verificationError}
        </Alert>
      )}

      {/* Batch Information */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <Typography variant="h6" gutterBottom>
                {batch.productName}
              </Typography>
              <Typography variant="body2" color="textSecondary" paragraph>
                Batch Number: {batch.batchNumber}
              </Typography>
              <Typography variant="body2" color="textSecondary" paragraph>
                Location: {batch.location}
              </Typography>
              <Typography variant="body2" color="textSecondary" paragraph>
                Quantity: {batch.quantity.toLocaleString()} units
              </Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <Box textAlign="center">
                <Avatar
                  sx={{
                    bgcolor: getAuthenticityColor(authenticity.status),
                    width: 80,
                    height: 80,
                    mx: 'auto',
                    mb: 2,
                  }}
                >
                  {getAuthenticityIcon(authenticity.status)}
                </Avatar>
                <Typography variant="h4" fontWeight="bold" color={getAuthenticityColor(authenticity.status)}>
                  {authenticity.score.toFixed(0)}%
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Authenticity Score
                </Typography>
                <Chip
                  icon={getAuthenticityIcon(authenticity.status)}
                  label={authenticity.status.toUpperCase()}
                  color={getAuthenticityColor(authenticity.status) as any}
                  sx={{ mt: 1 }}
                />
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Security Features */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Security Features
          </Typography>
          <Grid container spacing={2}>
            {securityFeatures.map((feature, index) => (
              <Grid item xs={12} sm={6} md={3} key={index}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Paper sx={{ p: 2, textAlign: 'center' }}>
                    <Avatar
                      sx={{
                        bgcolor: getSecurityFeatureColor(feature.verified),
                        width: 60,
                        height: 60,
                        mx: 'auto',
                        mb: 1,
                      }}
                    >
                      {getSecurityFeatureIcon(feature.type)}
                    </Avatar>
                    <Typography variant="subtitle2" gutterBottom>
                      {feature.type.replace('_', ' ').toUpperCase()}
                    </Typography>
                    <Chip
                      label={feature.verified ? 'VERIFIED' : 'NOT VERIFIED'}
                      color={getSecurityFeatureColor(feature.verified) as any}
                      size="small"
                    />
                    {feature.verificationDate && (
                      <Typography variant="caption" color="textSecondary" display="block" sx={{ mt: 1 }}>
                        {format(new Date(feature.verificationDate), 'MMM dd, yyyy')}
                      </Typography>
                    )}
                  </Paper>
                </motion.div>
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>

      {/* Verification Actions */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Verification Actions
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <Button
                fullWidth
                variant="contained"
                startIcon={<QrCodeScanner />}
                onClick={() => setQrScanDialogOpen(true)}
                disabled={isVerifying}
              >
                Scan QR Code
              </Button>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Button
                fullWidth
                variant="contained"
                startIcon={<Security />}
                onClick={() => handleVerification('hologram_check')}
                disabled={isVerifying}
              >
                Check Hologram
              </Button>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Button
                fullWidth
                variant="contained"
                startIcon={<Assignment />}
                onClick={() => handleVerification('serial_validation')}
                disabled={isVerifying}
              >
                Validate Serial
              </Button>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Button
                fullWidth
                variant="contained"
                startIcon={<VerifiedUser />}
                onClick={handleBlockchainVerification}
                disabled={isVerifying}
              >
                Blockchain Verify
              </Button>
            </Grid>
          </Grid>
          <Box mt={2}>
            <Button
              variant="outlined"
              startIcon={<History />}
              onClick={() => setVerificationDialogOpen(true)}
            >
              View Verification History
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Real-time Status */}
      {realTimeStatus && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Real-time Status
            </Typography>
            <Box display="flex" alignItems="center" gap={2}>
              <Chip
                icon={realTimeStatus.verificationInProgress ? <Schedule /> : <CheckCircle />}
                label={realTimeStatus.verificationInProgress ? 'VERIFYING' : 'IDLE'}
                color={realTimeStatus.verificationInProgress ? 'warning' : 'success'}
              />
              {realTimeStatus.lastVerification && (
                <Typography variant="body2" color="textSecondary">
                  Last verification: {format(new Date(realTimeStatus.lastVerification.timestamp), 'MMM dd, yyyy HH:mm')}
                </Typography>
              )}
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Blockchain Validation Results */}
      {blockchainValidation && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Blockchain Validation Results
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Typography variant="body2" color="textSecondary">
                  Validation Status
                </Typography>
                <Chip
                  icon={getVerificationIcon(blockchainValidation.isValid ? 'authentic' : 'counterfeit')}
                  label={blockchainValidation.isValid ? 'VALID' : 'INVALID'}
                  color={getVerificationColor(blockchainValidation.isValid ? 'authentic' : 'counterfeit') as any}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="body2" color="textSecondary">
                  Confidence Level
                </Typography>
                <Typography variant="h6" color="primary">
                  {blockchainValidation.confidence}%
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="body2" color="textSecondary">
                  Details
                </Typography>
                <Typography variant="body1">
                  {blockchainValidation.details}
                </Typography>
              </Grid>
              {blockchainValidation.blockchainHash && (
                <Grid item xs={12}>
                  <Typography variant="body2" color="textSecondary">
                    Blockchain Hash
                  </Typography>
                  <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                    {blockchainValidation.blockchainHash}
                  </Typography>
                </Grid>
              )}
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* QR Code Scan Dialog */}
      <Dialog
        open={qrScanDialogOpen}
        onClose={() => setQrScanDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Scan QR Code
        </DialogTitle>
        <DialogContent>
          <Box py={2}>
            <TextField
              fullWidth
              label="QR Code Data"
              value={qrCode}
              onChange={(e) => setQrCode(e.target.value)}
              placeholder="Enter QR code data or scan with camera"
              InputProps={{
                endAdornment: (
                  <IconButton>
                    <CameraAlt />
                  </IconButton>
                ),
              }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setQrScanDialogOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleQRCodeScan}
            disabled={isVerifying || !qrCode.trim()}
            startIcon={isVerifying ? <CircularProgress size={20} /> : <QrCode />}
          >
            {isVerifying ? 'Scanning...' : 'Scan QR Code'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Verification History Dialog */}
      <Dialog
        open={verificationDialogOpen}
        onClose={() => setVerificationDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Verification History
        </DialogTitle>
        <DialogContent>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Type</TableCell>
                  <TableCell>Result</TableCell>
                  <TableCell>Confidence</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Verified By</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {verificationHistory.map((verification, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <Chip
                        label={verification.verificationType.replace('_', ' ').toUpperCase()}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        icon={getVerificationIcon(verification.result)}
                        label={verification.result.toUpperCase()}
                        color={getVerificationColor(verification.result) as any}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1}>
                        <LinearProgress
                          variant="determinate"
                          value={verification.confidence}
                          color={getVerificationColor(verification.result) as any}
                          sx={{ width: 60, height: 6 }}
                        />
                        <Typography variant="body2">
                          {verification.confidence}%
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      {format(new Date(verification.timestamp), 'MMM dd, yyyy HH:mm')}
                    </TableCell>
                    <TableCell>
                      {verification.verifiedBy}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setVerificationDialogOpen(false)}>
            Close
          </Button>
          <Button
            variant="contained"
            onClick={handleCompleteVerification}
          >
            Complete Verification
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default BatchAuthenticity;