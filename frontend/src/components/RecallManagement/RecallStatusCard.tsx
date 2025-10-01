import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  LinearProgress,
  IconButton,
  Button,
  Grid,
  Divider,
  Tooltip,
  Avatar,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Badge,
  Alert,
  Collapse,
} from '@mui/material';
import {
  Warning,
  Error,
  CheckCircle,
  Info,
  ExpandMore,
  ExpandLess,
  Assignment,
  Schedule,
  People,
  Inventory,
  LocationOn,
  TrendingUp,
  TrendingDown,
  Refresh,
  Notifications,
  Edit,
  Share,
  Download,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { RecallStatusCardProps, Recall } from '../../types';
import { format } from 'date-fns';

const RecallStatusCard: React.FC<RecallStatusCardProps> = ({
  recall,
  onActionClick,
  compact = false,
}) => {
  const [expanded, setExpanded] = React.useState(!compact);
  const [showDetails, setShowDetails] = React.useState(false);

  const getSeverityColor = (severity: Recall['severity']) => {
    switch (severity) {
      case 'critical': return 'error';
      case 'high': return 'warning';
      case 'medium': return 'info';
      case 'low': return 'success';
      default: return 'default';
    }
  };

  const getSeverityIcon = (severity: Recall['severity']) => {
    switch (severity) {
      case 'critical': return <Error />;
      case 'high': return <Warning />;
      case 'medium': return <Info />;
      case 'low': return <CheckCircle />;
      default: return <Info />;
    }
  };

  const getStatusColor = (status: Recall['status']) => {
    switch (status) {
      case 'completed': return 'success';
      case 'in_progress': return 'warning';
      case 'initiated': return 'info';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: Recall['status']) => {
    switch (status) {
      case 'completed': return <CheckCircle />;
      case 'in_progress': return <Schedule />;
      case 'initiated': return <Assignment />;
      case 'cancelled': return <Error />;
      default: return <Info />;
    }
  };

  const getProgressValue = (status: Recall['status']) => {
    switch (status) {
      case 'initiated': return 25;
      case 'in_progress': return 60;
      case 'completed': return 100;
      case 'cancelled': return 0;
      default: return 0;
    }
  };

  const getCompletionRate = () => {
    const totalActions = recall.actions.length;
    const completedActions = recall.actions.filter(action => action.status === 'completed').length;
    return totalActions > 0 ? Math.round((completedActions / totalActions) * 100) : 0;
  };

  const getDaysSinceInitiated = () => {
    const initiatedDate = new Date(recall.initiatedDate);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - initiatedDate.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const getUrgencyLevel = () => {
    const daysSinceInitiated = getDaysSinceInitiated();
    if (recall.severity === 'critical' && daysSinceInitiated > 1) return 'high';
    if (recall.severity === 'high' && daysSinceInitiated > 3) return 'high';
    if (recall.severity === 'medium' && daysSinceInitiated > 7) return 'medium';
    if (recall.severity === 'low' && daysSinceInitiated > 14) return 'low';
    return 'normal';
  };

  const getUrgencyColor = () => {
    const urgency = getUrgencyLevel();
    switch (urgency) {
      case 'high': return 'error';
      case 'medium': return 'warning';
      case 'low': return 'info';
      default: return 'success';
    }
  };

  const getUrgencyMessage = () => {
    const urgency = getUrgencyLevel();
    const days = getDaysSinceInitiated();
    switch (urgency) {
      case 'high': return `High urgency - ${days} days since initiation`;
      case 'medium': return `Medium urgency - ${days} days since initiation`;
      case 'low': return `Low urgency - ${days} days since initiation`;
      default: return 'On track';
    }
  };

  const isOverdue = () => {
    const overdueActions = recall.actions.filter(action => {
      if (action.status === 'completed') return false;
      const dueDate = new Date(action.dueDate);
      const now = new Date();
      return dueDate < now;
    });
    return overdueActions.length > 0;
  };

  const getOverdueCount = () => {
    const overdueActions = recall.actions.filter(action => {
      if (action.status === 'completed') return false;
      const dueDate = new Date(action.dueDate);
      const now = new Date();
      return dueDate < now;
    });
    return overdueActions.length;
  };

  const handleActionClick = (action: string) => {
    onActionClick(action);
  };

  const handleExpandClick = () => {
    setExpanded(!expanded);
  };

  const handleDetailsClick = () => {
    setShowDetails(!showDetails);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card 
        sx={{ 
          mb: 2,
          borderLeft: 4,
          borderLeftColor: getSeverityColor(recall.severity),
          position: 'relative',
        }}
      >
        <CardContent>
          {/* Header */}
          <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
            <Box flex={1}>
              <Box display="flex" alignItems="center" gap={2} mb={1}>
                <Typography variant="h6" fontWeight="bold">
                  {recall.title}
                </Typography>
                <Chip
                  icon={getSeverityIcon(recall.severity)}
                  label={recall.severity.toUpperCase()}
                  color={getSeverityColor(recall.severity) as any}
                  size="small"
                />
                <Chip
                  icon={getStatusIcon(recall.status)}
                  label={recall.status.replace('_', ' ').toUpperCase()}
                  color={getStatusColor(recall.status) as any}
                  size="small"
                />
                {isOverdue() && (
                  <Chip
                    label={`${getOverdueCount()} OVERDUE`}
                    color="error"
                    size="small"
                    variant="outlined"
                  />
                )}
              </Box>
              <Typography variant="body2" color="textSecondary" paragraph>
                {recall.description}
              </Typography>
            </Box>
            <Box display="flex" gap={1}>
              <Tooltip title="View Details">
                <IconButton size="small" onClick={handleDetailsClick}>
                  <Assignment />
                </IconButton>
              </Tooltip>
              <Tooltip title="Edit Recall">
                <IconButton size="small" onClick={() => handleActionClick('edit')}>
                  <Edit />
                </IconButton>
              </Tooltip>
              <Tooltip title="Share">
                <IconButton size="small" onClick={() => handleActionClick('share')}>
                  <Share />
                </IconButton>
              </Tooltip>
              <Tooltip title="Export">
                <IconButton size="small" onClick={() => handleActionClick('export')}>
                  <Download />
                </IconButton>
              </Tooltip>
              <IconButton size="small" onClick={handleExpandClick}>
                {expanded ? <ExpandLess /> : <ExpandMore />}
              </IconButton>
            </Box>
          </Box>

          {/* Urgency Alert */}
          {getUrgencyLevel() !== 'normal' && (
            <Alert 
              severity={getUrgencyColor() as any} 
              sx={{ mb: 2 }}
              icon={getUrgencyLevel() === 'high' ? <Error /> : <Warning />}
            >
              {getUrgencyMessage()}
            </Alert>
          )}

          {/* Progress Bar */}
          <Box mb={2}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
              <Typography variant="body2" color="textSecondary">
                Overall Progress
              </Typography>
              <Typography variant="body2" fontWeight="bold">
                {getProgressValue(recall.status)}%
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={getProgressValue(recall.status)}
              color={getStatusColor(recall.status) as any}
              sx={{ height: 8, borderRadius: 4 }}
            />
          </Box>

          {/* Key Metrics */}
          <Grid container spacing={2} mb={2}>
            <Grid item xs={6} sm={3}>
              <Box textAlign="center">
                <Typography variant="h4" fontWeight="bold" color="primary">
                  {recall.affectedBatches.length}
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  Affected Batches
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Box textAlign="center">
                <Typography variant="h4" fontWeight="bold" color="success.main">
                  {getCompletionRate()}%
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  Actions Complete
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Box textAlign="center">
                <Typography variant="h4" fontWeight="bold" color="warning.main">
                  {getDaysSinceInitiated()}
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  Days Active
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Box textAlign="center">
                <Typography variant="h4" fontWeight="bold" color="error.main">
                  {getOverdueCount()}
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  Overdue Actions
                </Typography>
              </Box>
            </Grid>
          </Grid>

          {/* Expandable Content */}
          <Collapse in={expanded}>
            <Divider sx={{ my: 2 }} />
            
            {/* Recall Information */}
            <Box mb={3}>
              <Typography variant="h6" gutterBottom>
                Recall Information
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <List dense>
                    <ListItem>
                      <ListItemIcon>
                        <Assignment />
                      </ListItemIcon>
                      <ListItemText
                        primary="Initiated By"
                        secondary={recall.initiatedBy}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <Schedule />
                      </ListItemIcon>
                      <ListItemText
                        primary="Initiated Date"
                        secondary={format(new Date(recall.initiatedDate), 'MMM dd, yyyy HH:mm')}
                      />
                    </ListItem>
                    {recall.completionDate && (
                      <ListItem>
                        <ListItemIcon>
                          <CheckCircle />
                        </ListItemIcon>
                        <ListItemText
                          primary="Completion Date"
                          secondary={format(new Date(recall.completionDate), 'MMM dd, yyyy HH:mm')}
                        />
                      </ListItem>
                    )}
                  </List>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" color="textSecondary" paragraph>
                    <strong>Reason:</strong> {recall.reason}
                  </Typography>
                </Grid>
              </Grid>
            </Box>

            {/* Actions Summary */}
            <Box mb={3}>
              <Typography variant="h6" gutterBottom>
                Actions Summary ({recall.actions.length})
              </Typography>
              <List dense>
                {recall.actions.slice(0, 3).map((action, index) => (
                  <ListItem key={index}>
                    <ListItemIcon>
                      <Avatar
                        sx={{
                          width: 32,
                          height: 32,
                          bgcolor: action.status === 'completed' ? 'success.main' : 
                                  action.status === 'failed' ? 'error.main' : 'warning.main',
                        }}
                      >
                        {action.status === 'completed' ? <CheckCircle /> : 
                         action.status === 'failed' ? <Error /> : <Schedule />}
                      </Avatar>
                    </ListItemIcon>
                    <ListItemText
                      primary={action.description}
                      secondary={
                        <Box>
                          <Typography variant="caption" color="textSecondary">
                            Assigned to: {action.assignedTo}
                          </Typography>
                          <br />
                          <Typography variant="caption" color="textSecondary">
                            Due: {format(new Date(action.dueDate), 'MMM dd, yyyy')}
                          </Typography>
                        </Box>
                      }
                    />
                    <ListItemSecondaryAction>
                      <Chip
                        label={action.status.toUpperCase()}
                        color={action.status === 'completed' ? 'success' : 
                               action.status === 'failed' ? 'error' : 'warning'}
                        size="small"
                      />
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
                {recall.actions.length > 3 && (
                  <ListItem>
                    <ListItemText
                      primary={`+${recall.actions.length - 3} more actions`}
                      sx={{ fontStyle: 'italic' }}
                    />
                  </ListItem>
                )}
              </List>
            </Box>

            {/* Action Buttons */}
            <Box display="flex" gap={2} flexWrap="wrap">
              <Button
                variant="contained"
                startIcon={<Refresh />}
                onClick={() => handleActionClick('refresh')}
              >
                Refresh Status
              </Button>
              <Button
                variant="outlined"
                startIcon={<Notifications />}
                onClick={() => handleActionClick('notify')}
              >
                Send Notifications
              </Button>
              <Button
                variant="outlined"
                startIcon={<Edit />}
                onClick={() => handleActionClick('edit')}
              >
                Edit Recall
              </Button>
              {recall.status === 'in_progress' && (
                <Button
                  variant="contained"
                  color="success"
                  startIcon={<CheckCircle />}
                  onClick={() => handleActionClick('complete')}
                >
                  Mark Complete
                </Button>
              )}
              {recall.status === 'initiated' && (
                <Button
                  variant="contained"
                  color="warning"
                  startIcon={<Schedule />}
                  onClick={() => handleActionClick('start')}
                >
                  Start Recall
                </Button>
              )}
            </Box>
          </Collapse>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default RecallStatusCard;