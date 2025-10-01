import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  IconButton,
  Button,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  Chip,
  Badge,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Divider,
  Avatar,
  Tooltip,
  Switch,
  FormControlLabel,
} from '@mui/material';
import {
  Search,
  FilterList,
  Notifications,
  NotificationsActive,
  NotificationsOff,
  MarkEmailRead,
  Delete,
  Warning,
  Error,
  Info,
  CheckCircle,
  Assignment,
  BugReport,
  VerifiedUser,
  SystemUpdate,
  Refresh,
  Settings,
  Clear,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
  fetchNotifications,
  markNotificationAsRead,
  markAllAsRead,
  deleteNotification,
  clearAllNotifications,
  setFilters,
  setRealTimeEnabled,
} from '../../store/notificationSlice';
import { NotificationCenterProps, Notification } from '../../types';
import { formatNotificationTime, getSeverityColor, getSeverityIcon } from '../../utils/notificationService';
import { format } from 'date-fns';

const NotificationCenter: React.FC<NotificationCenterProps> = ({
  notifications,
  onMarkAsRead,
  onActionClick,
  loading,
}) => {
  const dispatch = useAppDispatch();
  const { 
    unreadCount, 
    filters, 
    realTimeEnabled, 
    connectionStatus 
  } = useAppSelector((state) => state.notification);
  
  const [searchTerm, setSearchTerm] = useState(filters.search);
  const [typeFilter, setTypeFilter] = useState(filters.type);
  const [severityFilter, setSeverityFilter] = useState(filters.severity);
  const [readFilter, setReadFilter] = useState(filters.read);
  const [selectedTab, setSelectedTab] = useState(0);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);

  useEffect(() => {
    dispatch(fetchNotifications());
  }, [dispatch]);

  const filteredNotifications = notifications.filter(notification => {
    const matchesSearch = !searchTerm || 
      notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notification.message.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = !typeFilter || notification.type === typeFilter;
    const matchesSeverity = !severityFilter || notification.severity === severityFilter;
    const matchesRead = readFilter === null || notification.read === readFilter;
    
    return matchesSearch && matchesType && matchesSeverity && matchesRead;
  });

  const unreadNotifications = filteredNotifications.filter(n => !n.read);
  const readNotifications = filteredNotifications.filter(n => n.read);

  const handleSearch = () => {
    dispatch(setFilters({ 
      search: searchTerm,
      type: typeFilter,
      severity: severityFilter,
      read: readFilter,
    }));
    dispatch(fetchNotifications());
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await dispatch(markNotificationAsRead(notificationId)).unwrap();
      onMarkAsRead(notificationId);
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await dispatch(markAllAsRead()).unwrap();
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const handleDeleteNotification = async (notificationId: string) => {
    try {
      await dispatch(deleteNotification(notificationId)).unwrap();
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const handleClearAll = async () => {
    try {
      await dispatch(clearAllNotifications()).unwrap();
    } catch (error) {
      console.error('Error clearing all notifications:', error);
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    setSelectedNotification(notification);
    setDetailsDialogOpen(true);
    
    if (!notification.read) {
      handleMarkAsRead(notification.id);
    }
  };

  const handleActionClick = (notification: Notification, action: string) => {
    onActionClick(notification.id, action);
  };

  const getTypeIcon = (type: Notification['type']) => {
    switch (type) {
      case 'recall': return <Assignment />;
      case 'counterfeit': return <BugReport />;
      case 'verification': return <VerifiedUser />;
      case 'system': return <SystemUpdate />;
      default: return <Notifications />;
    }
  };

  const getTypeColor = (type: Notification['type']) => {
    switch (type) {
      case 'recall': return 'error';
      case 'counterfeit': return 'warning';
      case 'verification': return 'info';
      case 'system': return 'default';
      default: return 'default';
    }
  };

  const getSeverityIcon = (severity: Notification['severity']) => {
    switch (severity) {
      case 'critical': return <Error />;
      case 'error': return <Error />;
      case 'warning': return <Warning />;
      case 'info': return <Info />;
      default: return <Info />;
    }
  };

  const getSeverityColor = (severity: Notification['severity']) => {
    switch (severity) {
      case 'critical': return 'error';
      case 'error': return 'error';
      case 'warning': return 'warning';
      case 'info': return 'info';
      default: return 'default';
    }
  };

  const getConnectionStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return 'success';
      case 'connecting': return 'warning';
      case 'disconnected': return 'error';
      default: return 'default';
    }
  };

  const getConnectionStatusIcon = () => {
    switch (connectionStatus) {
      case 'connected': return <NotificationsActive />;
      case 'connecting': return <Refresh />;
      case 'disconnected': return <NotificationsOff />;
      default: return <NotificationsOff />;
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
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box display="flex" alignItems="center" gap={2}>
          <Typography variant="h4" component="h1" fontWeight="bold">
            Notification Center
          </Typography>
          <Badge badgeContent={unreadCount} color="error">
            <Notifications />
          </Badge>
        </Box>
        <Box display="flex" gap={2}>
          <Tooltip title="Real-time Status">
            <Chip
              icon={getConnectionStatusIcon()}
              label={connectionStatus.toUpperCase()}
              color={getConnectionStatusColor() as any}
              size="small"
            />
          </Tooltip>
          <Button
            variant="outlined"
            startIcon={<Settings />}
            onClick={() => setSettingsDialogOpen(true)}
          >
            Settings
          </Button>
          <Button
            variant="outlined"
            startIcon={<MarkEmailRead />}
            onClick={handleMarkAllAsRead}
            disabled={unreadCount === 0}
          >
            Mark All Read
          </Button>
        </Box>
      </Box>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              placeholder="Search notifications..."
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
                <MenuItem value="recall">Recall</MenuItem>
                <MenuItem value="counterfeit">Counterfeit</MenuItem>
                <MenuItem value="verification">Verification</MenuItem>
                <MenuItem value="system">System</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <FormControl fullWidth>
              <InputLabel>Severity</InputLabel>
              <Select
                value={severityFilter}
                label="Severity"
                onChange={(e) => setSeverityFilter(e.target.value)}
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="info">Info</MenuItem>
                <MenuItem value="warning">Warning</MenuItem>
                <MenuItem value="error">Error</MenuItem>
                <MenuItem value="critical">Critical</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={readFilter === null ? '' : readFilter ? 'read' : 'unread'}
                label="Status"
                onChange={(e) => setReadFilter(e.target.value === '' ? null : e.target.value === 'read')}
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="unread">Unread</MenuItem>
                <MenuItem value="read">Read</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <Box display="flex" gap={1}>
              <Button
                variant="contained"
                startIcon={<Search />}
                onClick={handleSearch}
              >
                Search
              </Button>
              <Button
                variant="outlined"
                startIcon={<Clear />}
                onClick={() => {
                  setSearchTerm('');
                  setTypeFilter('');
                  setSeverityFilter('');
                  setReadFilter(null);
                  dispatch(setFilters({ search: '', type: '', severity: '', read: null }));
                  dispatch(fetchNotifications());
                }}
              >
                Clear
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs value={selectedTab} onChange={(e, newValue) => setSelectedTab(newValue)}>
          <Tab 
            label={
              <Badge badgeContent={unreadNotifications.length} color="error">
                Unread
              </Badge>
            } 
          />
          <Tab label="All" />
          <Tab label="Read" />
        </Tabs>
      </Box>

      {/* Notifications List */}
      <Card>
        <CardContent>
          {selectedTab === 0 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Unread Notifications ({unreadNotifications.length})
              </Typography>
              {unreadNotifications.length === 0 ? (
                <Box textAlign="center" py={4}>
                  <CheckCircle color="success" sx={{ fontSize: 60, mb: 2 }} />
                  <Typography variant="h6" color="textSecondary">
                    No unread notifications
                  </Typography>
                </Box>
              ) : (
                <List>
                  <AnimatePresence>
                    {unreadNotifications.map((notification, index) => (
                      <motion.div
                        key={notification.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <ListItem
                          button
                          onClick={() => handleNotificationClick(notification)}
                          sx={{
                            backgroundColor: notification.actionRequired ? 'action.hover' : 'transparent',
                            borderLeft: 4,
                            borderLeftColor: getSeverityColor(notification.severity),
                            mb: 1,
                          }}
                        >
                          <ListItemIcon>
                            <Avatar
                              sx={{
                                bgcolor: getSeverityColor(notification.severity),
                                width: 40,
                                height: 40,
                              }}
                            >
                              {getSeverityIcon(notification.severity)}
                            </Avatar>
                          </ListItemIcon>
                          <ListItemText
                            primary={
                              <Box display="flex" alignItems="center" gap={1}>
                                <Typography variant="subtitle1" fontWeight="bold">
                                  {notification.title}
                                </Typography>
                                <Chip
                                  icon={getTypeIcon(notification.type)}
                                  label={notification.type.toUpperCase()}
                                  color={getTypeColor(notification.type) as any}
                                  size="small"
                                />
                                {notification.actionRequired && (
                                  <Chip
                                    label="ACTION REQUIRED"
                                    color="error"
                                    size="small"
                                    variant="outlined"
                                  />
                                )}
                              </Box>
                            }
                            secondary={
                              <Box>
                                <Typography variant="body2" color="textSecondary">
                                  {notification.message}
                                </Typography>
                                <Typography variant="caption" color="textSecondary">
                                  {formatNotificationTime(notification.timestamp)}
                                </Typography>
                              </Box>
                            }
                          />
                          <ListItemSecondaryAction>
                            <Box display="flex" gap={1}>
                              {notification.actionRequired && (
                                <Button
                                  size="small"
                                  variant="contained"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleActionClick(notification, 'take_action');
                                  }}
                                >
                                  Take Action
                                </Button>
                              )}
                              <IconButton
                                size="small"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleMarkAsRead(notification.id);
                                }}
                              >
                                <MarkEmailRead />
                              </IconButton>
                              <IconButton
                                size="small"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteNotification(notification.id);
                                }}
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
            </Box>
          )}

          {selectedTab === 1 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                All Notifications ({filteredNotifications.length})
              </Typography>
              <List>
                <AnimatePresence>
                  {filteredNotifications.map((notification, index) => (
                    <motion.div
                      key={notification.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <ListItem
                        button
                        onClick={() => handleNotificationClick(notification)}
                        sx={{
                          backgroundColor: notification.read ? 'transparent' : 'action.hover',
                          opacity: notification.read ? 0.7 : 1,
                        }}
                      >
                        <ListItemIcon>
                          <Avatar
                            sx={{
                              bgcolor: getSeverityColor(notification.severity),
                              width: 40,
                              height: 40,
                            }}
                          >
                            {getSeverityIcon(notification.severity)}
                          </Avatar>
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Box display="flex" alignItems="center" gap={1}>
                              <Typography 
                                variant="subtitle1" 
                                fontWeight={notification.read ? 'normal' : 'bold'}
                              >
                                {notification.title}
                              </Typography>
                              <Chip
                                icon={getTypeIcon(notification.type)}
                                label={notification.type.toUpperCase()}
                                color={getTypeColor(notification.type) as any}
                                size="small"
                              />
                              {notification.actionRequired && (
                                <Chip
                                  label="ACTION REQUIRED"
                                  color="error"
                                  size="small"
                                  variant="outlined"
                                />
                              )}
                            </Box>
                          }
                          secondary={
                            <Box>
                              <Typography variant="body2" color="textSecondary">
                                {notification.message}
                              </Typography>
                              <Typography variant="caption" color="textSecondary">
                                {formatNotificationTime(notification.timestamp)}
                              </Typography>
                            </Box>
                          }
                        />
                        <ListItemSecondaryAction>
                          <Box display="flex" gap={1}>
                            {!notification.read && (
                              <IconButton
                                size="small"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleMarkAsRead(notification.id);
                                }}
                              >
                                <MarkEmailRead />
                              </IconButton>
                            )}
                            <IconButton
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteNotification(notification.id);
                              }}
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
            </Box>
          )}

          {selectedTab === 2 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Read Notifications ({readNotifications.length})
              </Typography>
              {readNotifications.length === 0 ? (
                <Box textAlign="center" py={4}>
                  <Typography variant="h6" color="textSecondary">
                    No read notifications
                  </Typography>
                </Box>
              ) : (
                <List>
                  <AnimatePresence>
                    {readNotifications.map((notification, index) => (
                      <motion.div
                        key={notification.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <ListItem
                          button
                          onClick={() => handleNotificationClick(notification)}
                          sx={{ opacity: 0.7 }}
                        >
                          <ListItemIcon>
                            <Avatar
                              sx={{
                                bgcolor: getSeverityColor(notification.severity),
                                width: 40,
                                height: 40,
                              }}
                            >
                              {getSeverityIcon(notification.severity)}
                            </Avatar>
                          </ListItemIcon>
                          <ListItemText
                            primary={
                              <Box display="flex" alignItems="center" gap={1}>
                                <Typography variant="subtitle1">
                                  {notification.title}
                                </Typography>
                                <Chip
                                  icon={getTypeIcon(notification.type)}
                                  label={notification.type.toUpperCase()}
                                  color={getTypeColor(notification.type) as any}
                                  size="small"
                                />
                              </Box>
                            }
                            secondary={
                              <Box>
                                <Typography variant="body2" color="textSecondary">
                                  {notification.message}
                                </Typography>
                                <Typography variant="caption" color="textSecondary">
                                  {formatNotificationTime(notification.timestamp)}
                                </Typography>
                              </Box>
                            }
                          />
                          <ListItemSecondaryAction>
                            <IconButton
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteNotification(notification.id);
                              }}
                            >
                              <Delete />
                            </IconButton>
                          </ListItemSecondaryAction>
                        </ListItem>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </List>
              )}
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Notification Details Dialog */}
      <Dialog
        open={detailsDialogOpen}
        onClose={() => setDetailsDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={2}>
            <Avatar
              sx={{
                bgcolor: selectedNotification ? getSeverityColor(selectedNotification.severity) : 'default',
              }}
            >
              {selectedNotification ? getSeverityIcon(selectedNotification.severity) : <Info />}
            </Avatar>
            <Box>
              <Typography variant="h6">
                {selectedNotification?.title}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                {selectedNotification && formatNotificationTime(selectedNotification.timestamp)}
              </Typography>
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedNotification && (
            <Box>
              <Box display="flex" gap={1} mb={2}>
                <Chip
                  icon={getTypeIcon(selectedNotification.type)}
                  label={selectedNotification.type.toUpperCase()}
                  color={getTypeColor(selectedNotification.type) as any}
                />
                <Chip
                  icon={getSeverityIcon(selectedNotification.severity)}
                  label={selectedNotification.severity.toUpperCase()}
                  color={getSeverityColor(selectedNotification.severity) as any}
                />
                {selectedNotification.actionRequired && (
                  <Chip
                    label="ACTION REQUIRED"
                    color="error"
                    variant="outlined"
                  />
                )}
              </Box>
              <Typography variant="body1" paragraph>
                {selectedNotification.message}
              </Typography>
              {selectedNotification.relatedId && (
                <Typography variant="body2" color="textSecondary">
                  Related ID: {selectedNotification.relatedId}
                </Typography>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsDialogOpen(false)}>
            Close
          </Button>
          {selectedNotification?.actionRequired && (
            <Button
              variant="contained"
              onClick={() => {
                handleActionClick(selectedNotification!, 'take_action');
                setDetailsDialogOpen(false);
              }}
            >
              Take Action
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Settings Dialog */}
      <Dialog
        open={settingsDialogOpen}
        onClose={() => setSettingsDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Notification Settings
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={realTimeEnabled}
                  onChange={(e) => dispatch(setRealTimeEnabled(e.target.checked))}
                />
              }
              label="Enable Real-time Notifications"
            />
            <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
              Receive notifications in real-time when new events occur.
            </Typography>
            <Divider sx={{ my: 2 }} />
            <Typography variant="h6" gutterBottom>
              Connection Status
            </Typography>
            <Box display="flex" alignItems="center" gap={2}>
              <Chip
                icon={getConnectionStatusIcon()}
                label={connectionStatus.toUpperCase()}
                color={getConnectionStatusColor() as any}
              />
              <Typography variant="body2" color="textSecondary">
                {connectionStatus === 'connected' && 'Connected to notification server'}
                {connectionStatus === 'connecting' && 'Connecting to notification server...'}
                {connectionStatus === 'disconnected' && 'Disconnected from notification server'}
              </Typography>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSettingsDialogOpen(false)}>
            Close
          </Button>
          <Button
            variant="contained"
            onClick={() => {
              dispatch(clearAllNotifications());
              setSettingsDialogOpen(false);
            }}
            color="error"
          >
            Clear All Notifications
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default NotificationCenter;