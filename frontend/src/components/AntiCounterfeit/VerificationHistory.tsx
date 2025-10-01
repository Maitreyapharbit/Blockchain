import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  Button,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  Grid,
  Alert,
  CircularProgress,
  Tooltip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Avatar,
  Badge,
  LinearProgress,
  Tabs,
  Tab,
  Box as MuiBox,
} from '@mui/material';
import {
  Search,
  FilterList,
  CheckCircle,
  Error,
  Warning,
  Info,
  QrCode,
  Security,
  Assignment,
  VerifiedUser,
  Schedule,
  TrendingUp,
  TrendingDown,
  Refresh,
  Download,
  Share,
  Visibility,
  Assessment,
  History,
  Timeline,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
  fetchVerificationResults,
  setFilters,
  setPagination,
  clearError,
} from '../../store/counterfeitSlice';
import { VerificationHistoryProps, VerificationResult } from '../../types';
import { format } from 'date-fns';

const VerificationHistory: React.FC<VerificationHistoryProps> = ({
  verifications,
  onVerificationClick,
  loading,
}) => {
  const dispatch = useAppDispatch();
  const { pagination, filters } = useAppSelector((state) => state.counterfeit);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState(filters.search);
  const [resultFilter, setResultFilter] = useState(filters.result || '');
  const [typeFilter, setTypeFilter] = useState(filters.verificationType || '');
  const [selectedVerification, setSelectedVerification] = useState<VerificationResult | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    dispatch(fetchVerificationResults());
  }, [dispatch]);

  const filteredVerifications = verifications.filter(verification => {
    const matchesSearch = !searchTerm || 
      verification.batchId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      verification.verifiedBy.toLowerCase().includes(searchTerm.toLowerCase()) ||
      verification.details.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesResult = !resultFilter || verification.result === resultFilter;
    const matchesType = !typeFilter || verification.verificationType === typeFilter;
    
    return matchesSearch && matchesResult && matchesType;
  });

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
    dispatch(setPagination({ page: newPage + 1 }));
    dispatch(fetchVerificationResults({ 
      page: newPage + 1, 
      limit: rowsPerPage,
      result: resultFilter,
      verificationType: typeFilter,
    }));
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newRowsPerPage = parseInt(event.target.value, 10);
    setRowsPerPage(newRowsPerPage);
    setPage(0);
    dispatch(setPagination({ page: 1, limit: newRowsPerPage }));
    dispatch(fetchVerificationResults({ 
      page: 1, 
      limit: newRowsPerPage,
      result: resultFilter,
      verificationType: typeFilter,
    }));
  };

  const handleSearch = () => {
    dispatch(setFilters({ search: searchTerm }));
    dispatch(fetchVerificationResults({ 
      page: 1, 
      limit: rowsPerPage,
      result: resultFilter,
      verificationType: typeFilter,
    }));
  };

  const handleFilterChange = (filterType: string, value: string) => {
    if (filterType === 'result') {
      setResultFilter(value);
      dispatch(setFilters({ result: value }));
    } else if (filterType === 'type') {
      setTypeFilter(value);
      dispatch(setFilters({ verificationType: value }));
    }
    
    dispatch(fetchVerificationResults({ 
      page: 1, 
      limit: rowsPerPage,
      result: filterType === 'result' ? value : resultFilter,
      verificationType: filterType === 'type' ? value : typeFilter,
    }));
  };

  const handleVerificationClick = (verification: VerificationResult) => {
    setSelectedVerification(verification);
    setDetailsDialogOpen(true);
    onVerificationClick(verification.id);
  };

  const getResultColor = (result: string) => {
    switch (result) {
      case 'authentic': return 'success';
      case 'counterfeit': return 'error';
      case 'suspicious': return 'warning';
      case 'error': return 'error';
      default: return 'default';
    }
  };

  const getResultIcon = (result: string) => {
    switch (result) {
      case 'authentic': return <CheckCircle />;
      case 'counterfeit': return <Error />;
      case 'suspicious': return <Warning />;
      case 'error': return <Error />;
      default: return <Info />;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'qr_scan': return <QrCode />;
      case 'hologram_check': return <Security />;
      case 'serial_validation': return <Assignment />;
      case 'blockchain_verify': return <VerifiedUser />;
      default: return <Info />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'qr_scan': return 'primary';
      case 'hologram_check': return 'secondary';
      case 'serial_validation': return 'info';
      case 'blockchain_verify': return 'success';
      default: return 'default';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'qr_scan': return 'QR Code Scan';
      case 'hologram_check': return 'Hologram Check';
      case 'serial_validation': return 'Serial Validation';
      case 'blockchain_verify': return 'Blockchain Verify';
      default: return type;
    }
  };

  const getTimeAgo = (timestamp: string) => {
    const now = new Date();
    const verificationTime = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - verificationTime.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 60) {
      return `${diffInMinutes} minutes ago`;
    } else if (diffInMinutes < 1440) {
      const hours = Math.floor(diffInMinutes / 60);
      return `${hours} hours ago`;
    } else {
      const days = Math.floor(diffInMinutes / 1440);
      return `${days} days ago`;
    }
  };

  const getVerificationStats = () => {
    const total = verifications.length;
    const authenticCount = verifications.filter(v => v.result === 'authentic').length;
    const counterfeitCount = verifications.filter(v => v.result === 'counterfeit').length;
    const suspiciousCount = verifications.filter(v => v.result === 'suspicious').length;
    const errorCount = verifications.filter(v => v.result === 'error').length;
    
    return { total, authenticCount, counterfeitCount, suspiciousCount, errorCount };
  };

  const getTypeStats = () => {
    const qrCount = verifications.filter(v => v.verificationType === 'qr_scan').length;
    const hologramCount = verifications.filter(v => v.verificationType === 'hologram_check').length;
    const serialCount = verifications.filter(v => v.verificationType === 'serial_validation').length;
    const blockchainCount = verifications.filter(v => v.verificationType === 'blockchain_verify').length;
    
    return { qrCount, hologramCount, serialCount, blockchainCount };
  };

  const stats = getVerificationStats();
  const typeStats = getTypeStats();

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
        Verification History
      </Typography>

      {/* Stats Cards */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Total Verifications
                  </Typography>
                  <Typography variant="h4" fontWeight="bold">
                    {stats.total}
                  </Typography>
                </Box>
                <History color="primary" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Authentic
                  </Typography>
                  <Typography variant="h4" fontWeight="bold" color="success.main">
                    {stats.authenticCount}
                  </Typography>
                </Box>
                <CheckCircle color="success" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Counterfeit
                  </Typography>
                  <Typography variant="h4" fontWeight="bold" color="error.main">
                    {stats.counterfeitCount}
                  </Typography>
                </Box>
                <Error color="error" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Suspicious
                  </Typography>
                  <Typography variant="h4" fontWeight="bold" color="warning.main">
                    {stats.suspiciousCount}
                  </Typography>
                </Box>
                <Warning color="warning" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Type Stats */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Verification Types
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6} md={3}>
                  <Box textAlign="center">
                    <Typography variant="h3" fontWeight="bold" color="primary">
                      {typeStats.qrCount}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      QR Code Scans
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Box textAlign="center">
                    <Typography variant="h3" fontWeight="bold" color="secondary.main">
                      {typeStats.hologramCount}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Hologram Checks
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Box textAlign="center">
                    <Typography variant="h3" fontWeight="bold" color="info.main">
                      {typeStats.serialCount}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Serial Validations
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Box textAlign="center">
                    <Typography variant="h3" fontWeight="bold" color="success.main">
                      {typeStats.blockchainCount}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Blockchain Verifications
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              placeholder="Search verifications..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
          </Grid>
          <Grid item xs={12} md={2}>
            <FormControl fullWidth>
              <InputLabel>Result</InputLabel>
              <Select
                value={resultFilter}
                label="Result"
                onChange={(e) => handleFilterChange('result', e.target.value)}
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="authentic">Authentic</MenuItem>
                <MenuItem value="counterfeit">Counterfeit</MenuItem>
                <MenuItem value="suspicious">Suspicious</MenuItem>
                <MenuItem value="error">Error</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <FormControl fullWidth>
              <InputLabel>Type</InputLabel>
              <Select
                value={typeFilter}
                label="Type"
                onChange={(e) => handleFilterChange('type', e.target.value)}
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="qr_scan">QR Code Scan</MenuItem>
                <MenuItem value="hologram_check">Hologram Check</MenuItem>
                <MenuItem value="serial_validation">Serial Validation</MenuItem>
                <MenuItem value="blockchain_verify">Blockchain Verify</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <Button
              variant="contained"
              startIcon={<Search />}
              onClick={handleSearch}
              fullWidth
            >
              Search
            </Button>
          </Grid>
          <Grid item xs={12} md={2}>
            <Button
              variant="outlined"
              startIcon={<FilterList />}
              onClick={() => {
                setSearchTerm('');
                setResultFilter('');
                setTypeFilter('');
                dispatch(setFilters({ search: '', result: '', verificationType: '' }));
                dispatch(fetchVerificationResults());
              }}
              fullWidth
            >
              Clear
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
          <Tab label="All Verifications" />
          <Tab label="Recent" />
          <Tab label="Failed" />
        </Tabs>
      </Box>

      {/* Verifications Table */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Verification History ({filteredVerifications.length})
          </Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Verification Details</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Result</TableCell>
                  <TableCell>Confidence</TableCell>
                  <TableCell>Verified By</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <AnimatePresence>
                  {filteredVerifications
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((verification, index) => (
                    <motion.tr
                      key={verification.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ delay: index * 0.05 }}
                      style={{ display: 'table-row' }}
                    >
                      <TableCell>
                        <Box>
                          <Typography variant="subtitle2" fontWeight="bold">
                            {verification.batchId}
                          </Typography>
                          <Typography variant="body2" color="textSecondary">
                            {verification.details}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            {getTimeAgo(verification.timestamp)}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          icon={getTypeIcon(verification.verificationType)}
                          label={getTypeLabel(verification.verificationType)}
                          color={getTypeColor(verification.verificationType) as any}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          icon={getResultIcon(verification.result)}
                          label={verification.result.toUpperCase()}
                          color={getResultColor(verification.result) as any}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={1}>
                          <LinearProgress
                            variant="determinate"
                            value={verification.confidence}
                            color={getResultColor(verification.result) as any}
                            sx={{ width: 60, height: 6 }}
                          />
                          <Typography variant="body2">
                            {verification.confidence}%
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {verification.verifiedBy}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {format(new Date(verification.timestamp), 'MMM dd, yyyy')}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          {format(new Date(verification.timestamp), 'HH:mm')}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box display="flex" gap={1}>
                          <Tooltip title="View Details">
                            <IconButton
                              size="small"
                              onClick={() => handleVerificationClick(verification)}
                            >
                              <Visibility />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Share">
                            <IconButton size="small">
                              <Share />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Download">
                            <IconButton size="small">
                              <Download />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={filteredVerifications.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </CardContent>
      </Card>

      {/* Verification Details Dialog */}
      <Dialog
        open={detailsDialogOpen}
        onClose={() => setDetailsDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Verification Details
        </DialogTitle>
        <DialogContent>
          {selectedVerification && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>
                  Basic Information
                </Typography>
                <List>
                  <ListItem>
                    <ListItemIcon>
                      <Assignment />
                    </ListItemIcon>
                    <ListItemText
                      primary="Batch ID"
                      secondary={selectedVerification.batchId}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <Schedule />
                    </ListItemIcon>
                    <ListItemText
                      primary="Timestamp"
                      secondary={format(new Date(selectedVerification.timestamp), 'MMM dd, yyyy HH:mm:ss')}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <VerifiedUser />
                    </ListItemIcon>
                    <ListItemText
                      primary="Verified By"
                      secondary={selectedVerification.verifiedBy}
                    />
                  </ListItem>
                </List>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>
                  Verification Results
                </Typography>
                <List>
                  <ListItem>
                    <ListItemIcon>
                      <Assessment />
                    </ListItemIcon>
                    <ListItemText
                      primary="Type"
                      secondary={
                        <Chip
                          icon={getTypeIcon(selectedVerification.verificationType)}
                          label={getTypeLabel(selectedVerification.verificationType)}
                          color={getTypeColor(selectedVerification.verificationType) as any}
                          size="small"
                        />
                      }
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      {getResultIcon(selectedVerification.result)}
                    </ListItemIcon>
                    <ListItemText
                      primary="Result"
                      secondary={
                        <Chip
                          icon={getResultIcon(selectedVerification.result)}
                          label={selectedVerification.result.toUpperCase()}
                          color={getResultColor(selectedVerification.result) as any}
                          size="small"
                        />
                      }
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <TrendingUp />
                    </ListItemIcon>
                    <ListItemText
                      primary="Confidence"
                      secondary={
                        <Box display="flex" alignItems="center" gap={1}>
                          <LinearProgress
                            variant="determinate"
                            value={selectedVerification.confidence}
                            color={getResultColor(selectedVerification.result) as any}
                            sx={{ width: 100, height: 8 }}
                          />
                          <Typography variant="body2">
                            {selectedVerification.confidence}%
                          </Typography>
                        </Box>
                      }
                    />
                  </ListItem>
                </List>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Details
                </Typography>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="body1">
                    {selectedVerification.details}
                  </Typography>
                </Paper>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsDialogOpen(false)}>
            Close
          </Button>
          <Button
            variant="contained"
            startIcon={<Download />}
          >
            Download Report
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default VerificationHistory;