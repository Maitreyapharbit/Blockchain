import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { 
  FaBell, 
  FaThermometerHalf, 
  FaClock, 
  FaExclamationTriangle,
  FaMapMarkerAlt,
  FaTruck,
  FaChartLine,
  FaFilter,
  FaDownload,
  FaSync,
  FaVolumeUp,
  FaVolumeMute,
  FaCog,
  FaEye,
  FaEyeSlash
} from 'react-icons/fa';
import { format, parseISO, differenceInHours } from 'date-fns';
import { supabase } from '../config/supabase';
import { notificationService } from '../services/notificationService';
import { alertService } from '../services/alertService';

const DashboardContainer = styled.div`
  max-width: 1400px;
  margin: 0 auto;
  padding: 20px;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 2px solid #e5e7eb;
`;

const Title = styled.h1`
  margin: 0;
  color: #1f2937;
  font-size: 28px;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 12px;
`;

const ControlsContainer = styled.div`
  display: flex;
  gap: 12px;
  align-items: center;
`;

const ControlButton = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background: ${props => props.variant === 'primary' ? '#3b82f6' : 'white'};
  color: ${props => props.variant === 'primary' ? 'white' : '#374151'};
  border: 1px solid ${props => props.variant === 'primary' ? '#3b82f6' : '#d1d5db'};
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: ${props => props.variant === 'primary' ? '#2563eb' : '#f3f4f6'};
    transform: translateY(-1px);
  }
  
  &:disabled {
    background: #9ca3af;
    cursor: not-allowed;
    transform: none;
  }
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
`;

const StatCard = styled.div`
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.05);
  border: 1px solid #e5e7eb;
  transition: all 0.2s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0,0,0,0.1);
  }
`;

const StatHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
`;

const StatIcon = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: ${props => props.$bgColor || '#3b82f6'};
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 18px;
`;

const StatTitle = styled.h3`
  margin: 0;
  color: #6b7280;
  font-size: 14px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const StatValue = styled.div`
  font-size: 32px;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 8px;
`;

const StatChange = styled.div`
  font-size: 14px;
  color: ${props => props.$positive ? '#10b981' : '#ef4444'};
  font-weight: 500;
`;

const ContentGrid = styled.div`
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 30px;
  
  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
  }
`;

const AlertsList = styled.div`
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

const FilterContainer = styled.div`
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

const AlertItem = styled.div`
  padding: 16px;
  border-radius: 8px;
  border-left: 4px solid ${props => props.severityColor};
  background: ${props => props.severityBg};
  margin-bottom: 12px;
  transition: all 0.2s ease;
  
  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  }
  
  &:last-child {
    margin-bottom: 0;
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

const Sidebar = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const ChartCard = styled.div`
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.05);
  border: 1px solid #e5e7eb;
`;

const ChartTitle = styled.h3`
  margin: 0 0 20px 0;
  color: #1f2937;
  font-size: 18px;
  font-weight: 600;
`;

const ChartPlaceholder = styled.div`
  height: 200px;
  background: #f9fafb;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6b7280;
  font-size: 14px;
`;

const SettingsCard = styled.div`
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.05);
  border: 1px solid #e5e7eb;
`;

const SettingsTitle = styled.h3`
  margin: 0 0 20px 0;
  color: #1f2937;
  font-size: 18px;
  font-weight: 600;
`;

const SettingItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const SettingLabel = styled.span`
  color: #374151;
  font-size: 14px;
  font-weight: 500;
`;

const ToggleSwitch = styled.button`
  width: 44px;
  height: 24px;
  border-radius: 12px;
  border: none;
  background: ${props => props.active ? '#3b82f6' : '#d1d5db'};
  position: relative;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &::after {
    content: '';
    position: absolute;
    top: 2px;
    left: ${props => props.active ? '22px' : '2px'};
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: white;
    transition: all 0.2s ease;
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

const AlertDashboard = () => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  useEffect(() => {
    fetchAlerts();
    setupRealtimeSubscription();
    initializeNotifications();
  }, []);

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const alertsData = await alertService.getUnresolvedAlerts();
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
      .channel('alert-dashboard')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'shipment_alerts'
        },
        (payload) => {
          const newAlert = payload.new;
          setAlerts(prev => [newAlert, ...prev]);
          
          // Process alert with notifications
          notificationService.processAlert(newAlert);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const initializeNotifications = async () => {
    await notificationService.init();
    setSoundEnabled(notificationService.soundEnabled);
    setNotificationsEnabled(notificationService.isNotificationEnabled());
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAlerts();
    setRefreshing(false);
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

  const toggleSound = () => {
    const newState = notificationService.toggleSound();
    setSoundEnabled(newState);
  };

  const toggleNotifications = async () => {
    if (notificationsEnabled) {
      setNotificationsEnabled(false);
    } else {
      const granted = await notificationService.requestPermission();
      setNotificationsEnabled(granted);
    }
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

  const filteredAlerts = alerts.filter(alert => {
    if (filter === 'all') return true;
    if (filter === 'unresolved') return !alert.is_resolved;
    if (filter === 'critical') return alert.severity === 'critical';
    if (filter === 'temperature') return alert.alert_type.includes('temperature');
    return true;
  });

  const stats = {
    total: alerts.length,
    unresolved: alerts.filter(alert => !alert.is_resolved).length,
    critical: alerts.filter(alert => alert.severity === 'critical').length,
    temperature: alerts.filter(alert => alert.alert_type.includes('temperature')).length
  };

  if (loading) {
    return (
      <DashboardContainer>
        <LoadingState>Loading alerts...</LoadingState>
      </DashboardContainer>
    );
  }

  return (
    <DashboardContainer>
      <Header>
        <Title>
          <FaBell />
          Alert Dashboard
        </Title>
        <ControlsContainer>
          <ControlButton onClick={handleRefresh} disabled={refreshing}>
            <FaSync className={refreshing ? 'animate-spin' : ''} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </ControlButton>
          <ControlButton>
            <FaDownload />
            Export
          </ControlButton>
          <ControlButton>
            <FaCog />
            Settings
          </ControlButton>
        </ControlsContainer>
      </Header>

      <StatsGrid>
        <StatCard>
          <StatHeader>
            <StatIcon $bgColor="#ef4444">
              <FaBell />
            </StatIcon>
            <StatTitle>Total Alerts</StatTitle>
          </StatHeader>
          <StatValue>{stats.total}</StatValue>
          <StatChange $positive={stats.total === 0}>
            {stats.total === 0 ? 'All Clear' : 'Active Alerts'}
          </StatChange>
        </StatCard>

        <StatCard>
          <StatHeader>
            <StatIcon $bgColor="#f59e0b">
              <FaExclamationTriangle />
            </StatIcon>
            <StatTitle>Unresolved</StatTitle>
          </StatHeader>
          <StatValue>{stats.unresolved}</StatValue>
          <StatChange $positive={stats.unresolved === 0}>
            {stats.unresolved === 0 ? 'All Resolved' : 'Needs Attention'}
          </StatChange>
        </StatCard>

        <StatCard>
          <StatHeader>
            <StatIcon $bgColor="#dc2626">
              <FaExclamationTriangle />
            </StatIcon>
            <StatTitle>Critical</StatTitle>
          </StatHeader>
          <StatValue>{stats.critical}</StatValue>
          <StatChange $positive={stats.critical === 0}>
            {stats.critical === 0 ? 'No Critical' : 'Critical Alerts'}
          </StatChange>
        </StatCard>

        <StatCard>
          <StatHeader>
            <StatIcon $bgColor="#3b82f6">
              <FaThermometerHalf />
            </StatIcon>
            <StatTitle>Temperature</StatTitle>
          </StatHeader>
          <StatValue>{stats.temperature}</StatValue>
          <StatChange $positive={stats.temperature === 0}>
            {stats.temperature === 0 ? 'No Temp Issues' : 'Temp Alerts'}
          </StatChange>
        </StatCard>
      </StatsGrid>

      <ContentGrid>
        <AlertsList>
          <AlertsHeader>
            <AlertsTitle>
              <FaBell />
              Recent Alerts ({filteredAlerts.length})
            </AlertsTitle>
          </AlertsHeader>

          <FilterContainer>
            <FilterSelect value={filter} onChange={(e) => setFilter(e.target.value)}>
              <option value="all">All Alerts</option>
              <option value="unresolved">Unresolved</option>
              <option value="critical">Critical Only</option>
              <option value="temperature">Temperature</option>
            </FilterSelect>
          </FilterContainer>

          {filteredAlerts.length === 0 ? (
            <EmptyState>
              <FaBell size={24} style={{ marginBottom: '8px', opacity: 0.5 }} />
              <p>No alerts found</p>
            </EmptyState>
          ) : (
            filteredAlerts.map((alert) => {
              const severityConfig = getSeverityConfig(alert.severity);
              const IconComponent = getAlertIcon(alert.alert_type);
              
              return (
                <AlertItem
                  key={alert.id}
                  $severityColor={severityConfig.border}
                  $severityBg={severityConfig.bg}
                >
                  <AlertHeader>
                    <AlertTitle>
                      <IconComponent />
                      {alert.title}
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
                  
                  {!alert.is_resolved && (
                    <AlertActions>
                      <ActionButton 
                        variant="resolve" 
                        onClick={() => handleResolveAlert(alert.id)}
                      >
                        Resolve
                      </ActionButton>
                    </AlertActions>
                  )}
                </AlertItem>
              );
            })
          )}
        </AlertsList>

        <Sidebar>
          <ChartCard>
            <ChartTitle>Alert Trends</ChartTitle>
            <ChartPlaceholder>
              <FaChartLine size={48} style={{ opacity: 0.3 }} />
              <div style={{ marginLeft: '12px' }}>
                Chart visualization coming soon
              </div>
            </ChartPlaceholder>
          </ChartCard>

          <SettingsCard>
            <SettingsTitle>Notification Settings</SettingsTitle>
            
            <SettingItem>
              <SettingLabel>Sound Alerts</SettingLabel>
              <ToggleSwitch 
                active={soundEnabled} 
                onClick={toggleSound}
              />
            </SettingItem>
            
            <SettingItem>
              <SettingLabel>Browser Notifications</SettingLabel>
              <ToggleSwitch 
                active={notificationsEnabled} 
                onClick={toggleNotifications}
              />
            </SettingItem>
          </SettingsCard>
        </Sidebar>
      </ContentGrid>
    </DashboardContainer>
  );
};

export default AlertDashboard;