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
  Stepper,
  Step,
  StepLabel,
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
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Notifications as NotificationsIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Refresh as RefreshIcon,
  Visibility as VisibilityIcon,
} from '@mui/icons-material';
import { DataGrid, GridColDef, GridRowParams } from '@mui/x-data-grid';
import { recallApi } from '../../services/api';
import { Recall, RecallBatch } from '../../types';

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
      id={`recall-tabpanel-${index}`}
      aria-labelledby={`recall-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const RecallManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [recalls, setRecalls] = useState<Recall[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Recall initiation state
  const [initiateDialogOpen, setInitiateDialogOpen] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [recallForm, setRecallForm] = useState({
    batchIds: [] as string[],
    severity: 'LOW' as 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL',
    reason: '',
    initiatedBy: '',
  });
  const [batchSearchQuery, setBatchSearchQuery] = useState('');
  const [availableBatches, setAvailableBatches] = useState<string[]>([]);
  
  // Batch selection state
  const [selectedBatches, setSelectedBatches] = useState<RecallBatch[]>([]);
  const [batchForm, setBatchForm] = useState({
    batchId: '',
    productName: '',
    lotNumber: '',
    expiryDate: '',
    quantity: 0,
  });

  useEffect(() => {
    loadRecalls();
  }, []);

  const loadRecalls = async () => {
    try {
      setLoading(true);
      const response = await recallApi.getAllRecalls();
      if (response.success) {
        setRecalls(response.data || []);
      } else {
        setError(response.error || 'Failed to load recalls');
      }
    } catch (err) {
      setError('Failed to load recalls');
    } finally {
      setLoading(false);
    }
  };

  const handleInitiateRecall = async () => {
    try {
      setLoading(true);
      const response = await recallApi.initiateRecall({
        batchIds: recallForm.batchIds,
        severity: recallForm.severity,
        reason: recallForm.reason,
        initiatedBy: recallForm.initiatedBy,
      });

      if (response.success) {
        setSuccess('Recall initiated successfully');
        setInitiateDialogOpen(false);
        resetForm();
        loadRecalls();
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
      const newBatch: RecallBatch = {
        id: `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        batchId: batchForm.batchId,
        productName: batchForm.productName,
        batchNumber: batchForm.lotNumber,
        lotNumber: batchForm.lotNumber,
        manufacturingDate: new Date().toISOString(),
        expiryDate: batchForm.expiryDate,
        quantity: batchForm.quantity,
        quantityAffected: batchForm.quantity,
        status: 'active',
        recallId: '',
        affectedQuantity: batchForm.quantity,
        actions: [],
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
        quantity: 0,
      });
    }
  };

  const handleRemoveBatch = (batchId: string) => {
    setSelectedBatches(selectedBatches.filter(b => b.batchId !== batchId));
    setRecallForm(prev => ({
      ...prev,
      batchIds: prev.batchIds.filter(id => id !== batchId)
    }));
  };

  const resetForm = () => {
    setRecallForm({
      batchIds: [],
      severity: 'LOW',
      reason: '',
      initiatedBy: '',
    });
    setSelectedBatches([]);
    setActiveStep(0);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'LOW': return 'success';
      case 'MEDIUM': return 'warning';
      case 'HIGH': return 'error';
      case 'CRITICAL': return 'error';
      default: return 'default';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'error';
      case 'RESOLVED': return 'success';
      case 'CANCELLED': return 'default';
      default: return 'default';
    }
  };

  const recallColumns: GridColDef[] = [
    { field: 'recallId', headerName: 'Recall ID', width: 200 },
    { field: 'severity', headerName: 'Severity', width: 120, renderCell: (params) => (
      <Chip label={params.value} color={getSeverityColor(params.value) as any} size="small" />
    )},
    { field: 'reason', headerName: 'Reason', width: 300 },
    { field: 'status', headerName: 'Status', width: 120, renderCell: (params) => (
      <Chip label={params.value} color={getStatusColor(params.value) as any} size="small" />
    )},
    { field: 'initiatedBy', headerName: 'Initiated By', width: 150 },
    { field: 'initiatedAt', headerName: 'Initiated At', width: 180, renderCell: (params) => (
      new Date(params.value).toLocaleString()
    )},
    { field: 'batchCount', headerName: 'Batches', width: 100 },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 150,
      renderCell: (params) => (
        <Box>
          <IconButton size="small" onClick={() => {/* View details */}}>
            <VisibilityIcon />
          </IconButton>
          <IconButton size="small" onClick={() => {/* Notify stakeholders */}}>
            <NotificationsIcon />
          </IconButton>
        </Box>
      ),
    },
  ];

  const steps = [
    'Select Batches',
    'Set Severity & Reason',
    'Review & Confirm',
  ];

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Recall Management System
      </Typography>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Active Recalls</Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setInitiateDialogOpen(true)}
            >
              Initiate Recall
            </Button>
          </Box>

          <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
            <Tab label="All Recalls" />
            <Tab label="Active Recalls" />
            <Tab label="Resolved Recalls" />
          </Tabs>

          <TabPanel value={activeTab} index={0}>
            <Box sx={{ height: 400, width: '100%' }}>
              <DataGrid
                rows={recalls}
                columns={recallColumns}
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
          </TabPanel>

          <TabPanel value={activeTab} index={1}>
            <Box sx={{ height: 400, width: '100%' }}>
              <DataGrid
                rows={recalls.filter(r => r.status === 'in_progress')}
                columns={recallColumns}
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
          </TabPanel>

          <TabPanel value={activeTab} index={2}>
            <Box sx={{ height: 400, width: '100%' }}>
              <DataGrid
                rows={recalls.filter(r => r.status === 'completed')}
                columns={recallColumns}
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
          </TabPanel>
        </CardContent>
      </Card>

      {/* Quick Recall Initiation Dialog */}
      <Dialog
        open={initiateDialogOpen}
        onClose={() => setInitiateDialogOpen(false)}
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
                      onChange={(e) => setRecallForm(prev => ({ ...prev, severity: e.target.value as any }))}
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
          <Button onClick={() => setInitiateDialogOpen(false)}>
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

export default RecallManagement;