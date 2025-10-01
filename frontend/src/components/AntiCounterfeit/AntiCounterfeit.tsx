import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Alert,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Divider,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Tabs,
  Tab,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Stepper,
  Step,
  StepLabel,
  StepContent,
} from '@mui/material';
import {
  QrCode as QrCodeIcon,
  Security as SecurityIcon,
  Report as ReportIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Warning as WarningIcon,
  ExpandMore as ExpandMoreIcon,
  Refresh as RefreshIcon,
  Visibility as VisibilityIcon,
  Add as AddIcon,
  CameraAlt as CameraIcon,
} from '@mui/icons-material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import QRCode from 'qrcode';
import { counterfeitApi } from '../../services/api';
import { SecurityFeature, VerificationRecord, CounterfeitReport, FlaggedBatch } from '../../types';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`counterfeit-tabpanel-${index}`}
      aria-labelledby={`counterfeit-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const AntiCounterfeit: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Verification state
  const [verificationDialogOpen, setVerificationDialogOpen] = useState(false);
  const [verificationForm, setVerificationForm] = useState({
    batchId: '',
    verificationType: 'QR_SCAN' as 'QR_SCAN' | 'HOLOGRAM_CHECK' | 'SERIAL_VERIFICATION',
    providedData: '',
  });
  const [verificationResult, setVerificationResult] = useState<{
    isValid: boolean;
    verifiedAt: string;
  } | null>(null);
  const [verificationHistory, setVerificationHistory] = useState<VerificationRecord[]>([]);
  
  // Report state
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [reportForm, setReportForm] = useState({
    batchId: '',
    reporterName: '',
    reporterEmail: '',
    reportType: 'SUSPICIOUS_PACKAGING' as 'SUSPICIOUS_PACKAGING' | 'INVALID_QR' | 'MISSING_HOLOGRAM' | 'OTHER',
    description: '',
    evidenceUrls: [] as string[],
    location: '',
  });
  const [evidenceUrl, setEvidenceUrl] = useState('');
  
  // Security features state
  const [securityFeatureDialogOpen, setSecurityFeatureDialogOpen] = useState(false);
  const [securityFeatureForm, setSecurityFeatureForm] = useState({
    batchId: '',
    qrCodeHash: '',
    hologramId: '',
    serialNumber: '',
    securityPattern: '',
  });
  const [generatedQrCode, setGeneratedQrCode] = useState<string>('');
  
  // Data state
  const [flaggedBatches, setFlaggedBatches] = useState<FlaggedBatch[]>([]);
  const [reports, setReports] = useState<CounterfeitReport[]>([]);
  const [securityFeatures, setSecurityFeatures] = useState<SecurityFeature[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [flaggedResponse, reportsResponse] = await Promise.all([
        counterfeitApi.getFlaggedBatches(),
        counterfeitApi.getAllReports(),
      ]);

      if (flaggedResponse.success) {
        setFlaggedBatches(flaggedResponse.data || []);
      }
      if (reportsResponse.success) {
        setReports(reportsResponse.data || []);
      }
    } catch (err) {
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyAuthenticity = async () => {
    try {
      setLoading(true);
      const response = await counterfeitApi.verifyAuthenticity({
        batchId: verificationForm.batchId,
        verificationType: verificationForm.verificationType,
        providedData: verificationForm.providedData,
        verifiedBy: 'Current User', // In production, get from auth context
        ipAddress: '127.0.0.1', // In production, get actual IP
        userAgent: navigator.userAgent,
      });

      if (response.success) {
        setVerificationResult(response.data);
        loadVerificationHistory(verificationForm.batchId);
        setSuccess(`Verification ${response.data.isValid ? 'successful' : 'failed'}`);
      } else {
        setError(response.error || 'Verification failed');
      }
    } catch (err) {
      setError('Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const loadVerificationHistory = async (batchId: string) => {
    try {
      const response = await counterfeitApi.getVerificationHistory(batchId);
      if (response.success) {
        setVerificationHistory(response.data || []);
      }
    } catch (err) {
      console.error('Failed to load verification history:', err);
    }
  };

  const handleReportSuspiciousActivity = async () => {
    try {
      setLoading(true);
      const response = await counterfeitApi.reportSuspiciousActivity(reportForm);

      if (response.success) {
        setSuccess('Report submitted successfully');
        setReportDialogOpen(false);
        resetReportForm();
        loadData();
      } else {
        setError(response.error || 'Failed to submit report');
      }
    } catch (err) {
      setError('Failed to submit report');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateSecurityFeatures = async () => {
    try {
      setLoading(true);
      
      // Generate QR code
      const qrCodeData = JSON.stringify({
        batchId: securityFeatureForm.batchId,
        timestamp: Date.now(),
        manufacturer: 'PharmaCorp',
      });
      const qrCodeHash = await QRCode.toDataURL(qrCodeData);
      setGeneratedQrCode(qrCodeHash);

      const response = await counterfeitApi.generateSecurityFeatures({
        ...securityFeatureForm,
        qrCodeHash: btoa(qrCodeData), // Simple encoding for demo
      });

      if (response.success) {
        setSuccess('Security features generated successfully');
        setSecurityFeatureDialogOpen(false);
        resetSecurityFeatureForm();
      } else {
        setError(response.error || 'Failed to generate security features');
      }
    } catch (err) {
      setError('Failed to generate security features');
    } finally {
      setLoading(false);
    }
  };

  const resetReportForm = () => {
    setReportForm({
      batchId: '',
      reporterName: '',
      reporterEmail: '',
      reportType: 'SUSPICIOUS_PACKAGING',
      description: '',
      evidenceUrls: [],
      location: '',
    });
    setEvidenceUrl('');
  };

  const resetSecurityFeatureForm = () => {
    setSecurityFeatureForm({
      batchId: '',
      qrCodeHash: '',
      hologramId: '',
      serialNumber: '',
      securityPattern: '',
    });
    setGeneratedQrCode('');
  };

  const addEvidenceUrl = () => {
    if (evidenceUrl.trim()) {
      setReportForm(prev => ({
        ...prev,
        evidenceUrls: [...prev.evidenceUrls, evidenceUrl.trim()]
      }));
      setEvidenceUrl('');
    }
  };

  const removeEvidenceUrl = (index: number) => {
    setReportForm(prev => ({
      ...prev,
      evidenceUrls: prev.evidenceUrls.filter((_, i) => i !== index)
    }));
  };

  const getReportTypeColor = (type: string) => {
    switch (type) {
      case 'SUSPICIOUS_PACKAGING': return 'warning';
      case 'INVALID_QR': return 'error';
      case 'MISSING_HOLOGRAM': return 'error';
      case 'OTHER': return 'default';
      default: return 'default';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'warning';
      case 'INVESTIGATING': return 'info';
      case 'CONFIRMED': return 'error';
      case 'FALSE_ALARM': return 'success';
      default: return 'default';
    }
  };

  const verificationColumns: GridColDef[] = [
    { field: 'verificationType', headerName: 'Type', width: 150 },
    { field: 'result', headerName: 'Result', width: 100, renderCell: (params) => (
      <Chip 
        label={params.value ? 'Valid' : 'Invalid'} 
        color={params.value ? 'success' : 'error'} 
        size="small" 
      />
    )},
    { field: 'verifiedBy', headerName: 'Verified By', width: 150 },
    { field: 'verifiedAt', headerName: 'Verified At', width: 180, renderCell: (params) => (
      new Date(params.value).toLocaleString()
    )},
    { field: 'ipAddress', headerName: 'IP Address', width: 120 },
  ];

  const reportColumns: GridColDef[] = [
    { field: 'batchId', headerName: 'Batch ID', width: 150 },
    { field: 'reporterName', headerName: 'Reporter', width: 150 },
    { field: 'reportType', headerName: 'Type', width: 150, renderCell: (params) => (
      <Chip label={params.value} color={getReportTypeColor(params.value) as any} size="small" />
    )},
    { field: 'description', headerName: 'Description', width: 300 },
    { field: 'status', headerName: 'Status', width: 120, renderCell: (params) => (
      <Chip label={params.value} color={getStatusColor(params.value) as any} size="small" />
    )},
    { field: 'reportedAt', headerName: 'Reported At', width: 180, renderCell: (params) => (
      new Date(params.value).toLocaleString()
    )},
  ];

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Anti-Counterfeiting System
      </Typography>

      <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)} sx={{ mb: 3 }}>
        <Tab label="Verification" />
        <Tab label="Reports" />
        <Tab label="Security Features" />
        <Tab label="Flagged Batches" />
      </Tabs>

      {/* Verification Tab */}
      <TabPanel value={activeTab} index={0}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Verify Authenticity
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Batch ID"
                      value={verificationForm.batchId}
                      onChange={(e) => setVerificationForm(prev => ({ ...prev, batchId: e.target.value }))}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <FormControl fullWidth>
                      <InputLabel>Verification Type</InputLabel>
                      <Select
                        value={verificationForm.verificationType}
                        onChange={(e) => setVerificationForm(prev => ({ ...prev, verificationType: e.target.value as any }))}
                      >
                        <MenuItem value="QR_SCAN">QR Code Scan</MenuItem>
                        <MenuItem value="HOLOGRAM_CHECK">Hologram Check</MenuItem>
                        <MenuItem value="SERIAL_VERIFICATION">Serial Number Verification</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Provided Data"
                      value={verificationForm.providedData}
                      onChange={(e) => setVerificationForm(prev => ({ ...prev, providedData: e.target.value }))}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Button
                      variant="contained"
                      fullWidth
                      onClick={handleVerifyAuthenticity}
                      disabled={loading || !verificationForm.batchId || !verificationForm.providedData}
                      startIcon={loading ? <CircularProgress size={20} /> : <QrCodeIcon />}
                    >
                      Verify Authenticity
                    </Button>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Verification Result
                </Typography>
                {verificationResult ? (
                  <Box sx={{ textAlign: 'center', py: 2 }}>
                    {verificationResult.isValid ? (
                      <CheckCircleIcon color="success" sx={{ fontSize: 60 }} />
                    ) : (
                      <CancelIcon color="error" sx={{ fontSize: 60 }} />
                    )}
                    <Typography variant="h6" color={verificationResult.isValid ? 'success.main' : 'error.main'}>
                      {verificationResult.isValid ? 'Valid' : 'Invalid'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Verified at: {new Date(verificationResult.verifiedAt).toLocaleString()}
                    </Typography>
                  </Box>
                ) : (
                  <Typography color="text.secondary">
                    No verification performed yet
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Verification History
                </Typography>
                <Box sx={{ height: 300, width: '100%' }}>
                  <DataGrid
                    rows={verificationHistory}
                    columns={verificationColumns}
                    initialState={{
                      pagination: {
                        paginationModel: { pageSize: 5 },
                      },
                    }}
                    pageSizeOptions={[5, 10, 25]}
                    disableRowSelectionOnClick
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      {/* Reports Tab */}
      <TabPanel value={activeTab} index={1}>
        <Box sx={{ mb: 3 }}>
          <Button
            variant="contained"
            startIcon={<ReportIcon />}
            onClick={() => setReportDialogOpen(true)}
          >
            Report Suspicious Activity
          </Button>
        </Box>

        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Counterfeit Reports
            </Typography>
            <Box sx={{ height: 400, width: '100%' }}>
              <DataGrid
                rows={reports}
                columns={reportColumns}
                loading={loading}
                initialState={{
                  pagination: {
                    paginationModel: { pageSize: 10 },
                  },
                }}
                pageSizeOptions={[10, 25, 50]}
                disableRowSelectionOnClick
              />
            </Box>
          </CardContent>
        </Card>
      </TabPanel>

      {/* Security Features Tab */}
      <TabPanel value={activeTab} index={2}>
        <Box sx={{ mb: 3 }}>
          <Button
            variant="contained"
            startIcon={<SecurityIcon />}
            onClick={() => setSecurityFeatureDialogOpen(true)}
          >
            Generate Security Features
          </Button>
        </Box>

        {generatedQrCode && (
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Generated QR Code
              </Typography>
              <Box sx={{ textAlign: 'center' }}>
                <img src={generatedQrCode} alt="Generated QR Code" style={{ maxWidth: '200px' }} />
              </Box>
            </CardContent>
          </Card>
        )}
      </TabPanel>

      {/* Flagged Batches Tab */}
      <TabPanel value={activeTab} index={3}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Flagged Batches
            </Typography>
            {flaggedBatches.length === 0 ? (
              <Typography color="text.secondary">
                No flagged batches found
              </Typography>
            ) : (
              <List>
                {flaggedBatches.map((batch, index) => (
                  <Accordion key={index}>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Typography variant="h6">{batch.batchId}</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Grid container spacing={2}>
                        <Grid item xs={12} md={6}>
                          <Typography variant="subtitle1" gutterBottom>
                            Security Features
                          </Typography>
                          {batch.securityFeature ? (
                            <Paper sx={{ p: 2 }}>
                              <Typography variant="body2">
                                <strong>QR Hash:</strong> {batch.securityFeature.qrCodeHash}
                              </Typography>
                              <Typography variant="body2">
                                <strong>Hologram ID:</strong> {batch.securityFeature.hologramId}
                              </Typography>
                              <Typography variant="body2">
                                <strong>Serial Number:</strong> {batch.securityFeature.serialNumber}
                              </Typography>
                            </Paper>
                          ) : (
                            <Typography color="text.secondary">No security features found</Typography>
                          )}
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <Typography variant="subtitle1" gutterBottom>
                            Recent Verifications
                          </Typography>
                          {batch.recentVerifications.length > 0 ? (
                            <List dense>
                              {batch.recentVerifications.map((verification, idx) => (
                                <ListItem key={idx}>
                                  <ListItemText
                                    primary={verification.verificationType}
                                    secondary={`${verification.result ? 'Valid' : 'Invalid'} - ${new Date(verification.timestamp).toLocaleString()}`}
                                  />
                                </ListItem>
                              ))}
                            </List>
                          ) : (
                            <Typography color="text.secondary">No verifications found</Typography>
                          )}
                        </Grid>
                      </Grid>
                    </AccordionDetails>
                  </Accordion>
                ))}
              </List>
            )}
          </CardContent>
        </Card>
      </TabPanel>

      {/* Report Dialog */}
      <Dialog
        open={reportDialogOpen}
        onClose={() => setReportDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Report Suspicious Activity</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Batch ID"
                value={reportForm.batchId}
                onChange={(e) => setReportForm(prev => ({ ...prev, batchId: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Report Type</InputLabel>
                <Select
                  value={reportForm.reportType}
                  onChange={(e) => setReportForm(prev => ({ ...prev, reportType: e.target.value as any }))}
                >
                  <MenuItem value="SUSPICIOUS_PACKAGING">Suspicious Packaging</MenuItem>
                  <MenuItem value="INVALID_QR">Invalid QR Code</MenuItem>
                  <MenuItem value="MISSING_HOLOGRAM">Missing Hologram</MenuItem>
                  <MenuItem value="OTHER">Other</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Reporter Name"
                value={reportForm.reporterName}
                onChange={(e) => setReportForm(prev => ({ ...prev, reporterName: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Reporter Email"
                type="email"
                value={reportForm.reporterEmail}
                onChange={(e) => setReportForm(prev => ({ ...prev, reporterEmail: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                multiline
                rows={3}
                value={reportForm.description}
                onChange={(e) => setReportForm(prev => ({ ...prev, description: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Location (Optional)"
                value={reportForm.location}
                onChange={(e) => setReportForm(prev => ({ ...prev, location: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom>
                Evidence URLs
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                <TextField
                  fullWidth
                  label="Evidence URL"
                  value={evidenceUrl}
                  onChange={(e) => setEvidenceUrl(e.target.value)}
                />
                <Button variant="outlined" onClick={addEvidenceUrl}>
                  Add
                </Button>
              </Box>
              {reportForm.evidenceUrls.map((url, index) => (
                <Chip
                  key={index}
                  label={url}
                  onDelete={() => removeEvidenceUrl(index)}
                  sx={{ mr: 1, mb: 1 }}
                />
              ))}
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReportDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleReportSuspiciousActivity}
            disabled={loading || !reportForm.batchId || !reportForm.reporterName || !reportForm.reporterEmail || !reportForm.description}
          >
            {loading ? <CircularProgress size={20} /> : 'Submit Report'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Security Feature Dialog */}
      <Dialog
        open={securityFeatureDialogOpen}
        onClose={() => setSecurityFeatureDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Generate Security Features</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Batch ID"
                value={securityFeatureForm.batchId}
                onChange={(e) => setSecurityFeatureForm(prev => ({ ...prev, batchId: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Hologram ID"
                value={securityFeatureForm.hologramId}
                onChange={(e) => setSecurityFeatureForm(prev => ({ ...prev, hologramId: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Serial Number"
                value={securityFeatureForm.serialNumber}
                onChange={(e) => setSecurityFeatureForm(prev => ({ ...prev, serialNumber: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Security Pattern"
                multiline
                rows={3}
                value={securityFeatureForm.securityPattern}
                onChange={(e) => setSecurityFeatureForm(prev => ({ ...prev, securityPattern: e.target.value }))}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSecurityFeatureDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleGenerateSecurityFeatures}
            disabled={loading || !securityFeatureForm.batchId || !securityFeatureForm.hologramId || !securityFeatureForm.serialNumber}
          >
            {loading ? <CircularProgress size={20} /> : 'Generate Features'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Notifications */}
      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError(null)}
      >
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      </Snackbar>

      <Snackbar
        open={!!success}
        autoHideDuration={6000}
        onClose={() => setSuccess(null)}
      >
        <Alert severity="success" onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default AntiCounterfeit;