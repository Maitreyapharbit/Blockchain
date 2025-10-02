import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Tabs,
  Tab,
  Alert,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stepper,
  Step,
  StepLabel,
  Paper,
  Divider,
  CircularProgress,
  Snackbar
} from '@mui/material';
import {
  Warning as WarningIcon,
  Security as SecurityIcon,
  QrCode as QrCodeIcon,
  Report as ReportIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Add as AddIcon,
  Refresh as RefreshIcon,
  Visibility as VisibilityIcon
} from '@mui/icons-material';
import { recallApi, counterfeitApi } from '../services/api';

const RecallAndAntiCounterfeitDemo = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  // Recall Management State
  const [recalls, setRecalls] = useState([]);
  const [recallDialogOpen, setRecallDialogOpen] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [recallForm, setRecallForm] = useState({
    batchIds: [],
    severity: 'LOW',
    reason: '',
    initiatedBy: ''
  });
  const [selectedBatches, setSelectedBatches] = useState([]);
  const [batchForm, setBatchForm] = useState({
    batchId: '',
    productName: '',
    lotNumber: '',
    expiryDate: '',
    quantity: 0
  });

  // Anti-Counterfeit State
  const [verificationDialogOpen, setVerificationDialogOpen] = useState(false);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [verificationForm, setVerificationForm] = useState({
    batchId: '',
    verificationType: 'QR_SCAN',
    providedData: ''
  });
  const [reportForm, setReportForm] = useState({
    batchId: '',
    reporterName: '',
    reporterEmail: '',
    reportType: 'SUSPICIOUS_PACKAGING',
    description: '',
    evidenceUrls: [],
    location: ''
  });
  const [verificationResult, setVerificationResult] = useState(null);
  const [flaggedBatches, setFlaggedBatches] = useState([]);
  const [reports, setReports] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [recallsResponse, flaggedResponse, reportsResponse] = await Promise.all([
        recallApi.getAllRecalls(),
        counterfeitApi.getFlaggedBatches(),
        counterfeitApi.getAllReports()
      ]);

      if (recallsResponse.success) {
        setRecalls(recallsResponse.data || []);
      }
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

  // Recall Management Functions
  const handleInitiateRecall = async () => {
    try {
      setLoading(true);
      const response = await recallApi.initiateRecall(recallForm);
      
      if (response.success) {
        setSuccess('Recall initiated successfully');
        setRecallDialogOpen(false);
        resetRecallForm();
        loadData();
      } else {
        setError(response.error || 'Failed to initiate recall');
      }
    } catch (err) {
      setError('Failed to initiate recall');
    } finally {
      setLoading(false);
    }
  };

  const handleAddBatch = () => {
    if (batchForm.batchId && batchForm.productName && batchForm.lotNumber && batchForm.expiryDate && batchForm.quantity > 0) {
      const newBatch = {
        id: `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        batchId: batchForm.batchId,
        productName: batchForm.productName,
        lotNumber: batchForm.lotNumber,
        expiryDate: batchForm.expiryDate,
        quantityAffected: batchForm.quantity
      };
      
      setSelectedBatches([...selectedBatches, newBatch]);
      setRecallForm(prev => ({
        ...prev,
        batchIds: [...prev.batchIds, batchForm.batchId]
      }));
      
      setBatchForm({
        batchId: '',
        productName: '',
        lotNumber: '',
        expiryDate: '',
        quantity: 0
      });
    }
  };

  const handleRemoveBatch = (batchId) => {
    setSelectedBatches(selectedBatches.filter(b => b.batchId !== batchId));
    setRecallForm(prev => ({
      ...prev,
      batchIds: prev.batchIds.filter(id => id !== batchId)
    }));
  };

  const resetRecallForm = () => {
    setRecallForm({
      batchIds: [],
      severity: 'LOW',
      reason: '',
      initiatedBy: ''
    });
    setSelectedBatches([]);
    setActiveStep(0);
  };

  // Anti-Counterfeit Functions
  const handleVerifyAuthenticity = async () => {
    try {
      setLoading(true);
      const response = await counterfeitApi.verifyAuthenticity({
        ...verificationForm,
        verifiedBy: 'Demo User',
        ipAddress: '127.0.0.1',
        userAgent: navigator.userAgent
      });
      
      if (response.success) {
        setVerificationResult(response.data);
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

  const resetReportForm = () => {
    setReportForm({
      batchId: '',
      reporterName: '',
      reporterEmail: '',
      reportType: 'SUSPICIOUS_PACKAGING',
      description: '',
      evidenceUrls: [],
      location: ''
    });
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'LOW': return 'success';
      case 'MEDIUM': return 'warning';
      case 'HIGH': return 'error';
      case 'CRITICAL': return 'error';
      default: return 'default';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'ACTIVE': return 'error';
      case 'RESOLVED': return 'success';
      case 'CANCELLED': return 'default';
      case 'PENDING': return 'warning';
      case 'INVESTIGATING': return 'info';
      case 'CONFIRMED': return 'error';
      case 'FALSE_ALARM': return 'success';
      default: return 'default';
    }
  };

  const steps = [
    'Select Batches',
    'Set Severity & Reason',
    'Review & Confirm'
  ];

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Recall Management & Anti-Counterfeiting Demo
      </Typography>

      <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)} sx={{ mb: 3 }}>
        <Tab label="Recall Management" />
        <Tab label="Anti-Counterfeiting" />
        <Tab label="Dashboard" />
      </Tabs>

      {/* Recall Management Tab */}
      {activeTab === 0 && (
        <Box>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Active Recalls</Typography>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => setRecallDialogOpen(true)}
                >
                  Initiate Recall
                </Button>
              </Box>

              {recalls.length === 0 ? (
                <Alert severity="info">No recalls found. Click "Initiate Recall" to create one.</Alert>
              ) : (
                <List>
                  {recalls.map((recall, index) => (
                    <ListItem key={index}>
                      <ListItemText
                        primary={`${recall.recallId} - ${recall.reason}`}
                        secondary={`Severity: ${recall.severity} | Status: ${recall.status} | Batches: ${recall.batchCount || 0}`}
                      />
                      <ListItemSecondaryAction>
                        <Chip 
                          label={recall.severity} 
                          color={getSeverityColor(recall.severity)} 
                          size="small" 
                          sx={{ mr: 1 }}
                        />
                        <Chip 
                          label={recall.status} 
                          color={getStatusColor(recall.status)} 
                          size="small" 
                        />
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Box>
      )}

      {/* Anti-Counterfeiting Tab */}
      {activeTab === 1 && (
        <Box>
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
                          onChange={(e) => setVerificationForm(prev => ({ ...prev, verificationType: e.target.value }))}
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
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6">Flagged Batches</Typography>
                    <Button
                      variant="outlined"
                      startIcon={<ReportIcon />}
                      onClick={() => setReportDialogOpen(true)}
                    >
                      Report Suspicious Activity
                    </Button>
                  </Box>
                  
                  {flaggedBatches.length === 0 ? (
                    <Alert severity="info">No flagged batches found.</Alert>
                  ) : (
                    <List>
                      {flaggedBatches.map((batch, index) => (
                        <ListItem key={index}>
                          <ListItemText
                            primary={`${batch.batchId} - ${batch.reason}`}
                            secondary={`Flagged: ${new Date(batch.flaggedAt).toLocaleString()}`}
                          />
                          <ListItemSecondaryAction>
                            <Chip label="FLAGGED" color="error" size="small" />
                          </ListItemSecondaryAction>
                        </ListItem>
                      ))}
                    </List>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>
      )}

      {/* Dashboard Tab */}
      {activeTab === 2 && (
        <Box>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Recall Statistics
                  </Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Typography>Total Recalls:</Typography>
                    <Typography variant="h6">{recalls.length}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Typography>Active Recalls:</Typography>
                    <Typography variant="h6" color="error">
                      {recalls.filter(r => r.status === 'ACTIVE').length}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography>Resolved Recalls:</Typography>
                    <Typography variant="h6" color="success.main">
                      {recalls.filter(r => r.status === 'RESOLVED').length}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Anti-Counterfeit Statistics
                  </Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Typography>Flagged Batches:</Typography>
                    <Typography variant="h6" color="error">
                      {flaggedBatches.length}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Typography>Total Reports:</Typography>
                    <Typography variant="h6">{reports.length}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography>Pending Reports:</Typography>
                    <Typography variant="h6" color="warning.main">
                      {reports.filter(r => r.status === 'PENDING').length}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>
      )}

      {/* Recall Initiation Dialog */}
      <Dialog
        open={recallDialogOpen}
        onClose={() => setRecallDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Initiate New Recall</DialogTitle>
        <DialogContent>
          <Stepper activeStep={activeStep} sx={{ mb: 3 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          {activeStep === 0 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Select Batches to Recall
              </Typography>
              
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Batch ID"
                    value={batchForm.batchId}
                    onChange={(e) => setBatchForm(prev => ({ ...prev, batchId: e.target.value }))}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Product Name"
                    value={batchForm.productName}
                    onChange={(e) => setBatchForm(prev => ({ ...prev, productName: e.target.value }))}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Lot Number"
                    value={batchForm.lotNumber}
                    onChange={(e) => setBatchForm(prev => ({ ...prev, lotNumber: e.target.value }))}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Expiry Date"
                    type="date"
                    value={batchForm.expiryDate}
                    onChange={(e) => setBatchForm(prev => ({ ...prev, expiryDate: e.target.value }))}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Quantity Affected"
                    type="number"
                    value={batchForm.quantity}
                    onChange={(e) => setBatchForm(prev => ({ ...prev, quantity: parseInt(e.target.value) || 0 }))}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Button
                    variant="outlined"
                    startIcon={<AddIcon />}
                    onClick={handleAddBatch}
                    disabled={!batchForm.batchId || !batchForm.productName || !batchForm.lotNumber || !batchForm.expiryDate || batchForm.quantity <= 0}
                  >
                    Add Batch
                  </Button>
                </Grid>
              </Grid>

              {selectedBatches.length > 0 && (
                <Paper sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    Selected Batches ({selectedBatches.length})
                  </Typography>
                  <List>
                    {selectedBatches.map((batch) => (
                      <ListItem key={batch.batchId}>
                        <ListItemText
                          primary={`${batch.batchId} - ${batch.productName}`}
                          secondary={`Lot: ${batch.lotNumber} | Qty: ${batch.quantityAffected} | Expiry: ${batch.expiryDate}`}
                        />
                        <ListItemSecondaryAction>
                          <IconButton
                            edge="end"
                            onClick={() => handleRemoveBatch(batch.batchId)}
                          >
                            <CancelIcon />
                          </IconButton>
                        </ListItemSecondaryAction>
                      </ListItem>
                    ))}
                  </List>
                </Paper>
              )}
            </Box>
          )}

          {activeStep === 1 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Set Recall Details
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Severity Level</InputLabel>
                    <Select
                      value={recallForm.severity}
                      onChange={(e) => setRecallForm(prev => ({ ...prev, severity: e.target.value }))}
                    >
                      <MenuItem value="LOW">Low</MenuItem>
                      <MenuItem value="MEDIUM">Medium</MenuItem>
                      <MenuItem value="HIGH">High</MenuItem>
                      <MenuItem value="CRITICAL">Critical</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Initiated By"
                    value={recallForm.initiatedBy}
                    onChange={(e) => setRecallForm(prev => ({ ...prev, initiatedBy: e.target.value }))}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Reason for Recall"
                    multiline
                    rows={4}
                    value={recallForm.reason}
                    onChange={(e) => setRecallForm(prev => ({ ...prev, reason: e.target.value }))}
                  />
                </Grid>
              </Grid>
            </Box>
          )}

          {activeStep === 2 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Review Recall Details
              </Typography>
              
              <Paper sx={{ p: 2, mb: 2 }}>
                <Typography variant="subtitle1" gutterBottom>
                  <strong>Severity:</strong> {recallForm.severity}
                </Typography>
                <Typography variant="subtitle1" gutterBottom>
                  <strong>Reason:</strong> {recallForm.reason}
                </Typography>
                <Typography variant="subtitle1" gutterBottom>
                  <strong>Initiated By:</strong> {recallForm.initiatedBy}
                </Typography>
                <Typography variant="subtitle1" gutterBottom>
                  <strong>Batches ({selectedBatches.length}):</strong>
                </Typography>
                <List dense>
                  {selectedBatches.map((batch) => (
                    <ListItem key={batch.batchId}>
                      <ListItemText
                        primary={`${batch.batchId} - ${batch.productName}`}
                        secondary={`Lot: ${batch.lotNumber} | Qty: ${batch.quantityAffected}`}
                      />
                    </ListItem>
                  ))}
                </List>
              </Paper>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRecallDialogOpen(false)}>
            Cancel
          </Button>
          {activeStep > 0 && (
            <Button onClick={() => setActiveStep(activeStep - 1)}>
              Back
            </Button>
          )}
          {activeStep < steps.length - 1 ? (
            <Button
              variant="contained"
              onClick={() => setActiveStep(activeStep + 1)}
              disabled={activeStep === 0 && selectedBatches.length === 0}
            >
              Next
            </Button>
          ) : (
            <Button
              variant="contained"
              onClick={handleInitiateRecall}
              disabled={loading || !recallForm.reason || !recallForm.initiatedBy}
            >
              {loading ? <CircularProgress size={20} /> : 'Initiate Recall'}
            </Button>
          )}
        </DialogActions>
      </Dialog>

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
                  onChange={(e) => setReportForm(prev => ({ ...prev, reportType: e.target.value }))}
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

export default RecallAndAntiCounterfeitDemo;