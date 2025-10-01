import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Alert,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Paper,
  Divider,
  Autocomplete,
  FormControlLabel,
  Switch,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Add,
  Remove,
  Save,
  Send,
  Warning,
  Error,
  Info,
  CheckCircle,
  AttachFile,
  Delete,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { createRecall, searchBatches } from '../../store/recallSlice';
import { RecallInitiationProps, Batch } from '../../types';
import { format } from 'date-fns';

const RecallInitiation: React.FC<RecallInitiationProps> = ({
  onSubmit,
  loading,
  error,
}) => {
  const dispatch = useAppDispatch();
  const { affectedBatches: batches } = useAppSelector((state) => state.recall);
  
  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    reason: '',
    severity: 'medium' as 'low' | 'medium' | 'high' | 'critical',
    affectedBatches: [] as string[],
    actions: [] as Array<{
      id: string;
      type: 'notification' | 'quarantine' | 'return' | 'destroy';
      description: string;
      status: 'pending' | 'completed' | 'failed';
      assignedTo: string;
      dueDate: string;
    }>,
    notifyStakeholders: true,
    autoQuarantine: false,
    requireConfirmation: true,
  });
  const [batchSearchTerm, setBatchSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Batch[]>([]);
  const [searching, setSearching] = useState(false);

  const steps = [
    'Recall Information',
    'Affected Batches',
    'Actions & Timeline',
    'Review & Submit',
  ];

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleBatchSearch = async (searchTerm: string) => {
    if (searchTerm.length < 2) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    try {
      const results = await dispatch(searchBatches(searchTerm)).unwrap();
      setSearchResults(results);
    } catch (error) {
      console.error('Error searching batches:', error);
    } finally {
      setSearching(false);
    }
  };

  const handleAddBatch = (batch: Batch) => {
    if (!formData.affectedBatches.includes(batch.id)) {
      handleInputChange('affectedBatches', [...formData.affectedBatches, batch.id]);
    }
    setBatchSearchTerm('');
    setSearchResults([]);
  };

  const handleRemoveBatch = (batchId: string) => {
    handleInputChange('affectedBatches', 
      formData.affectedBatches.filter(id => id !== batchId)
    );
  };

  const handleAddAction = () => {
    handleInputChange('actions', [
      ...formData.actions,
      {
        type: 'notification',
        description: '',
        assignedTo: '',
        dueDate: '',
      }
    ]);
  };

  const handleUpdateAction = (index: number, field: string, value: any) => {
    const updatedActions = [...formData.actions];
    updatedActions[index] = {
      ...updatedActions[index],
      [field]: value,
    };
    handleInputChange('actions', updatedActions);
  };

  const handleRemoveAction = (index: number) => {
    const updatedActions = formData.actions.filter((_, i) => i !== index);
    handleInputChange('actions', updatedActions);
  };

  const handleNext = () => {
    setActiveStep(prev => prev + 1);
  };

  const handleBack = () => {
    setActiveStep(prev => prev - 1);
  };

  const handleSubmit = async () => {
    try {
      const recallData = {
        ...formData,
        status: 'initiated' as const,
        initiatedBy: 'Current User', // This would come from auth context
        initiatedDate: new Date().toISOString(),
        actions: formData.actions.map(action => ({
          ...action,
          id: `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          status: 'pending' as const,
        })),
      };
      
      await dispatch(createRecall(recallData)).unwrap();
      onSubmit(recallData);
    } catch (error) {
      console.error('Error creating recall:', error);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'error';
      case 'high': return 'warning';
      case 'medium': return 'info';
      case 'low': return 'success';
      default: return 'default';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <Error />;
      case 'high': return <Warning />;
      case 'medium': return <Info />;
      case 'low': return <CheckCircle />;
      default: return <Info />;
    }
  };

  const isStepValid = (step: number) => {
    switch (step) {
      case 0:
        return formData.title && formData.description && formData.reason;
      case 1:
        return formData.affectedBatches.length > 0;
      case 2:
        return formData.actions.length > 0 && formData.actions.every(action => 
          action.description && action.assignedTo && action.dueDate
        );
      case 3:
        return true;
      default:
        return false;
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Initiate New Recall
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Card>
        <CardContent>
          <Stepper activeStep={activeStep} orientation="vertical">
            {/* Step 1: Recall Information */}
            <Step>
              <StepLabel>Recall Information</StepLabel>
              <StepContent>
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Recall Title"
                      value={formData.title}
                      onChange={(e) => handleInputChange('title', e.target.value)}
                      placeholder="Enter a descriptive title for the recall"
                      required
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Description"
                      value={formData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      placeholder="Provide detailed description of the recall"
                      multiline
                      rows={4}
                      required
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Reason for Recall"
                      value={formData.reason}
                      onChange={(e) => handleInputChange('reason', e.target.value)}
                      placeholder="Explain why this recall is necessary"
                      multiline
                      rows={3}
                      required
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth required>
                      <InputLabel>Severity Level</InputLabel>
                      <Select
                        value={formData.severity}
                        label="Severity Level"
                        onChange={(e) => handleInputChange('severity', e.target.value)}
                      >
                        <MenuItem value="low">
                          <Box display="flex" alignItems="center" gap={1}>
                            <CheckCircle color="success" />
                            Low
                          </Box>
                        </MenuItem>
                        <MenuItem value="medium">
                          <Box display="flex" alignItems="center" gap={1}>
                            <Info color="info" />
                            Medium
                          </Box>
                        </MenuItem>
                        <MenuItem value="high">
                          <Box display="flex" alignItems="center" gap={1}>
                            <Warning color="warning" />
                            High
                          </Box>
                        </MenuItem>
                        <MenuItem value="critical">
                          <Box display="flex" alignItems="center" gap={1}>
                            <Error color="error" />
                            Critical
                          </Box>
                        </MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>
                <Box sx={{ mt: 2 }}>
                  <Button
                    variant="contained"
                    onClick={handleNext}
                    disabled={!isStepValid(0)}
                  >
                    Next
                  </Button>
                </Box>
              </StepContent>
            </Step>

            {/* Step 2: Affected Batches */}
            <Step>
              <StepLabel>Affected Batches</StepLabel>
              <StepContent>
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <Autocomplete
                      options={searchResults}
                      getOptionLabel={(option) => `${option.batchNumber} - ${option.productName}`}
                      loading={searching}
                      onInputChange={(event, newInputValue) => {
                        setBatchSearchTerm(newInputValue);
                        handleBatchSearch(newInputValue);
                      }}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Search Batches"
                          placeholder="Enter batch number or product name"
                          InputProps={{
                            ...params.InputProps,
                            endAdornment: (
                              <>
                                {searching ? <CircularProgress color="inherit" size={20} /> : null}
                                {params.InputProps.endAdornment}
                              </>
                            ),
                          }}
                        />
                      )}
                      renderOption={(props, option) => (
                        <li {...props}>
                          <Box>
                            <Typography variant="subtitle2">
                              {option.batchNumber}
                            </Typography>
                            <Typography variant="body2" color="textSecondary">
                              {option.productName} - {option.location}
                            </Typography>
                          </Box>
                        </li>
                      )}
                      onChange={(event, value) => {
                        if (value) {
                          handleAddBatch(value);
                        }
                      }}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="h6" gutterBottom>
                      Selected Batches ({formData.affectedBatches.length})
                    </Typography>
                    <Box display="flex" flexWrap="wrap" gap={1}>
                      {formData.affectedBatches.map((batchId) => {
                        const batch = batches.find(b => b.id === batchId);
                        return batch ? (
                          <Chip
                            key={batchId}
                            label={`${batch.batchNumber} - ${batch.productName}`}
                            onDelete={() => handleRemoveBatch(batchId)}
                            color="primary"
                            variant="outlined"
                          />
                        ) : null;
                      })}
                    </Box>
                  </Grid>
                </Grid>
                <Box sx={{ mt: 2 }}>
                  <Button onClick={handleBack} sx={{ mr: 1 }}>
                    Back
                  </Button>
                  <Button
                    variant="contained"
                    onClick={handleNext}
                    disabled={!isStepValid(1)}
                  >
                    Next
                  </Button>
                </Box>
              </StepContent>
            </Step>

            {/* Step 3: Actions & Timeline */}
            <Step>
              <StepLabel>Actions & Timeline</StepLabel>
              <StepContent>
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                      <Typography variant="h6">
                        Recall Actions
                      </Typography>
                      <Button
                        startIcon={<Add />}
                        onClick={handleAddAction}
                        variant="outlined"
                      >
                        Add Action
                      </Button>
                    </Box>
                    {formData.actions.map((action, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                      >
                        <Paper sx={{ p: 2, mb: 2 }}>
                          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                            <Typography variant="subtitle2">
                              Action {index + 1}
                            </Typography>
                            <IconButton
                              onClick={() => handleRemoveAction(index)}
                              color="error"
                              size="small"
                            >
                              <Delete />
                            </IconButton>
                          </Box>
                          <Grid container spacing={2}>
                            <Grid item xs={12} md={3}>
                              <FormControl fullWidth>
                                <InputLabel>Action Type</InputLabel>
                                <Select
                                  value={action.type}
                                  label="Action Type"
                                  onChange={(e) => handleUpdateAction(index, 'type', e.target.value)}
                                >
                                  <MenuItem value="notification">Notification</MenuItem>
                                  <MenuItem value="quarantine">Quarantine</MenuItem>
                                  <MenuItem value="return">Return</MenuItem>
                                  <MenuItem value="destroy">Destroy</MenuItem>
                                </Select>
                              </FormControl>
                            </Grid>
                            <Grid item xs={12} md={6}>
                              <TextField
                                fullWidth
                                label="Description"
                                value={action.description}
                                onChange={(e) => handleUpdateAction(index, 'description', e.target.value)}
                                placeholder="Describe the action to be taken"
                              />
                            </Grid>
                            <Grid item xs={12} md={3}>
                              <TextField
                                fullWidth
                                label="Assigned To"
                                value={action.assignedTo}
                                onChange={(e) => handleUpdateAction(index, 'assignedTo', e.target.value)}
                                placeholder="Person or department"
                              />
                            </Grid>
                            <Grid item xs={12}>
                              <TextField
                                fullWidth
                                type="datetime-local"
                                label="Due Date"
                                value={action.dueDate}
                                onChange={(e) => handleUpdateAction(index, 'dueDate', e.target.value)}
                                InputLabelProps={{ shrink: true }}
                              />
                            </Grid>
                          </Grid>
                        </Paper>
                      </motion.div>
                    ))}
                  </Grid>
                  <Grid item xs={12}>
                    <Divider sx={{ my: 2 }} />
                    <Typography variant="h6" gutterBottom>
                      Additional Options
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={4}>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={formData.notifyStakeholders}
                              onChange={(e) => handleInputChange('notifyStakeholders', e.target.checked)}
                            />
                          }
                          label="Notify Stakeholders"
                        />
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={formData.autoQuarantine}
                              onChange={(e) => handleInputChange('autoQuarantine', e.target.checked)}
                            />
                          }
                          label="Auto-Quarantine Batches"
                        />
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={formData.requireConfirmation}
                              onChange={(e) => handleInputChange('requireConfirmation', e.target.checked)}
                            />
                          }
                          label="Require Confirmation"
                        />
                      </Grid>
                    </Grid>
                  </Grid>
                </Grid>
                <Box sx={{ mt: 2 }}>
                  <Button onClick={handleBack} sx={{ mr: 1 }}>
                    Back
                  </Button>
                  <Button
                    variant="contained"
                    onClick={handleNext}
                    disabled={!isStepValid(2)}
                  >
                    Next
                  </Button>
                </Box>
              </StepContent>
            </Step>

            {/* Step 4: Review & Submit */}
            <Step>
              <StepLabel>Review & Submit</StepLabel>
              <StepContent>
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <Typography variant="h6" gutterBottom>
                      Recall Summary
                    </Typography>
                    <Paper sx={{ p: 2 }}>
                      <Grid container spacing={2}>
                        <Grid item xs={12} md={6}>
                          <Typography variant="subtitle2" color="textSecondary">
                            Title
                          </Typography>
                          <Typography variant="body1" gutterBottom>
                            {formData.title}
                          </Typography>
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <Typography variant="subtitle2" color="textSecondary">
                            Severity
                          </Typography>
                          <Chip
                            icon={getSeverityIcon(formData.severity)}
                            label={formData.severity.toUpperCase()}
                            color={getSeverityColor(formData.severity) as any}
                            size="small"
                          />
                        </Grid>
                        <Grid item xs={12}>
                          <Typography variant="subtitle2" color="textSecondary">
                            Description
                          </Typography>
                          <Typography variant="body1" gutterBottom>
                            {formData.description}
                          </Typography>
                        </Grid>
                        <Grid item xs={12}>
                          <Typography variant="subtitle2" color="textSecondary">
                            Reason
                          </Typography>
                          <Typography variant="body1" gutterBottom>
                            {formData.reason}
                          </Typography>
                        </Grid>
                        <Grid item xs={12}>
                          <Typography variant="subtitle2" color="textSecondary">
                            Affected Batches ({formData.affectedBatches.length})
                          </Typography>
                          <Box display="flex" flexWrap="wrap" gap={1}>
                            {formData.affectedBatches.map((batchId) => {
                              const batch = batches.find(b => b.id === batchId);
                              return batch ? (
                                <Chip
                                  key={batchId}
                                  label={`${batch.batchNumber} - ${batch.productName}`}
                                  color="primary"
                                  variant="outlined"
                                  size="small"
                                />
                              ) : null;
                            })}
                          </Box>
                        </Grid>
                        <Grid item xs={12}>
                          <Typography variant="subtitle2" color="textSecondary">
                            Actions ({formData.actions.length})
                          </Typography>
                          {formData.actions.map((action, index) => (
                            <Box key={index} sx={{ mb: 1 }}>
                              <Typography variant="body2">
                                {action.type.toUpperCase()}: {action.description}
                              </Typography>
                              <Typography variant="caption" color="textSecondary">
                                Assigned to: {action.assignedTo} | Due: {format(new Date(action.dueDate), 'MMM dd, yyyy HH:mm')}
                              </Typography>
                            </Box>
                          ))}
                        </Grid>
                      </Grid>
                    </Paper>
                  </Grid>
                </Grid>
                <Box sx={{ mt: 2 }}>
                  <Button onClick={handleBack} sx={{ mr: 1 }}>
                    Back
                  </Button>
                  <Button
                    variant="contained"
                    startIcon={loading ? <CircularProgress size={20} /> : <Send />}
                    onClick={handleSubmit}
                    disabled={loading}
                    color="primary"
                  >
                    {loading ? 'Creating Recall...' : 'Create Recall'}
                  </Button>
                </Box>
              </StepContent>
            </Step>
          </Stepper>
        </CardContent>
      </Card>
    </Box>
  );
};

export default RecallInitiation;