import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
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
  Tooltip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  Divider,
  Badge,
  Avatar,
  LinearProgress,
} from '@mui/material';
import {
  Search,
  LocationOn,
  Phone,
  Email,
  Business,
  LocalHospital,
  LocalPharmacy,
  Store,
  CheckCircle,
  Warning,
  Error,
  Schedule,
  Notifications,
  Map,
  FilterList,
  Refresh,
  Assignment,
  People,
  Inventory,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import { Icon } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchDistributionNodes, updateDistributionNodeStatus } from '../../store/recallSlice';
import { DistributionTrackerProps, DistributionNode } from '../../types';
import { format } from 'date-fns';

// Fix for default markers in react-leaflet
delete (Icon.Default.prototype as any)._getIconUrl;
Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const DistributionTracker: React.FC<DistributionTrackerProps> = ({
  nodes,
  affectedBatches,
  onNodeClick,
  onStatusUpdate,
  loading,
}) => {
  const dispatch = useAppDispatch();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedNode, setSelectedNode] = useState<DistributionNode | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState<DistributionNode['status']>('notified');
  const [mapView, setMapView] = useState(false);

  const filteredNodes = nodes.filter(node => {
    const matchesSearch = node.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         node.location.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         node.contactInfo.contactPerson.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = !typeFilter || node.type === typeFilter;
    const matchesStatus = !statusFilter || node.status === statusFilter;
    
    return matchesSearch && matchesType && matchesStatus;
  });

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleNodeClick = (node: DistributionNode) => {
    setSelectedNode(node);
    setDetailsDialogOpen(true);
    onNodeClick(node.id);
  };

  const handleStatusUpdate = async (nodeId: string, status: DistributionNode['status']) => {
    try {
      await dispatch(updateDistributionNodeStatus({ 
        recallId: 'current-recall', // This would come from props or context
        nodeId, 
        status 
      })).unwrap();
      onStatusUpdate(nodeId, status);
      setStatusDialogOpen(false);
    } catch (error) {
      console.error('Error updating node status:', error);
    }
  };

  const getTypeIcon = (type: DistributionNode['type']) => {
    switch (type) {
      case 'manufacturer': return <Business />;
      case 'distributor': return <Store />;
      case 'pharmacy': return <LocalPharmacy />;
      case 'hospital': return <LocalHospital />;
      case 'clinic': return <LocalHospital />;
      default: return <Business />;
    }
  };

  const getTypeColor = (type: DistributionNode['type']) => {
    switch (type) {
      case 'manufacturer': return 'primary';
      case 'distributor': return 'secondary';
      case 'pharmacy': return 'success';
      case 'hospital': return 'warning';
      case 'clinic': return 'info';
      default: return 'default';
    }
  };

  const getStatusColor = (status: DistributionNode['status']) => {
    switch (status) {
      case 'notified': return 'info';
      case 'responding': return 'warning';
      case 'completed': return 'success';
      case 'non_compliant': return 'error';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: DistributionNode['status']) => {
    switch (status) {
      case 'notified': return <Notifications />;
      case 'responding': return <Schedule />;
      case 'completed': return <CheckCircle />;
      case 'non_compliant': return <Error />;
      default: return <Info />;
    }
  };

  const getStatusProgress = (status: DistributionNode['status']) => {
    switch (status) {
      case 'notified': return 25;
      case 'responding': return 50;
      case 'completed': return 100;
      case 'non_compliant': return 0;
      default: return 0;
    }
  };

  const getAffectedBatchesCount = (node: DistributionNode) => {
    return node.affectedBatches.length;
  };

  const getComplianceRate = () => {
    const total = nodes.length;
    const compliant = nodes.filter(node => node.status === 'completed').length;
    return total > 0 ? Math.round((compliant / total) * 100) : 0;
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
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" component="h1">
          Distribution Tracker
        </Typography>
        <Box display="flex" gap={2}>
          <Button
            variant={mapView ? "contained" : "outlined"}
            startIcon={<Map />}
            onClick={() => setMapView(!mapView)}
          >
            {mapView ? 'List View' : 'Map View'}
          </Button>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={() => window.location.reload()}
          >
            Refresh
          </Button>
        </Box>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Total Nodes
                  </Typography>
                  <Typography variant="h4" fontWeight="bold">
                    {nodes.length}
                  </Typography>
                </Box>
                <People color="primary" sx={{ fontSize: 40 }} />
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
                    Compliance Rate
                  </Typography>
                  <Typography variant="h4" fontWeight="bold" color="success.main">
                    {getComplianceRate()}%
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
                    Responding
                  </Typography>
                  <Typography variant="h4" fontWeight="bold" color="warning.main">
                    {nodes.filter(n => n.status === 'responding').length}
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
                    Non-Compliant
                  </Typography>
                  <Typography variant="h4" fontWeight="bold" color="error.main">
                    {nodes.filter(n => n.status === 'non_compliant').length}
                  </Typography>
                </Box>
                <Error color="error" sx={{ fontSize: 40 }} />
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
              placeholder="Search nodes..."
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
              <InputLabel>Type</InputLabel>
              <Select
                value={typeFilter}
                label="Type"
                onChange={(e) => setTypeFilter(e.target.value)}
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="manufacturer">Manufacturer</MenuItem>
                <MenuItem value="distributor">Distributor</MenuItem>
                <MenuItem value="pharmacy">Pharmacy</MenuItem>
                <MenuItem value="hospital">Hospital</MenuItem>
                <MenuItem value="clinic">Clinic</MenuItem>
              </Select>
            </FormControl>
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
                <MenuItem value="notified">Notified</MenuItem>
                <MenuItem value="responding">Responding</MenuItem>
                <MenuItem value="completed">Completed</MenuItem>
                <MenuItem value="non_compliant">Non-Compliant</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={4}>
            <Button
              variant="outlined"
              startIcon={<FilterList />}
              onClick={() => {
                setSearchTerm('');
                setTypeFilter('');
                setStatusFilter('');
              }}
            >
              Clear Filters
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Map View */}
      {mapView ? (
        <Card sx={{ height: 600 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Distribution Map
            </Typography>
            <Box sx={{ height: 500, width: '100%' }}>
              <MapContainer
                center={[39.8283, -98.5795]} // Center of US
                zoom={4}
                style={{ height: '100%', width: '100%' }}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                {filteredNodes.map((node) => (
                  <Marker
                    key={node.id}
                    position={[node.location.latitude, node.location.longitude]}
                  >
                    <Popup>
                      <Box>
                        <Typography variant="h6">{node.name}</Typography>
                        <Typography variant="body2" color="textSecondary">
                          {node.type.toUpperCase()}
                        </Typography>
                        <Typography variant="body2">
                          {node.location.address}
                        </Typography>
                        <Chip
                          icon={getStatusIcon(node.status)}
                          label={node.status.replace('_', ' ').toUpperCase()}
                          color={getStatusColor(node.status) as any}
                          size="small"
                          sx={{ mt: 1 }}
                        />
                        <Box mt={1}>
                          <Button
                            size="small"
                            onClick={() => handleNodeClick(node)}
                          >
                            View Details
                          </Button>
                        </Box>
                      </Box>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            </Box>
          </CardContent>
        </Card>
      ) : (
        /* List View */
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Distribution Nodes ({filteredNodes.length})
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Node Details</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Location</TableCell>
                    <TableCell>Contact</TableCell>
                    <TableCell>Affected Batches</TableCell>
                    <TableCell>Progress</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <AnimatePresence>
                    {filteredNodes
                      .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                      .map((node, index) => (
                      <motion.tr
                        key={node.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ delay: index * 0.05 }}
                        style={{ display: 'table-row' }}
                      >
                        <TableCell>
                          <Box>
                            <Typography variant="subtitle2" fontWeight="bold">
                              {node.name}
                            </Typography>
                            <Typography variant="body2" color="textSecondary">
                              {node.contactInfo.contactPerson}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip
                            icon={getTypeIcon(node.type)}
                            label={node.type.toUpperCase()}
                            color={getTypeColor(node.type) as any}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            icon={getStatusIcon(node.status)}
                            label={node.status.replace('_', ' ').toUpperCase()}
                            color={getStatusColor(node.status) as any}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Box display="flex" alignItems="center" gap={1}>
                            <LocationOn fontSize="small" color="action" />
                            <Typography variant="body2">
                              {node.location.address}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box>
                            <Box display="flex" alignItems="center" gap={1}>
                              <Phone fontSize="small" color="action" />
                              <Typography variant="body2">
                                {node.contactInfo.phone}
                              </Typography>
                            </Box>
                            <Box display="flex" alignItems="center" gap={1}>
                              <Email fontSize="small" color="action" />
                              <Typography variant="body2">
                                {node.contactInfo.email}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Badge badgeContent={getAffectedBatchesCount(node)} color="primary">
                            <Inventory fontSize="small" color="action" />
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ width: 100 }}>
                            <LinearProgress
                              variant="determinate"
                              value={getStatusProgress(node.status)}
                              color={getStatusColor(node.status) as any}
                            />
                            <Typography variant="caption" color="textSecondary">
                              {getStatusProgress(node.status)}%
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Button
                            size="small"
                            onClick={() => handleNodeClick(node)}
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
              count={filteredNodes.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
            />
          </CardContent>
        </Card>
      )}

      {/* Node Details Dialog */}
      <Dialog
        open={detailsDialogOpen}
        onClose={() => setDetailsDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {selectedNode?.name} - Details
        </DialogTitle>
        <DialogContent>
          {selectedNode && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>
                  Basic Information
                </Typography>
                <List>
                  <ListItem>
                    <ListItemIcon>
                      <Business />
                    </ListItemIcon>
                    <ListItemText
                      primary="Type"
                      secondary={selectedNode.type.toUpperCase()}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <LocationOn />
                    </ListItemIcon>
                    <ListItemText
                      primary="Address"
                      secondary={selectedNode.location.address}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <Phone />
                    </ListItemIcon>
                    <ListItemText
                      primary="Phone"
                      secondary={selectedNode.contactInfo.phone}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <Email />
                    </ListItemIcon>
                    <ListItemText
                      primary="Email"
                      secondary={selectedNode.contactInfo.email}
                    />
                  </ListItem>
                </List>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>
                  Status & Progress
                </Typography>
                <Box mb={2}>
                  <Chip
                    icon={getStatusIcon(selectedNode.status)}
                    label={selectedNode.status.replace('_', ' ').toUpperCase()}
                    color={getStatusColor(selectedNode.status) as any}
                    sx={{ mb: 2 }}
                  />
                  <LinearProgress
                    variant="determinate"
                    value={getStatusProgress(selectedNode.status)}
                    color={getStatusColor(selectedNode.status) as any}
                    sx={{ mb: 2 }}
                  />
                </Box>
                <Typography variant="h6" gutterBottom>
                  Affected Batches ({selectedNode.affectedBatches.length})
                </Typography>
                <Box display="flex" flexWrap="wrap" gap={1}>
                  {selectedNode.affectedBatches.map((batchId, index) => (
                    <Chip
                      key={index}
                      label={batchId}
                      size="small"
                      variant="outlined"
                    />
                  ))}
                </Box>
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
          Update Status - {selectedNode?.name}
        </DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>New Status</InputLabel>
            <Select
              value={newStatus}
              label="New Status"
              onChange={(e) => setNewStatus(e.target.value as DistributionNode['status'])}
            >
              <MenuItem value="notified">
                <Box display="flex" alignItems="center" gap={1}>
                  <Notifications />
                  Notified
                </Box>
              </MenuItem>
              <MenuItem value="responding">
                <Box display="flex" alignItems="center" gap={1}>
                  <Schedule />
                  Responding
                </Box>
              </MenuItem>
              <MenuItem value="completed">
                <Box display="flex" alignItems="center" gap={1}>
                  <CheckCircle />
                  Completed
                </Box>
              </MenuItem>
              <MenuItem value="non_compliant">
                <Box display="flex" alignItems="center" gap={1}>
                  <Error />
                  Non-Compliant
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
            onClick={() => selectedNode && handleStatusUpdate(selectedNode.id, newStatus)}
          >
            Update Status
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DistributionTracker;