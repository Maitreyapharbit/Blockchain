import React, { useState, useRef } from 'react';
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
  Alert,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Paper,
  Chip,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  Avatar,
  Tooltip,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Add,
  Delete,
  Upload,
  CameraAlt,
  LocationOn,
  Assignment,
  Warning,
  Error,
  CheckCircle,
  Info,
  Save,
  Send,
  AttachFile,
  Image,
  VideoFile,
  Description,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppDispatch } from '../../store/hooks';
import { createReport, uploadEvidence } from '../../store/counterfeitSlice';
import { ReportingFormProps, EvidenceFile } from '../../types';
import { format } from 'date-fns';

const ReportingForm: React.FC<ReportingFormProps> = ({
  onSubmit,
  loading,
  error,
}) => {
  const dispatch = useAppDispatch();
  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState({
    batchId: '',
    productName: '',
    description: '',
    severity: 'medium' as 'low' | 'medium' | 'high' | 'critical',
    location: {
      latitude: 0,
      longitude: 0,
      address: '',
    },
    evidence: [] as EvidenceFile[],
    contactInfo: {
      name: '',
      email: '',
      phone: '',
    },
    additionalDetails: '',
  });
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [selectedEvidence, setSelectedEvidence] = useState<EvidenceFile | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const steps = [
    'Basic Information',
    'Location Details',
    'Evidence Upload',
    'Contact Information',
    'Review & Submit',
  ];

  const handleInputChange = (field: string, value: any) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent as keyof typeof prev],
          [child]: value,
        },
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value,
      }));
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setUploadProgress(0);

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const progress = ((i + 1) / files.length) * 100;
        setUploadProgress(progress);

        // Simulate file upload
        await new Promise(resolve => setTimeout(resolve, 1000));

        const evidenceFile: EvidenceFile = {
          id: `evidence_${Date.now()}_${i}`,
          filename: file.name,
          type: file.type.startsWith('image/') ? 'image' : 
                file.type.startsWith('video/') ? 'video' : 'document',
          url: URL.createObjectURL(file),
          uploadedAt: new Date().toISOString(),
          size: file.size,
        };

        setFormData(prev => ({
          ...prev,
          evidence: [...prev.evidence, evidenceFile],
        }));
      }
    } catch (error) {
      console.error('Error uploading files:', error);
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleRemoveEvidence = (evidenceId: string) => {
    setFormData(prev => ({
      ...prev,
      evidence: prev.evidence.filter(e => e.id !== evidenceId),
    }));
  };

  const handleLocationDetect = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData(prev => ({
            ...prev,
            location: {
              ...prev.location,
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            },
          }));
        },
        (error) => {
          console.error('Error getting location:', error);
        }
      );
    }
  };

  const handleNext = () => {
    setActiveStep(prev => prev + 1);
  };

  const handleBack = () => {
    setActiveStep(prev => prev - 1);
  };

  const handleSubmit = async () => {
    try {
      const reportData = {
        ...formData,
        reportedBy: formData.contactInfo.name,
        reportDate: new Date().toISOString(),
        status: 'pending' as const,
      };
      
      await dispatch(createReport(reportData)).unwrap();
      onSubmit(reportData);
    } catch (error) {
      console.error('Error creating report:', error);
    }
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'image': return <Image />;
      case 'video': return <VideoFile />;
      case 'document': return <Description />;
      default: return <AttachFile />;
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

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const isStepValid = (step: number) => {
    switch (step) {
      case 0:
        return formData.batchId && formData.productName && formData.description;
      case 1:
        return formData.location.address;
      case 2:
        return formData.evidence.length > 0;
      case 3:
        return formData.contactInfo.name && formData.contactInfo.email;
      case 4:
        return true;
      default:
        return false;
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Report Counterfeit Product
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Card>
        <CardContent>
          <Stepper activeStep={activeStep} orientation="vertical">
            {/* Step 1: Basic Information */}
            <Step>
              <StepLabel>Basic Information</StepLabel>
              <StepContent>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Batch ID"
                      value={formData.batchId}
                      onChange={(e) => handleInputChange('batchId', e.target.value)}
                      placeholder="Enter batch number or ID"
                      required
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Product Name"
                      value={formData.productName}
                      onChange={(e) => handleInputChange('productName', e.target.value)}
                      placeholder="Enter product name"
                      required
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Description"
                      value={formData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      placeholder="Describe the counterfeit product and your concerns"
                      multiline
                      rows={4}
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
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Additional Details"
                      value={formData.additionalDetails}
                      onChange={(e) => handleInputChange('additionalDetails', e.target.value)}
                      placeholder="Any additional information"
                      multiline
                      rows={3}
                    />
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

            {/* Step 2: Location Details */}
            <Step>
              <StepLabel>Location Details</StepLabel>
              <StepContent>
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Address"
                      value={formData.location.address}
                      onChange={(e) => handleInputChange('location.address', e.target.value)}
                      placeholder="Enter the location where you found the counterfeit product"
                      required
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Latitude"
                      type="number"
                      value={formData.location.latitude}
                      onChange={(e) => handleInputChange('location.latitude', parseFloat(e.target.value))}
                      placeholder="Latitude coordinate"
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Longitude"
                      type="number"
                      value={formData.location.longitude}
                      onChange={(e) => handleInputChange('location.longitude', parseFloat(e.target.value))}
                      placeholder="Longitude coordinate"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Button
                      variant="outlined"
                      startIcon={<LocationOn />}
                      onClick={handleLocationDetect}
                    >
                      Detect Current Location
                    </Button>
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

            {/* Step 3: Evidence Upload */}
            <Step>
              <StepLabel>Evidence Upload</StepLabel>
              <StepContent>
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <Typography variant="h6" gutterBottom>
                      Upload Evidence
                    </Typography>
                    <Typography variant="body2" color="textSecondary" paragraph>
                      Please upload photos, videos, or documents that support your report.
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Box display="flex" gap={2} mb={2}>
                      <Button
                        variant="outlined"
                        startIcon={<Upload />}
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                      >
                        Upload Files
                      </Button>
                      <Button
                        variant="outlined"
                        startIcon={<CameraAlt />}
                        onClick={() => cameraInputRef.current?.click()}
                        disabled={uploading}
                      >
                        Take Photo
                      </Button>
                    </Box>
                    <input
                      type="file"
                      ref={fileInputRef}
                      style={{ display: 'none' }}
                      accept="image/*,video/*,.pdf,.doc,.docx"
                      multiple
                      onChange={handleFileUpload}
                    />
                    <input
                      type="file"
                      ref={cameraInputRef}
                      style={{ display: 'none' }}
                      accept="image/*"
                      capture="environment"
                      onChange={handleFileUpload}
                    />
                    {uploading && (
                      <Box mb={2}>
                        <LinearProgress variant="determinate" value={uploadProgress} />
                        <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                          Uploading files... {Math.round(uploadProgress)}%
                        </Typography>
                      </Box>
                    )}
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="h6" gutterBottom>
                      Uploaded Evidence ({formData.evidence.length})
                    </Typography>
                    {formData.evidence.length === 0 ? (
                      <Paper sx={{ p: 3, textAlign: 'center' }}>
                        <AttachFile sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
                        <Typography variant="body1" color="textSecondary">
                          No evidence uploaded yet
                        </Typography>
                      </Paper>
                    ) : (
                      <List>
                        <AnimatePresence>
                          {formData.evidence.map((evidence, index) => (
                            <motion.div
                              key={evidence.id}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -20 }}
                              transition={{ delay: index * 0.1 }}
                            >
                              <ListItem>
                                <ListItemIcon>
                                  <Avatar>
                                    {getFileIcon(evidence.type)}
                                  </Avatar>
                                </ListItemIcon>
                                <ListItemText
                                  primary={evidence.filename}
                                  secondary={
                                    <Box>
                                      <Typography variant="caption" color="textSecondary">
                                        {evidence.type.toUpperCase()} • {formatFileSize(evidence.size)}
                                      </Typography>
                                      <br />
                                      <Typography variant="caption" color="textSecondary">
                                        {format(new Date(evidence.uploadedAt), 'MMM dd, yyyy HH:mm')}
                                      </Typography>
                                    </Box>
                                  }
                                />
                                <ListItemSecondaryAction>
                                  <Box display="flex" gap={1}>
                                    <IconButton
                                      size="small"
                                      onClick={() => {
                                        setSelectedEvidence(evidence);
                                        setPreviewDialogOpen(true);
                                      }}
                                    >
                                      <Assignment />
                                    </IconButton>
                                    <IconButton
                                      size="small"
                                      onClick={() => handleRemoveEvidence(evidence.id)}
                                      color="error"
                                    >
                                      <Delete />
                                    </IconButton>
                                  </Box>
                                </ListItemSecondaryAction>
                              </ListItem>
                            </motion.div>
                          ))}
                        </AnimatePresence>
                      </List>
                    )}
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

            {/* Step 4: Contact Information */}
            <Step>
              <StepLabel>Contact Information</StepLabel>
              <StepContent>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Full Name"
                      value={formData.contactInfo.name}
                      onChange={(e) => handleInputChange('contactInfo.name', e.target.value)}
                      placeholder="Enter your full name"
                      required
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Email Address"
                      type="email"
                      value={formData.contactInfo.email}
                      onChange={(e) => handleInputChange('contactInfo.email', e.target.value)}
                      placeholder="Enter your email address"
                      required
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Phone Number"
                      value={formData.contactInfo.phone}
                      onChange={(e) => handleInputChange('contactInfo.phone', e.target.value)}
                      placeholder="Enter your phone number"
                    />
                  </Grid>
                </Grid>
                <Box sx={{ mt: 2 }}>
                  <Button onClick={handleBack} sx={{ mr: 1 }}>
                    Back
                  </Button>
                  <Button
                    variant="contained"
                    onClick={handleNext}
                    disabled={!isStepValid(3)}
                  >
                    Next
                  </Button>
                </Box>
              </StepContent>
            </Step>

            {/* Step 5: Review & Submit */}
            <Step>
              <StepLabel>Review & Submit</StepLabel>
              <StepContent>
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <Typography variant="h6" gutterBottom>
                      Report Summary
                    </Typography>
                    <Paper sx={{ p: 2 }}>
                      <Grid container spacing={2}>
                        <Grid item xs={12} md={6}>
                          <Typography variant="subtitle2" color="textSecondary">
                            Product Information
                          </Typography>
                          <Typography variant="body1" gutterBottom>
                            <strong>Product:</strong> {formData.productName}
                          </Typography>
                          <Typography variant="body1" gutterBottom>
                            <strong>Batch ID:</strong> {formData.batchId}
                          </Typography>
                          <Typography variant="body1" gutterBottom>
                            <strong>Severity:</strong> 
                            <Chip
                              icon={getSeverityIcon(formData.severity)}
                              label={formData.severity.toUpperCase()}
                              color={getSeverityColor(formData.severity) as any}
                              size="small"
                              sx={{ ml: 1 }}
                            />
                          </Typography>
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <Typography variant="subtitle2" color="textSecondary">
                            Location
                          </Typography>
                          <Typography variant="body1" gutterBottom>
                            <strong>Address:</strong> {formData.location.address}
                          </Typography>
                          {formData.location.latitude !== 0 && formData.location.longitude !== 0 && (
                            <Typography variant="body1" gutterBottom>
                              <strong>Coordinates:</strong> {formData.location.latitude}, {formData.location.longitude}
                            </Typography>
                          )}
                        </Grid>
                        <Grid item xs={12}>
                          <Typography variant="subtitle2" color="textSecondary">
                            Description
                          </Typography>
                          <Typography variant="body1" paragraph>
                            {formData.description}
                          </Typography>
                        </Grid>
                        <Grid item xs={12}>
                          <Typography variant="subtitle2" color="textSecondary">
                            Evidence ({formData.evidence.length} files)
                          </Typography>
                          <Box display="flex" flexWrap="wrap" gap={1}>
                            {formData.evidence.map((evidence) => (
                              <Chip
                                key={evidence.id}
                                icon={getFileIcon(evidence.type)}
                                label={evidence.filename}
                                size="small"
                                variant="outlined"
                              />
                            ))}
                          </Box>
                        </Grid>
                        <Grid item xs={12}>
                          <Typography variant="subtitle2" color="textSecondary">
                            Contact Information
                          </Typography>
                          <Typography variant="body1" gutterBottom>
                            <strong>Name:</strong> {formData.contactInfo.name}
                          </Typography>
                          <Typography variant="body1" gutterBottom>
                            <strong>Email:</strong> {formData.contactInfo.email}
                          </Typography>
                          {formData.contactInfo.phone && (
                            <Typography variant="body1" gutterBottom>
                              <strong>Phone:</strong> {formData.contactInfo.phone}
                            </Typography>
                          )}
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
                    disabled={loading || !isStepValid(4)}
                  >
                    {loading ? 'Submitting Report...' : 'Submit Report'}
                  </Button>
                </Box>
              </StepContent>
            </Step>
          </Stepper>
        </CardContent>
      </Card>

      {/* Evidence Preview Dialog */}
      <Dialog
        open={previewDialogOpen}
        onClose={() => setPreviewDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Evidence Preview
        </DialogTitle>
        <DialogContent>
          {selectedEvidence && (
            <Box>
              <Typography variant="h6" gutterBottom>
                {selectedEvidence.filename}
              </Typography>
              <Typography variant="body2" color="textSecondary" paragraph>
                {selectedEvidence.type.toUpperCase()} • {formatFileSize(selectedEvidence.size)}
              </Typography>
              {selectedEvidence.type === 'image' && (
                <Box textAlign="center">
                  <img
                    src={selectedEvidence.url}
                    alt={selectedEvidence.filename}
                    style={{ maxWidth: '100%', maxHeight: '400px', objectFit: 'contain' }}
                  />
                </Box>
              )}
              {selectedEvidence.type === 'video' && (
                <Box textAlign="center">
                  <video
                    src={selectedEvidence.url}
                    controls
                    style={{ maxWidth: '100%', maxHeight: '400px' }}
                  />
                </Box>
              )}
              {selectedEvidence.type === 'document' && (
                <Box textAlign="center" py={4}>
                  <Description sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="body1" color="textSecondary">
                    Document preview not available
                  </Typography>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewDialogOpen(false)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ReportingForm;