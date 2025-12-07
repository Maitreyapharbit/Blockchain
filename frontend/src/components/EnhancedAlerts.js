import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { 
  FaBell, 
  FaThermometerHalf, 
  FaClock, 
  FaExclamationTriangle,
  FaMapMarkerAlt,
  FaTruck,
  FaTimes,
  FaCheck,
  FaFilter,
  FaSortAmountDown,
  FaVolumeUp,
  FaVolumeMute
} from 'react-icons/fa';
import { format, parseISO, isAfter, isBefore, differenceInHours } from 'date-fns';
import { supabase } from '../config/supabase';
import { alertService } from '../services/alertService';

const AlertsContainer = styled.div`
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.05);
  border: 1px solid #e5e7eb;
  max-height: 600px;
  overflow-y: auto;
`;

const AlertsHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 2px solid #e5e7eb;
`;

const AlertsTitle = styled.h3`
  margin: 0;
  color: #1f2937;
  font-size: 18px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const AlertCount = styled.span`
  background: #ef4444;
  color: white;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
`;

const ControlsContainer = styled.div`
  display: flex;
  gap: 12px;
  align-items: center;
  margin-bottom: 20px;
`;

const FilterSelect = styled.select`
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background: white;
  font-size: 14px;
  color: #374151;
  cursor: pointer;
  
  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
`;

const SortSelect = styled.select`
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background: white;
  font-size: 14px;
  color: #374151;
  cursor: pointer;
  
  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
`;

const SoundToggle = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background: ${props => props.muted ? '#f3f4f6' : 'white'};
  color: ${props => props.muted ? '#6b7280' : '#374151'};
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    border-color: #3b82f6;
    background: ${props => props.muted ? '#f8fafc' : '#f8fafc'};
  }
`;

const AlertList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const AlertItem = styled.div`
  padding: 16px;
  border-radius: 8px;
  border-left: 4px solid ${props => props.severityColor};
  background: ${props => props.severityBg};
  transition: all 0.2s ease;
  position: relative;
  
  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  }
`;

const AlertHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 8px;
`;

const AlertTitle = styled.h4`
  margin: 0;
  color: #1f2937;
  font-size: 14px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const AlertTime = styled.span`
  color: #6b7280;
  font-size: 12px;
  font-weight: 500;
`;

const AlertDescription = styled.p`
  margin: 8px 0;
  color: #4b5563;
  font-size: 13px;
  line-height: 1.4;
`;

const AlertData = styled.div`
  margin-top: 12px;
  padding: 12px;
  background: rgba(255, 255, 255, 0.5);
  border-radius: 6px;
  border: 1px solid rgba(0, 0, 0, 0.1);
`;

const DataRow = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 4px;
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const DataLabel = styled.span`
  color: #6b7280;
  font-size: 12px;
  font-weight: 500;
`;

const DataValue = styled.span`
  color: #1f2937;
  font-size: 12px;
  font-weight: 600;
`;

const AlertActions = styled.div`
  display: flex;
  gap: 8px;
  margin-top: 12px;
`;

const ActionButton = styled.button`
  padding: 6px 12px;
  border: 1px solid ${props => props.variant === 'resolve' ? '#10b981' : '#d1d5db'};
  border-radius: 6px;
  background: ${props => props.variant === 'resolve' ? '#10b981' : 'white'};
  color: ${props => props.variant === 'resolve' ? 'white' : '#374151'};
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 4px;
  
  &:hover {
    background: ${props => props.variant === 'resolve' ? '#059669' : '#f3f4f6'};
    transform: translateY(-1px);
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 40px 20px;
  color: #6b7280;
`;

const LoadingState = styled.div`
  text-align: center;
  padding: 40px 20px;
  color: #6b7280;
`;

const SeverityBadge = styled.span`
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  background: ${props => props.$bgColor};
  color: ${props => props.$color};
`;

const EnhancedAlerts = ({ shipmentId, showControls = true }) => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('created_at');
  const [soundEnabled, setSoundEnabled] = useState(true);

  useEffect(() => {
    fetchAlerts();
    setupRealtimeSubscription();
  }, [shipmentId]);

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const alertsData = await alertService.getShipmentAlerts(shipmentId);
      setAlerts(alertsData);
    } catch (error) {
      console.error('Error fetching alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeSubscription = () => {
    // Subscribe to new alerts
    const channel = supabase
      .channel(`enhanced-alerts-${shipmentId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'shipment_alerts',
          filter: `shipment_id=eq.${shipmentId}`
        },
        (payload) => {
          const newAlert = payload.new;
          setAlerts(prev => [newAlert, ...prev]);
          
          // Process alert with sound if enabled
          if (soundEnabled) {
            alertService.processAlert(newAlert);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const getSeverityConfig = (severity) => {
    const configs = {
      low: { 
        bg: '#f0fdf4', 
        border: '#10b981', 
        badge: { bg: '#dcfce7', color: '#166534' }
      },
      medium: { 
        bg: '#fffbeb', 
        border: '#f59e0b', 
        badge: { bg: '#fef3c7', color: '#92400e' }
      },
      high: { 
        bg: '#fef2f2', 
        border: '#ef4444', 
        badge: { bg: '#fecaca', color: '#991b1b' }
      },
      critical: { 
        bg: '#fef2f2', 
        border: '#dc2626', 
        badge: { bg: '#fecaca', color: '#7f1d1d' }
      }
    };
    return configs[severity] || configs.medium;
  };

  const getAlertIcon = (alertType) => {
    const icons = {
      temperature_excursion: FaThermometerHalf,
      delay: FaClock,
      anomaly: FaExclamationTriangle,
      humidity_excursion: FaThermometerHalf,
      location_anomaly: FaMapMarkerAlt,
      delivery_delay: FaTruck,
      damage_detected: FaExclamationTriangle
    };
    return icons[alertType] || FaExclamationTriangle;
  };

  const getAlertTitle = (alertType, alertData) => {
    const titles = {
      temperature_excursion: 'Temperature Excursion',
      delay: 'Delivery Delay',
      anomaly: 'Anomaly Detected',
      humidity_excursion: 'Humidity Excursion',
      location_anomaly: 'Location Anomaly',
      delivery_delay: 'Delivery Delay',
      damage_detected: 'Damage Detected'
    };
    return titles[alertType] || alertType.replace('_', ' ').toUpperCase();
  };

  const formatAlertData = (alertData) => {
    if (!alertData || typeof alertData !== 'object') return null;

    const data = [];
    
    if (alertData.temperature !== undefined) {
      data.push({
        label: 'Temperature',
        value: `${alertData.temperature}°C`
      });
    }
    
    if (alertData.min_temp !== undefined && alertData.max_temp !== undefined) {
      data.push({
        label: 'Range',
        value: `${alertData.min_temp}°C - ${alertData.max_temp}°C`
      });
    }
    
    if (alertData.location) {
      data.push({
        label: 'Location',
        value: alertData.location
      });
    }
    
    if (alertData.delay_hours) {
      data.push({
        label: 'Delay',
        value: `${Math.round(alertData.delay_hours)} hours`
      });
    }
    
    if (alertData.expected_delivery) {
      data.push({
        label: 'Expected',
        value: format(parseISO(alertData.expected_delivery), 'MMM dd, HH:mm')
      });
    }

    return data;
  };

  const handleResolveAlert = async (alertId) => {
    try {
      await alertService.resolveAlert(alertId, 'user');
      setAlerts(prev => prev.map(alert => 
        alert.id === alertId 
          ? { ...alert, is_resolved: true, resolved_at: new Date().toISOString() }
          : alert
      ));
    } catch (error) {
      console.error('Error resolving alert:', error);
    }
  };

  const filteredAndSortedAlerts = alerts
    .filter(alert => {
      if (filter === 'all') return true;
      if (filter === 'unresolved') return !alert.is_resolved;
      if (filter === 'resolved') return alert.is_resolved;
      if (filter === 'critical') return alert.severity === 'critical';
      if (filter === 'temperature') return alert.alert_type.includes('temperature');
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'created_at') {
        return new Date(b.created_at) - new Date(a.created_at);
      }
      if (sortBy === 'severity') {
        const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
        return severityOrder[b.severity] - severityOrder[a.severity];
      }
      return 0;
    });

  if (loading) {
    return (
      <AlertsContainer>
        <LoadingState>Loading alerts...</LoadingState>
      </AlertsContainer>
    );
  }

  const unresolvedCount = alerts.filter(alert => !alert.is_resolved).length;

  return (
    <AlertsContainer>
      <AlertsHeader>
        <AlertsTitle>
          <FaBell />
          Enhanced Alerts
          {unresolvedCount > 0 && <AlertCount>{unresolvedCount}</AlertCount>}
        </AlertsTitle>
      </AlertsHeader>

      {showControls && (
        <ControlsContainer>
          <FilterSelect value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="all">All Alerts</option>
            <option value="unresolved">Unresolved</option>
            <option value="resolved">Resolved</option>
            <option value="critical">Critical Only</option>
            <option value="temperature">Temperature</option>
          </FilterSelect>
          
          <SortSelect value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="created_at">Newest First</option>
            <option value="severity">By Severity</option>
          </SortSelect>
          
          <SoundToggle 
            muted={!soundEnabled} 
            onClick={() => setSoundEnabled(!soundEnabled)}
          >
            {soundEnabled ? <FaVolumeUp /> : <FaVolumeMute />}
            {soundEnabled ? 'Sound On' : 'Sound Off'}
          </SoundToggle>
        </ControlsContainer>
      )}

      {filteredAndSortedAlerts.length === 0 ? (
        <EmptyState>
          <FaBell size={24} style={{ marginBottom: '8px', opacity: 0.5 }} />
          <p>No alerts found</p>
        </EmptyState>
      ) : (
        <AlertList>
          {filteredAndSortedAlerts.map((alert) => {
            const severityConfig = getSeverityConfig(alert.severity);
            const IconComponent = getAlertIcon(alert.alert_type);
            const alertData = formatAlertData(alert.alert_data);
            
            return (
              <AlertItem
                key={alert.id}
                $severityColor={severityConfig.border}
                $severityBg={severityConfig.bg}
              >
                <AlertHeader>
                  <AlertTitle>
                    <IconComponent />
                    {getAlertTitle(alert.alert_type, alert.alert_data)}
                    <SeverityBadge 
                      $bgColor={severityConfig.badge.bg} 
                      $color={severityConfig.badge.color}
                    >
                      {alert.severity}
                    </SeverityBadge>
                  </AlertTitle>
                  <AlertTime>
                    {format(parseISO(alert.created_at), 'MMM dd, HH:mm')}
                  </AlertTime>
                </AlertHeader>
                
                <AlertDescription>{alert.description}</AlertDescription>
                
                {alertData && alertData.length > 0 && (
                  <AlertData>
                    {alertData.map((item, index) => (
                      <DataRow key={index}>
                        <DataLabel>{item.label}:</DataLabel>
                        <DataValue>{item.value}</DataValue>
                      </DataRow>
                    ))}
                  </AlertData>
                )}
                
                {!alert.is_resolved && (
                  <AlertActions>
                    <ActionButton 
                      variant="resolve" 
                      onClick={() => handleResolveAlert(alert.id)}
                    >
                      <FaCheck />
                      Resolve
                    </ActionButton>
                  </AlertActions>
                )}
              </AlertItem>
            );
          })}
        </AlertList>
      )}
    </AlertsContainer>
  );
};

export default EnhancedAlerts;