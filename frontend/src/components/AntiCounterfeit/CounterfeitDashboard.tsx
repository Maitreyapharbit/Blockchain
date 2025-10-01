import React, { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  IconButton,
  Button,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Alert,
  CircularProgress,
  Fab,
  Tooltip,
  Badge,
  Avatar,
  LinearProgress,
} from '@mui/material';
import {
  Search,
  FilterList,
  Refresh,
  Add,
  Warning,
  Error,
  CheckCircle,
  Info,
  TrendingUp,
  TrendingDown,
  Assessment,
  BugReport,
  VerifiedUser,
  Security,
  QrCode,
  CameraAlt,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
  fetchReports,
  fetchSuspiciousActivities,
  fetchCounterfeitStats,
  setFilters,
  setPagination,
  clearError,
} from '../../store/counterfeitSlice';
import { CounterfeitDashboardProps } from '../../types';
import { format } from 'date-fns';

const CounterfeitDashboard: React.FC<CounterfeitDashboardProps> = ({
  reports,
  activities,
  loading,
  error,
  onRefresh,
  onReportClick,
}) => {
  const dispatch = useAppDispatch();
  const { stats, pagination, filters } = useAppSelector((state) => state.counterfeit);
  const [searchTerm, setSearchTerm] = useState(filters.search);
  const [statusFilter, setStatusFilter] = useState(filters.status);
  const [severityFilter, setSeverityFilter] = useState(filters.severity);
  const [activityTypeFilter, setActivityTypeFilter] = useState(filters.activityType);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    dispatch(fetchReports());
    dispatch(fetchSuspiciousActivities());
    dispatch(fetchCounterfeitStats());
  }, [dispatch]);

  const handleSearch = () => {
    dispatch(setFilters({ search: searchTerm }));
    dispatch(fetchReports({ 
      page: 1, 
      limit: rowsPerPage, 
      search: searchTerm,
      status: statusFilter,
      severity: severityFilter,
    }));
  };

  const handleFilterChange = (filterType: string, value: string) => {
    if (filterType === 'status') {
      setStatusFilter(value);
      dispatch(setFilters({ status: value }));
    } else if (filterType === 'severity') {
      setSeverityFilter(value);
      dispatch(setFilters({ severity: value }));
    } else if (filterType === 'activityType') {
      setActivityTypeFilter(value);
      dispatch(setFilters({ activityType: value }));
    }
    
    if (activeTab === 0) {
      dispatch(fetchReports({ 
        page: 1, 
        limit: rowsPerPage, 
        search: searchTerm,
        status: filterType === 'status' ? value : statusFilter,
        severity: filterType === 'severity' ? value : severityFilter,
      }));
    } else {
      dispatch(fetchSuspiciousActivities({ 
        page: 1, 
        limit: rowsPerPage, 
        activityType: filterType === 'activityType' ? value : activityTypeFilter,
        severity: filterType === 'severity' ? value : severityFilter,
      }));
    }
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
    dispatch(setPagination({ page: newPage + 1 }));
    if (activeTab === 0) {
      dispatch(fetchReports({ 
        page: newPage + 1, 
        limit: rowsPerPage,
        search: searchTerm,
        status: statusFilter,
        severity: severityFilter,
      }));
    } else {
      dispatch(fetchSuspiciousActivities({ 
        page: newPage + 1, 
        limit: rowsPerPage,
        activityType: activityTypeFilter,
        severity: severityFilter,
      }));
    }
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newRowsPerPage = parseInt(event.target.value, 10);
    setRowsPerPage(newRowsPerPage);
    setPage(0);
    dispatch(setPagination({ page: 1, limit: newRowsPerPage }));
    if (activeTab === 0) {
      dispatch(fetchReports({ 
        page: 1, 
        limit: newRowsPerPage,
        search: searchTerm,
        status: statusFilter,
        severity: severityFilter,
      }));
    } else {
      dispatch(fetchSuspiciousActivities({ 
        page: 1, 
        limit: newRowsPerPage,
        activityType: activityTypeFilter,
        severity: severityFilter,
      }));
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified': return 'success';
      case 'investigating': return 'warning';
      case 'pending': return 'info';
      case 'false_positive': return 'default';
      case 'resolved': return 'success';
      default: return 'default';
    }
  };

  const getActivityTypeIcon = (type: string) => {
    switch (type) {
      case 'unusual_pattern': return <TrendingUp />;
      case 'failed_verification': return <Error />;
      case 'location_mismatch': return <Warning />;
      case 'timing_anomaly': return <Schedule />;
      default: return <Info />;
    }
  };

  if (loading && reports.length === 0 && activities.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress size={60} />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1" fontWeight="bold">
          Anti-Counterfeit Dashboard
        </Typography>
        <Box display="flex" gap={2}>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={onRefresh}
            disabled={loading}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<Add />}
            color="primary"
          >
            New Report
          </Button>
        </Box>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert 
          severity="error" 
          sx={{ mb: 3 }}
          onClose={() => dispatch(clearError())}
        >
          {error}
        </Alert>
      )}

      {/* Stats Cards */}
      {stats && (
        <Grid container spacing={3} mb={4}>
          <Grid item xs={12} sm={6} md={3}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Box>
                      <Typography color="textSecondary" gutterBottom>
                        Total Reports
                      </Typography>
                      <Typography variant="h4" fontWeight="bold">
                        {stats.totalReports}
                      </Typography>
                    </Box>
                    <BugReport color="primary" sx={{ fontSize: 40 }} />
                  </Box>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Box>
                      <Typography color="textSecondary" gutterBottom>
                        Verified Counterfeits
                      </Typography>
                      <Typography variant="h4" fontWeight="bold" color="error.main">
                        {stats.verifiedCounterfeits}
                      </Typography>
                    </Box>
                    <Error color="error" sx={{ fontSize: 40 }} />
                  </Box>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Box>
                      <Typography color="textSecondary" gutterBottom>
                        False Positives
                      </Typography>
                      <Typography variant="h4" fontWeight="bold" color="success.main">
                        {stats.falsePositives}
                      </Typography>
                    </Box>
                    <CheckCircle color="success" sx={{ fontSize: 40 }} />
                  </Box>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Box>
                      <Typography color="textSecondary" gutterBottom>
                        Pending Investigation
                      </Typography>
                      <Typography variant="h4" fontWeight="bold" color="warning.main">
                        {stats.pendingInvestigation}
                      </Typography>
                    </Box>
                    <Warning color="warning" sx={{ fontSize: 40 }} />
                  </Box>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>
        </Grid>
      )}

      {/* Verification Stats */}
      {stats?.verificationStats && (
        <Grid container spacing={3} mb={4}>
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Verification Statistics
                </Typography>
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={3}>
                    <Box textAlign="center">
                      <Typography variant="h3" fontWeight="bold" color="primary">
                        {stats.verificationStats.totalVerifications}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Total Verifications
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={3}>
                    <Box textAlign="center">
                      <Typography variant="h3" fontWeight="bold" color="success.main">
                        {stats.verificationStats.authenticCount}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Authentic
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={3}>
                    <Box textAlign="center">
                      <Typography variant="h3" fontWeight="bold" color="error.main">
                        {stats.verificationStats.counterfeitCount}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Counterfeit
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={3}>
                    <Box textAlign="center">
                      <Typography variant="h3" fontWeight="bold" color="warning.main">
                        {stats.verificationStats.suspiciousCount}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Suspicious
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              placeholder="Search reports and activities..."
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
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                label="Status"
                onChange={(e) => handleFilterChange('status', e.target.value)}
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="investigating">Investigating</MenuItem>
                <MenuItem value="verified">Verified</MenuItem>
                <MenuItem value="false_positive">False Positive</MenuItem>
                <MenuItem value="resolved">Resolved</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <FormControl fullWidth>
              <InputLabel>Severity</InputLabel>
              <Select
                value={severityFilter}
                label="Severity"
                onChange={(e) => handleFilterChange('severity', e.target.value)}
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="low">Low</MenuItem>
                <MenuItem value="medium">Medium</MenuItem>
                <MenuItem value="high">High</MenuItem>
                <MenuItem value="critical">Critical</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <FormControl fullWidth>
              <InputLabel>Activity Type</InputLabel>
              <Select
                value={activityTypeFilter}
                label="Activity Type"
                onChange={(e) => handleFilterChange('activityType', e.target.value)}
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="unusual_pattern">Unusual Pattern</MenuItem>
                <MenuItem value="failed_verification">Failed Verification</MenuItem>
                <MenuItem value="location_mismatch">Location Mismatch</MenuItem>
                <MenuItem value="timing_anomaly">Timing Anomaly</MenuItem>
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
        </Grid>
      </Paper>

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Box display="flex">
            <Button
              variant={activeTab === 0 ? 'contained' : 'text'}
              onClick={() => setActiveTab(0)}
              startIcon={<BugReport />}
              sx={{ mr: 2 }}
            >
              Counterfeit Reports ({reports.length})
            </Button>
            <Button
              variant={activeTab === 1 ? 'contained' : 'text'}
              onClick={() => setActiveTab(1)}
              startIcon={<Security />}
            >
              Suspicious Activities ({activities.length})
            </Button>
          </Box>
        </Box>
      </Paper>

      {/* Content */}
      {activeTab === 0 ? (
        /* Counterfeit Reports Table */
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Counterfeit Reports
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Report Details</TableCell>
                    <TableCell>Severity</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Reported By</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell>Evidence</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <AnimatePresence>
                    {reports.map((report, index) => (
                      <motion.tr
                        key={report.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ delay: index * 0.1 }}
                        style={{ display: 'table-row' }}
                      >
                        <TableCell>
                          <Typography variant="subtitle2" fontWeight="bold">
                            {report.productName}
                          </Typography>
                          <Typography variant="body2" color="textSecondary">
                            Batch: {report.batchId}
                          </Typography>
                          <Typography variant="body2" color="textSecondary">
                            {report.description}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            icon={getSeverityIcon(report.severity)}
                            label={report.severity.toUpperCase()}
                            color={getSeverityColor(report.severity) as any}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={report.status.replace('_', ' ').toUpperCase()}
                            color={getStatusColor(report.status) as any}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>{report.reportedBy}</TableCell>
                        <TableCell>
                          {format(new Date(report.reportDate), 'MMM dd, yyyy')}
                        </TableCell>
                        <TableCell>
                          <Badge badgeContent={report.evidence.length} color="primary">
                            <Assignment />
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            size="small"
                            onClick={() => onReportClick(report.id)}
                          >
                            View Details
                          </Button>
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
              count={pagination.total}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
            />
          </CardContent>
        </Card>
      ) : (
        /* Suspicious Activities Table */
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Suspicious Activities
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Activity Details</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Severity</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Detected At</TableCell>
                    <TableCell>Location</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <AnimatePresence>
                    {activities.map((activity, index) => (
                      <motion.tr
                        key={activity.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ delay: index * 0.1 }}
                        style={{ display: 'table-row' }}
                      >
                        <TableCell>
                          <Typography variant="subtitle2" fontWeight="bold">
                            {activity.description}
                          </Typography>
                          <Typography variant="body2" color="textSecondary">
                            Batch: {activity.batchId}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            icon={getActivityTypeIcon(activity.activityType)}
                            label={activity.activityType.replace('_', ' ').toUpperCase()}
                            color="primary"
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            icon={getSeverityIcon(activity.severity)}
                            label={activity.severity.toUpperCase()}
                            color={getSeverityColor(activity.severity) as any}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={activity.status.replace('_', ' ').toUpperCase()}
                            color={getStatusColor(activity.status) as any}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          {format(new Date(activity.detectedAt), 'MMM dd, yyyy HH:mm')}
                        </TableCell>
                        <TableCell>
                          {activity.location ? activity.location.address : 'N/A'}
                        </TableCell>
                        <TableCell>
                          <Button
                            size="small"
                            onClick={() => onReportClick(activity.id)}
                          >
                            View Details
                          </Button>
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
              count={pagination.total}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
            />
          </CardContent>
        </Card>
      )}

      {/* Floating Action Buttons */}
      <Box sx={{ position: 'fixed', bottom: 16, right: 16, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Tooltip title="Scan QR Code">
          <Fab color="primary" size="medium">
            <QrCode />
          </Fab>
        </Tooltip>
        <Tooltip title="Take Photo">
          <Fab color="secondary" size="medium">
            <CameraAlt />
          </Fab>
        </Tooltip>
        <Tooltip title="New Report">
          <Fab color="error" size="large">
            <Add />
          </Fab>
        </Tooltip>
      </Box>
    </Box>
  );
};

export default CounterfeitDashboard;