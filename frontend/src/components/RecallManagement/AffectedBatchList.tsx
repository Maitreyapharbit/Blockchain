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
  IconButton,
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
  Menu,
  ListItemIcon,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Badge,
  Avatar,
  Divider,
} from '@mui/material';
import {
  Search,
  FilterList,
  MoreVert,
  Visibility,
  Edit,
  Delete,
  Warning,
  CheckCircle,
  Error,
  Info,
  LocationOn,
  CalendarToday,
  Inventory,
  QrCode,
  Block,
  CheckCircleOutline,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchAffectedBatches, updateBatchStatus } from '../../store/recallSlice';
import { AffectedBatchListProps, Batch } from '../../types';
import { format } from 'date-fns';

const AffectedBatchList: React.FC<AffectedBatchListProps> = ({
  batches,
  recallId,
  onBatchSelect,
  onBatchAction,
  loading,
}) => {
  const dispatch = useAppDispatch();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [selectedBatches, setSelectedBatches] = useState<string[]>([]);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null);
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<string>('');

  useEffect(() => {
    if (recallId) {
      dispatch(fetchAffectedBatches(recallId));
    }
  }, [dispatch, recallId]);

  const filteredBatches = batches.filter(batch => {
    const matchesSearch = batch.batchNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         batch.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         batch.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !statusFilter || batch.status === statusFilter;
    const matchesLocation = !locationFilter || batch.location.toLowerCase().includes(locationFilter.toLowerCase());
    
    return matchesSearch && matchesStatus && matchesLocation;
  });

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleBatchSelect = (batch: Batch) => {
    onBatchSelect(batch.id);
  };

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, batch: Batch) => {
    setAnchorEl(event.currentTarget);
    setSelectedBatch(batch);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedBatch(null);
  };

  const handleActionClick = (action: string) => {
    if (selectedBatch) {
      setActionType(action);
      setActionDialogOpen(true);
    }
    handleMenuClose();
  };

  const handleConfirmAction = async () => {
    if (selectedBatch && actionType) {
      try {
        await dispatch(updateBatchStatus({ 
          id: selectedBatch.id, 
          status: actionType as Batch['status'] 
        })).unwrap();
        onBatchAction(selectedBatch.id, actionType);
        setActionDialogOpen(false);
      } catch (error) {
        console.error('Error updating batch status:', error);
      }
    }
  };

  const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      setSelectedBatches(filteredBatches.map(batch => batch.id));
    } else {
      setSelectedBatches([]);
    }
  };

  const handleSelectBatch = (batchId: string) => {
    setSelectedBatches(prev => 
      prev.includes(batchId) 
        ? prev.filter(id => id !== batchId)
        : [...prev, batchId]
    );
  };

  const getStatusColor = (status: Batch['status']) => {
    switch (status) {
      case 'active': return 'success';
      case 'recalled': return 'error';
      case 'quarantined': return 'warning';
      case 'destroyed': return 'default';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: Batch['status']) => {
    switch (status) {
      case 'active': return <CheckCircle />;
      case 'recalled': return <Error />;
      case 'quarantined': return <Warning />;
      case 'destroyed': return <Block />;
      default: return <Info />;
    }
  };

  const getStatusLabel = (status: Batch['status']) => {
    switch (status) {
      case 'active': return 'Active';
      case 'recalled': return 'Recalled';
      case 'quarantined': return 'Quarantined';
      case 'destroyed': return 'Destroyed';
      default: return status;
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

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress size={60} />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" component="h1" gutterBottom>
        Affected Batches
      </Typography>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              placeholder="Search batches..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} md={2}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                label="Status"
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="recalled">Recalled</MenuItem>
                <MenuItem value="quarantined">Quarantined</MenuItem>
                <MenuItem value="destroyed">Destroyed</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              placeholder="Filter by location..."
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LocationOn />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <Box display="flex" gap={1}>
              <Button
                variant="outlined"
                startIcon={<FilterList />}
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('');
                  setLocationFilter('');
                }}
              >
                Clear
              </Button>
              {selectedBatches.length > 0 && (
                <Button
                  variant="contained"
                  color="primary"
                  onClick={() => onBatchAction(selectedBatches[0], 'bulk_action')}
                >
                  Bulk Action ({selectedBatches.length})
                </Button>
              )}
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Batch List */}
      <Card>
        <CardContent>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell padding="checkbox">
                    <input
                      type="checkbox"
                      checked={selectedBatches.length === filteredBatches.length && filteredBatches.length > 0}
                      onChange={handleSelectAll}
                    />
                  </TableCell>
                  <TableCell>Batch Details</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Location</TableCell>
                  <TableCell>Quantity</TableCell>
                  <TableCell>Dates</TableCell>
                  <TableCell>Security Features</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <AnimatePresence>
                  {filteredBatches
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((batch, index) => (
                    <motion.tr
                      key={batch.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ delay: index * 0.05 }}
                      style={{ display: 'table-row' }}
                    >
                      <TableCell padding="checkbox">
                        <input
                          type="checkbox"
                          checked={selectedBatches.includes(batch.id)}
                          onChange={() => handleSelectBatch(batch.id)}
                        />
                      </TableCell>
                      <TableCell>
                        <Box>
                          <Typography variant="subtitle2" fontWeight="bold">
                            {batch.batchNumber}
                          </Typography>
                          <Typography variant="body2" color="textSecondary">
                            {batch.productName}
                          </Typography>
                          <Box display="flex" alignItems="center" gap={1} mt={0.5}>
                            <QrCode fontSize="small" color="action" />
                            <Typography variant="caption" color="textSecondary">
                              {batch.blockchainHash.slice(0, 8)}...
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          icon={getStatusIcon(batch.status)}
                          label={getStatusLabel(batch.status)}
                          color={getStatusColor(batch.status) as any}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={1}>
                          <LocationOn fontSize="small" color="action" />
                          <Typography variant="body2">
                            {batch.location}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={1}>
                          <Inventory fontSize="small" color="action" />
                          <Typography variant="body2">
                            {batch.quantity.toLocaleString()}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box>
                          <Typography variant="caption" color="textSecondary">
                            Manufactured
                          </Typography>
                          <Typography variant="body2">
                            {format(new Date(batch.manufacturingDate), 'MMM dd, yyyy')}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            Expires
                          </Typography>
                          <Typography variant="body2">
                            {format(new Date(batch.expiryDate), 'MMM dd, yyyy')}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box display="flex" flexWrap="wrap" gap={0.5}>
                          {batch.securityFeatures.slice(0, 2).map((feature, idx) => (
                            <Chip
                              key={idx}
                              label={feature.type.replace('_', ' ')}
                              size="small"
                              color={feature.verified ? 'success' : 'default'}
                              variant="outlined"
                            />
                          ))}
                          {batch.securityFeatures.length > 2 && (
                            <Chip
                              label={`+${batch.securityFeatures.length - 2}`}
                              size="small"
                              variant="outlined"
                            />
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box display="flex" gap={1}>
                          <Tooltip title="View Details">
                            <IconButton
                              size="small"
                              onClick={() => handleBatchSelect(batch)}
                            >
                              <Visibility />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="More Actions">
                            <IconButton
                              size="small"
                              onClick={(e) => handleMenuClick(e, batch)}
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
            count={filteredBatches.length}
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
        <MenuItem onClick={() => handleActionClick('quarantined')}>
          <ListItemIcon>
            <Warning />
          </ListItemIcon>
          <ListItemText>Quarantine</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleActionClick('recalled')}>
          <ListItemIcon>
            <Error />
          </ListItemIcon>
          <ListItemText>Mark as Recalled</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleActionClick('destroyed')}>
          <ListItemIcon>
            <Block />
          </ListItemIcon>
          <ListItemText>Mark as Destroyed</ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => handleBatchSelect(selectedBatch!)}>
          <ListItemIcon>
            <Visibility />
          </ListItemIcon>
          <ListItemText>View Details</ListItemText>
        </MenuItem>
      </Menu>

      {/* Action Confirmation Dialog */}
      <Dialog
        open={actionDialogOpen}
        onClose={() => setActionDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Confirm Action
        </DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to mark batch <strong>{selectedBatch?.batchNumber}</strong> as{' '}
            <strong>{getStatusLabel(actionType as Batch['status'])}</strong>?
          </Typography>
          {actionType === 'destroyed' && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              This action cannot be undone. The batch will be permanently marked as destroyed.
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setActionDialogOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirmAction}
            color="primary"
            variant="contained"
          >
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AffectedBatchList;