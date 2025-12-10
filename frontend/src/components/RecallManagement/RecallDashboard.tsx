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
  Notifications,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
  fetchRecalls,
  fetchRecallStats,
  setFilters,
  setPagination,
  clearError,
} from '../../store/recallSlice';
import { RecallDashboardProps } from '../../types';
import RecallStatusCard from './RecallStatusCard';
import { format } from 'date-fns';

const RecallDashboard: React.FC<RecallDashboardProps> = ({
  recalls,
  loading,
  error,
  onRefresh,
  onRecallClick,
}) => {
  const dispatch = useAppDispatch();
  const { stats, pagination, filters } = useAppSelector((state) => state.recall);
  const [searchTerm, setSearchTerm] = useState(filters.search);
  const [statusFilter, setStatusFilter] = useState(filters.status);
  const [severityFilter, setSeverityFilter] = useState(filters.severity);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    dispatch(fetchRecalls({}));
    dispatch(fetchRecallStats());
  }, [dispatch]);

  const handleSearch = () => {
    dispatch(setFilters({ search: searchTerm }));
    dispatch(fetchRecalls({ 
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
    }
    
    dispatch(fetchRecalls({ 
      page: 1, 
      limit: rowsPerPage, 
      search: searchTerm,
      status: filterType === 'status' ? value : statusFilter,
      severity: filterType === 'severity' ? value : severityFilter,
    }));
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
    dispatch(setPagination({ page: newPage + 1 }));
    dispatch(fetchRecalls({ 
      page: newPage + 1, 
      limit: rowsPerPage,
      search: searchTerm,
      status: statusFilter,
      severity: severityFilter,
    }));
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newRowsPerPage = parseInt(event.target.value, 10);
    setRowsPerPage(newRowsPerPage);
    setPage(0);
    dispatch(setPagination({ page: 1, limit: newRowsPerPage }));
    dispatch(fetchRecalls({ 
      page: 1, 
      limit: newRowsPerPage,
      search: searchTerm,
      status: statusFilter,
      severity: severityFilter,
    }));
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'success';
      case 'in_progress': return 'warning';
      case 'initiated': return 'info';
      case 'cancelled': return 'error';
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

  if (loading && recalls.length === 0) {
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
          Recall Management Dashboard
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
            New Recall
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
                        Total Recalls
                      </Typography>
                      <Typography variant="h4" fontWeight="bold">
                        {stats.total}
                      </Typography>
                    </Box>
                    <Assessment color="primary" sx={{ fontSize: 40 }} />
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
                        Active Recalls
                      </Typography>
                      <Typography variant="h4" fontWeight="bold" color="warning.main">
                        {stats.active}
                      </Typography>
                    </Box>
                    <Warning color="warning" sx={{ fontSize: 40 }} />
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
                        Completed
                      </Typography>
                      <Typography variant="h4" fontWeight="bold" color="success.main">
                        {stats.completed}
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
                        Critical
                      </Typography>
                      <Typography variant="h4" fontWeight="bold" color="error.main">
                        {stats.bySeverity.critical || 0}
                      </Typography>
                    </Box>
                    <Error color="error" sx={{ fontSize: 40 }} />
                  </Box>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>
        </Grid>
      )}

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              placeholder="Search recalls..."
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
                <MenuItem value="initiated">Initiated</MenuItem>
                <MenuItem value="in_progress">In Progress</MenuItem>
                <MenuItem value="completed">Completed</MenuItem>
                <MenuItem value="cancelled">Cancelled</MenuItem>
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
                setStatusFilter('');
                setSeverityFilter('');
                dispatch(setFilters({ search: '', status: '', severity: '' }));
                dispatch(fetchRecalls({}));
              }}
              fullWidth
            >
              Clear
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Recalls Table */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Recent Recalls
          </Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Title</TableCell>
                  <TableCell>Severity</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Initiated By</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Affected Batches</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <AnimatePresence>
                  {recalls.map((recall, index) => (
                    <motion.tr
                      key={recall.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ delay: index * 0.1 }}
                      style={{ display: 'table-row' }}
                    >
                      <TableCell>
                        <Typography variant="subtitle2" fontWeight="bold">
                          {recall.title}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          {recall.description}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          icon={getSeverityIcon(recall.severity)}
                          label={recall.severity.toUpperCase()}
                          color={getSeverityColor(recall.severity) as any}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={recall.status.replace('_', ' ').toUpperCase()}
                          color={getStatusColor(recall.status) as any}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{recall.initiatedBy}</TableCell>
                      <TableCell>
                        {format(new Date(recall.initiatedDate), 'MMM dd, yyyy')}
                      </TableCell>
                      <TableCell>
                        <Badge badgeContent={recall.affectedBatches.length} color="primary">
                          <Typography variant="body2">
                            {recall.affectedBatches.length} batches
                          </Typography>
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          size="small"
                          onClick={() => onRecallClick(recall.id)}
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

      {/* Floating Action Button */}
      <Tooltip title="Create New Recall">
        <Fab
          color="primary"
          sx={{
            position: 'fixed',
            bottom: 16,
            right: 16,
          }}
        >
          <Add />
        </Fab>
      </Tooltip>
    </Box>
  );
};

export default RecallDashboard;