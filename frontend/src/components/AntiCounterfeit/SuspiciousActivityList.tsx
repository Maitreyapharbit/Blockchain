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
  ListItemSecondaryAction,
  Divider,
  Avatar,
  Badge,
  LinearProgress,
  Menu,
  ListItemButton,
} from '@mui/material';
import {
  Search,
  FilterList,
  Warning,
  Error,
  CheckCircle,
  Info,
  TrendingUp,
  TrendingDown,
  Schedule,
  LocationOn,
  Assignment,
  MoreVert,
  Visibility,
  Edit,
  Block,
  CheckCircleOutline,
  Refresh,
  Assessment,
  Security,
  BugReport,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
  fetchSuspiciousActivities,
  updateSuspiciousActivityStatus,
  setFilters,
  setPagination,
  clearError,
} from '../../store/counterfeitSlice';
import { SuspiciousActivityListProps, SuspiciousActivity } from '../../types';
import { format } from 'date-fns';

const SuspiciousActivityList: React.FC<SuspiciousActivityListProps> = ({
  activities,
  onActivityClick,
  onStatusUpdate,
  loading,
}) => {
  const dispatch = useAppDispatch();
  const { pagination, filters } = useAppSelector((state) => state.counterfeit);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState(filters.search);
  const [severityFilter, setSeverityFilter] = useState(filters.severity);
  const [statusFilter, setStatusFilter] = useState(filters.status);
  const [activityTypeFilter, setActivityTypeFilter] = useState(filters.activityType);
  const [selectedActivity, setSelectedActivity] = useState<SuspiciousActivity | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState<SuspiciousActivity['status']>('new');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedActivityId, setSelectedActivityId] = useState<string | null>(null);

  useEffect(() => {
    dispatch(fetchSuspiciousActivities());
  }, [dispatch]);

  const filteredActivities = activities.filter(activity => {
    const matchesSearch = !searchTerm || 
      activity.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      activity.batchId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSeverity = !severityFilter || activity.severity === severityFilter;
    const matchesStatus = !statusFilter || activity.status === statusFilter;
    const matchesActivityType = !activityTypeFilter || activity.activityType === activityTypeFilter;
    
    return matchesSearch && matchesSeverity && matchesStatus && matchesActivityType;
  });

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
    dispatch(setPagination({ page: newPage + 1 }));
    dispatch(fetchSuspiciousActivities({ 
      page: newPage + 1, 
      limit: rowsPerPage,
      severity: severityFilter,
      status: statusFilter,
      activityType: activityTypeFilter,
    }));
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newRowsPerPage = parseInt(event.target.value, 10);
    setRowsPerPage(newRowsPerPage);
    setPage(0);
    dispatch(setPagination({ page: 1, limit: newRowsPerPage }));
    dispatch(fetchSuspiciousActivities({ 
      page: 1, 
      limit: newRowsPerPage,
      severity: severityFilter,
      status: statusFilter,
      activityType: activityTypeFilter,
    }));
  };

  const handleSearch = () => {
    dispatch(setFilters({ search: searchTerm }));
    dispatch(fetchSuspiciousActivities({ 
      page: 1, 
      limit: rowsPerPage,
      severity: severityFilter,
      status: statusFilter,
      activityType: activityTypeFilter,
    }));
  };

  const handleFilterChange = (filterType: string, value: string) => {
    if (filterType === 'severity') {
      setSeverityFilter(value);
      dispatch(setFilters({ severity: value }));
    } else if (filterType === 'status') {
      setStatusFilter(value);
      dispatch(setFilters({ status: value }));
    } else if (filterType === 'activityType') {
      setActivityTypeFilter(value);
      dispatch(setFilters({ activityType: value }));
    }
    
    dispatch(fetchSuspiciousActivities({ 
      page: 1, 
      limit: rowsPerPage,
      severity: filterType === 'severity' ? value : severityFilter,
      status: filterType === 'status' ? value : statusFilter,
      activityType: filterType === 'activityType' ? value : activityTypeFilter,
    }));
  };

  const handleActivityClick = (activity: SuspiciousActivity) => {
    setSelectedActivity(activity);
    setDetailsDialogOpen(true);
    onActivityClick(activity.id);
  };

  const handleStatusUpdate = async (activityId: string, status: SuspiciousActivity['status']) => {
    try {
      await dispatch(updateSuspiciousActivityStatus({ id: activityId, status })).unwrap();
      onStatusUpdate(activityId, status);
      setStatusDialogOpen(false);
    } catch (error) {
      console.error('Error updating activity status:', error);
    }
  };

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, activityId: string) => {
    setAnchorEl(event.currentTarget);
    setSelectedActivityId(activityId);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedActivityId(null);
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
      case 'new': return 'info';
      case 'investigating': return 'warning';
      case 'resolved': return 'success';
      case 'false_positive': return 'default';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'new': return <Info />;
      case 'investigating': return <Schedule />;
      case 'resolved': return <CheckCircle />;
      case 'false_positive': return <Block />;
      default: return <Info />;
    }
  };

  const getActivityTypeIcon = (type: string) => {
    switch (type) {
      case 'unusual_pattern': return <TrendingUp />;
      case 'failed_verification': return <Error />;
      case 'location_mismatch': return <LocationOn />;
      case 'timing_anomaly': return <Schedule />;
      default: return <Info />;
    }
  };

  const getActivityTypeColor = (type: string) => {
    switch (type) {
      case 'unusual_pattern': return 'primary';
      case 'failed_verification': return 'error';
      case 'location_mismatch': return 'warning';
      case 'timing_anomaly': return 'info';
      default: return 'default';
    }
  };

  const getActivityTypeLabel = (type: string) => {
    switch (type) {
      case 'unusual_pattern': return 'Unusual Pattern';
      case 'failed_verification': return 'Failed Verification';
      case 'location_mismatch': return 'Location Mismatch';
      case 'timing_anomaly': return 'Timing Anomaly';
      default: return type;
    }
  };

  const getTimeAgo = (timestamp: string) => {
    const now = new Date();
    const activityTime = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - activityTime.getTime()) / (1000 * 60));
    
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

  const getActivityStats = () => {
    const total = activities.length;
    const newCount = activities.filter(a => a.status === 'new').length;
    const investigatingCount = activities.filter(a => a.status === 'investigating').length;
    const resolvedCount = activities.filter(a => a.status === 'resolved').length;
    const falsePositiveCount = activities.filter(a => a.status === 'false_positive').length;
    
    return { total, newCount, investigatingCount, resolvedCount, falsePositiveCount };
  };

  const stats = getActivityStats();

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
        Suspicious Activities
      </Typography>

      {/* Stats Cards */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Total Activities
                  </Typography>
                  <Typography variant="h4" fontWeight="bold">
                    {stats.total}
                  </Typography>
                </Box>
                <BugReport color="primary" sx={{ fontSize: 40 }} />
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
                    New
                  </Typography>
                  <Typography variant="h4" fontWeight="bold" color="info.main">
                    {stats.newCount}
                  </Typography>
                </Box>
                <Info color="info" sx={{ fontSize: 40 }} />
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
                    Investigating
                  </Typography>
                  <Typography variant="h4" fontWeight="bold" color="warning.main">
                    {stats.investigatingCount}
                  </Typography>
                </Box>
                <Schedule color="warning" sx={{ fontSize: 40 }} />
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
                    Resolved
                  </Typography>
                  <Typography variant="h4" fontWeight="bold" color="success.main">
                    {stats.resolvedCount}
                  </Typography>
                </Box>
                <CheckCircle color="success" sx={{ fontSize: 40 }} />
              </Box>
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
              placeholder="Search activities..."
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
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                label="Status"
                onChange={(e) => handleFilterChange('status', e.target.value)}
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="new">New</MenuItem>
                <MenuItem value="investigating">Investigating</MenuItem>
                <MenuItem value="resolved">Resolved</MenuItem>
                <MenuItem value="false_positive">False Positive</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <FormControl fullWidth>
              <InputLabel>Type</InputLabel>
              <Select
                value={activityTypeFilter}
                label="Type"
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

      {/* Activities Table */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Suspicious Activities ({filteredActivities.length})
          </Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Activity Details</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Severity</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Detected</TableCell>
                  <TableCell>Location</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <AnimatePresence>
                  {filteredActivities
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((activity, index) => (
                    <motion.tr
                      key={activity.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ delay: index * 0.05 }}
                      style={{ display: 'table-row' }}
                    >
                      <TableCell>
                        <Box>
                          <Typography variant="subtitle2" fontWeight="bold">
                            {activity.description}
                          </Typography>
                          <Typography variant="body2" color="textSecondary">
                            Batch: {activity.batchId}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            {getTimeAgo(activity.detectedAt)}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          icon={getActivityTypeIcon(activity.activityType)}
                          label={getActivityTypeLabel(activity.activityType)}
                          color={getActivityTypeColor(activity.activityType) as any}
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
                          icon={getStatusIcon(activity.status)}
                          label={activity.status.replace('_', ' ').toUpperCase()}
                          color={getStatusColor(activity.status) as any}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {format(new Date(activity.detectedAt), 'MMM dd, yyyy')}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          {format(new Date(activity.detectedAt), 'HH:mm')}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {activity.location ? (
                          <Box display="flex" alignItems="center" gap={1}>
                            <LocationOn fontSize="small" color="action" />
                            <Typography variant="body2">
                              {activity.location.address}
                            </Typography>
                          </Box>
                        ) : (
                          <Typography variant="body2" color="textSecondary">
                            N/A
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Box display="flex" gap={1}>
                          <Tooltip title="View Details">
                            <IconButton
                              size="small"
                              onClick={() => handleActivityClick(activity)}
                            >
                              <Visibility />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="More Actions">
                            <IconButton
                              size="small"
                              onClick={(e) => handleMenuClick(e, activity.id)}
                            >
                              <MoreVert />
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
            count={filteredActivities.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </CardContent>
      </Card>

      {/* Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => {
          setSelectedActivity(activities.find(a => a.id === selectedActivityId)!);
          setNewStatus('investigating');
          setStatusDialogOpen(true);
          handleMenuClose();
        }}>
          <ListItemIcon>
            <Schedule />
          </ListItemIcon>
          <ListItemText>Mark as Investigating</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => {
          setSelectedActivity(activities.find(a => a.id === selectedActivityId)!);
          setNewStatus('resolved');
          setStatusDialogOpen(true);
          handleMenuClose();
        }}>
          <ListItemIcon>
            <CheckCircle />
          </ListItemIcon>
          <ListItemText>Mark as Resolved</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => {
          setSelectedActivity(activities.find(a => a.id === selectedActivityId)!);
          setNewStatus('false_positive');
          setStatusDialogOpen(true);
          handleMenuClose();
        }}>
          <ListItemIcon>
            <Block />
          </ListItemIcon>
          <ListItemText>Mark as False Positive</ListItemText>
        </MenuItem>
      </Menu>

      {/* Activity Details Dialog */}
      <Dialog
        open={detailsDialogOpen}
        onClose={() => setDetailsDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Activity Details
        </DialogTitle>
        <DialogContent>
          {selectedActivity && (
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
                      primary="Description"
                      secondary={selectedActivity.description}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <Assignment />
                    </ListItemIcon>
                    <ListItemText
                      primary="Batch ID"
                      secondary={selectedActivity.batchId}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <Schedule />
                    </ListItemIcon>
                    <ListItemText
                      primary="Detected At"
                      secondary={format(new Date(selectedActivity.detectedAt), 'MMM dd, yyyy HH:mm')}
                    />
                  </ListItem>
                </List>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>
                  Classification
                </Typography>
                <List>
                  <ListItem>
                    <ListItemIcon>
                      <BugReport />
                    </ListItemIcon>
                    <ListItemText
                      primary="Activity Type"
                      secondary={
                        <Chip
                          icon={getActivityTypeIcon(selectedActivity.activityType)}
                          label={getActivityTypeLabel(selectedActivity.activityType)}
                          color={getActivityTypeColor(selectedActivity.activityType) as any}
                          size="small"
                        />
                      }
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <Warning />
                    </ListItemIcon>
                    <ListItemText
                      primary="Severity"
                      secondary={
                        <Chip
                          icon={getSeverityIcon(selectedActivity.severity)}
                          label={selectedActivity.severity.toUpperCase()}
                          color={getSeverityColor(selectedActivity.severity) as any}
                          size="small"
                        />
                      }
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <CheckCircle />
                    </ListItemIcon>
                    <ListItemText
                      primary="Status"
                      secondary={
                        <Chip
                          icon={getStatusIcon(selectedActivity.status)}
                          label={selectedActivity.status.replace('_', ' ').toUpperCase()}
                          color={getStatusColor(selectedActivity.status) as any}
                          size="small"
                        />
                      }
                    />
                  </ListItem>
                </List>
              </Grid>
              {selectedActivity.location && (
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom>
                    Location Information
                  </Typography>
                  <List>
                    <ListItem>
                      <ListItemIcon>
                        <LocationOn />
                      </ListItemIcon>
                      <ListItemText
                        primary="Address"
                        secondary={selectedActivity.location.address}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <LocationOn />
                      </ListItemIcon>
                      <ListItemText
                        primary="Coordinates"
                        secondary={`${selectedActivity.location.latitude}, ${selectedActivity.location.longitude}`}
                      />
                    </ListItem>
                  </List>
                </Grid>
              )}
              {selectedActivity.metadata && Object.keys(selectedActivity.metadata).length > 0 && (
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom>
                    Metadata
                  </Typography>
                  <Paper sx={{ p: 2 }}>
                    <pre style={{ fontSize: '12px', overflow: 'auto' }}>
                      {JSON.stringify(selectedActivity.metadata, null, 2)}
                    </pre>
                  </Paper>
                </Grid>
              )}
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsDialogOpen(false)}>
            Close
          </Button>
          <Button
            variant="contained"
            onClick={() => {
              setDetailsDialogOpen(false);
              setStatusDialogOpen(true);
            }}
          >
            Update Status
          </Button>
        </DialogActions>
      </Dialog>

      {/* Status Update Dialog */}
      <Dialog
        open={statusDialogOpen}
        onClose={() => setStatusDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Update Activity Status
        </DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>New Status</InputLabel>
            <Select
              value={newStatus}
              label="New Status"
              onChange={(e) => setNewStatus(e.target.value as SuspiciousActivity['status'])}
            >
              <MenuItem value="new">
                <Box display="flex" alignItems="center" gap={1}>
                  <Info />
                  New
                </Box>
              </MenuItem>
              <MenuItem value="investigating">
                <Box display="flex" alignItems="center" gap={1}>
                  <Schedule />
                  Investigating
                </Box>
              </MenuItem>
              <MenuItem value="resolved">
                <Box display="flex" alignItems="center" gap={1}>
                  <CheckCircle />
                  Resolved
                </Box>
              </MenuItem>
              <MenuItem value="false_positive">
                <Box display="flex" alignItems="center" gap={1}>
                  <Block />
                  False Positive
                </Box>
              </MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStatusDialogOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={() => selectedActivity && handleStatusUpdate(selectedActivity.id, newStatus)}
          >
            Update Status
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SuspiciousActivityList;