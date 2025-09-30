import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { 
  FaTruck, 
  FaThermometerHalf, 
  FaMapMarkerAlt, 
  FaClock, 
  FaCheckCircle, 
  FaExclamationTriangle,
  FaBell,
  FaEye,
  FaRefresh
} from 'react-icons/fa';
import { format, parseISO } from 'date-fns';
import { supabase } from '../config/supabase';
import { realtimeService } from '../services/realtimeService';
import { alertService } from '../services/alertService';
import ShipmentTimeline from './ShipmentTimeline';
import EnhancedAlerts from './EnhancedAlerts';
import ProductJourneyTimeline from './ProductJourneyTimeline';

const DashboardContainer = styled.div`
  max-width: 1200px;
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
`;

const RefreshButton = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: #2563eb;
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
  background: ${props => props.bgColor || '#3b82f6'};
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
  color: ${props => props.positive ? '#10b981' : '#ef4444'};
  font-weight: 500;
`;

const ContentGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 400px;
  gap: 30px;
  
  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
  }
`;

const FullWidthGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 30px;
  margin-top: 30px;
`;

const TabContainer = styled.div`
  margin-bottom: 20px;
`;

const TabButton = styled.button`
  padding: 12px 24px;
  border: none;
  border-bottom: 2px solid ${props => props.active ? '#3b82f6' : 'transparent'};
  background: none;
  color: ${props => props.active ? '#3b82f6' : '#6b7280'};
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    color: #3b82f6;
    background: #f8fafc;
  }
`;

const MainContent = styled.div`
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.05);
  border: 1px solid #e5e7eb;
`;

const Sidebar = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const AlertsPanel = styled.div`
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.05);
  border: 1px solid #e5e7eb;
`;

const PanelHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 1px solid #e5e7eb;
`;

const PanelTitle = styled.h3`
  margin: 0;
  color: #1f2937;
  font-size: 18px;
  font-weight: 600;
`;

const AlertItem = styled.div`
  padding: 16px;
  border-radius: 8px;
  border-left: 4px solid ${props => props.severityColor};
  background: ${props => props.severityBg};
  margin-bottom: 12px;
  
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
`;

const AlertTime = styled.span`
  color: #6b7280;
  font-size: 12px;
`;

const AlertDescription = styled.p`
  margin: 0;
  color: #4b5563;
  font-size: 13px;
  line-height: 1.4;
`;

const ShipmentInfo = styled.div`
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.05);
  border: 1px solid #e5e7eb;
`;

const InfoRow = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 12px;
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const InfoLabel = styled.span`
  color: #6b7280;
  font-size: 14px;
  font-weight: 500;
`;

const InfoValue = styled.span`
  color: #1f2937;
  font-size: 14px;
  font-weight: 600;
`;

const StatusBadge = styled.span`
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  background: ${props => props.bgColor};
  color: ${props => props.color};
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

const ShipmentDashboard = ({ shipmentId }) => {
  const [shipment, setShipment] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('timeline');

  useEffect(() => {
    if (shipmentId) {
      fetchShipmentData();
      setupRealtimeSubscriptions();
    }

    return () => {
      realtimeService.unsubscribeAll();
    };
  }, [shipmentId]);

  const fetchShipmentData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchShipment(),
        fetchAlerts()
      ]);
    } catch (error) {
      console.error('Error fetching shipment data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchShipment = async () => {
    try {
      const { data, error } = await supabase
        .from('shipments')
        .select('*')
        .eq('id', shipmentId)
        .single();

      if (error) throw error;
      setShipment(data);
    } catch (error) {
      console.error('Error fetching shipment:', error);
    }
  };

  const fetchAlerts = async () => {
    try {
      const alertsData = await alertService.getShipmentAlerts(shipmentId);
      setAlerts(alertsData);
    } catch (error) {
      console.error('Error fetching alerts:', error);
    }
  };

  const setupRealtimeSubscriptions = () => {
    // Subscribe to shipment updates
    realtimeService.subscribeToShipment(shipmentId, (payload) => {
      console.log('Shipment updated:', payload);
      setShipment(payload.new);
    });

    // Subscribe to new alerts
    realtimeService.subscribeToAlerts(shipmentId, (payload) => {
      console.log('New alert:', payload);
      const newAlert = payload.new;
      setAlerts(prev => [newAlert, ...prev]);
      alertService.processAlert(newAlert);
    });

    // Subscribe to temperature readings
    realtimeService.subscribeToTemperatureReadings(shipmentId, (payload) => {
      console.log('Temperature reading:', payload);
      // You could update a temperature chart here
    });
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchShipmentData();
    setRefreshing(false);
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: { bg: '#fef3c7', color: '#92400e' },
      in_transit: { bg: '#dbeafe', color: '#1e40af' },
      delivered: { bg: '#d1fae5', color: '#065f46' },
      delayed: { bg: '#fed7d7', color: '#c53030' },
      damaged: { bg: '#fed7d7', color: '#c53030' },
      lost: { bg: '#f3f4f6', color: '#374151' }
    };
    return colors[status] || colors.pending;
  };

  const getSeverityColor = (severity) => {
    const colors = {
      low: { bg: '#f0fdf4', border: '#10b981' },
      medium: { bg: '#fffbeb', border: '#f59e0b' },
      high: { bg: '#fef2f2', border: '#ef4444' },
      critical: { bg: '#fef2f2', border: '#dc2626' }
    };
    return colors[severity] || colors.medium;
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

  if (loading) {
    return (
      <DashboardContainer>
        <LoadingState>Loading shipment data...</LoadingState>
      </DashboardContainer>
    );
  }

  if (!shipment) {
    return (
      <DashboardContainer>
        <EmptyState>
          <FaTruck size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
          <p>Shipment not found</p>
        </EmptyState>
      </DashboardContainer>
    );
  }

  const statusColors = getStatusColor(shipment.status);
  const unresolvedAlerts = alerts.filter(alert => !alert.is_resolved);

  return (
    <DashboardContainer>
      <Header>
        <Title>Shipment Tracking - {shipment.tracking_number}</Title>
        <RefreshButton onClick={handleRefresh} disabled={refreshing}>
          <FaRefresh className={refreshing ? 'animate-spin' : ''} />
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </RefreshButton>
      </Header>

      <StatsGrid>
        <StatCard>
          <StatHeader>
            <StatIcon bgColor="#3b82f6">
              <FaTruck />
            </StatIcon>
            <StatTitle>Status</StatTitle>
          </StatHeader>
          <StatusBadge bgColor={statusColors.bg} color={statusColors.color}>
            {shipment.status.replace('_', ' ').toUpperCase()}
          </StatusBadge>
        </StatCard>

        <StatCard>
          <StatHeader>
            <StatIcon bgColor="#10b981">
              <FaCheckCircle />
            </StatIcon>
            <StatTitle>Alerts</StatTitle>
          </StatHeader>
          <StatValue>{unresolvedAlerts.length}</StatValue>
          <StatChange positive={unresolvedAlerts.length === 0}>
            {unresolvedAlerts.length === 0 ? 'All Clear' : 'Active Alerts'}
          </StatChange>
        </StatCard>

        <StatCard>
          <StatHeader>
            <StatIcon bgColor="#f59e0b">
              <FaThermometerHalf />
            </StatIcon>
            <StatTitle>Temperature</StatTitle>
          </StatHeader>
          <StatValue>
            {shipment.current_temperature ? `${shipment.current_temperature}°C` : 'N/A'}
          </StatValue>
          <StatChange>
            {shipment.temperature_min && shipment.temperature_max 
              ? `Range: ${shipment.temperature_min}°C - ${shipment.temperature_max}°C`
              : 'No range set'
            }
          </StatChange>
        </StatCard>

        <StatCard>
          <StatHeader>
            <StatIcon bgColor="#8b5cf6">
              <FaMapMarkerAlt />
            </StatIcon>
            <StatTitle>Location</StatTitle>
          </StatHeader>
          <StatValue>In Transit</StatValue>
          <StatChange>
            {shipment.origin_location} → {shipment.destination_location}
          </StatChange>
        </StatCard>
      </StatsGrid>

      <ContentGrid>
        <MainContent>
          <TabContainer>
            <TabButton 
              active={activeTab === 'timeline'} 
              onClick={() => setActiveTab('timeline')}
            >
              Journey Timeline
            </TabButton>
            <TabButton 
              active={activeTab === 'alerts'} 
              onClick={() => setActiveTab('alerts')}
            >
              Enhanced Alerts
            </TabButton>
          </TabContainer>
          
          {activeTab === 'timeline' && (
            <ShipmentTimeline shipmentId={shipmentId} showFilters={true} />
          )}
          
          {activeTab === 'alerts' && (
            <EnhancedAlerts shipmentId={shipmentId} showControls={true} />
          )}
        </MainContent>

        <Sidebar>
          <ShipmentInfo>
            <h3 style={{ margin: '0 0 20px 0', color: '#1f2937' }}>Shipment Details</h3>
            <InfoRow>
              <InfoLabel>Tracking Number:</InfoLabel>
              <InfoValue>{shipment.tracking_number}</InfoValue>
            </InfoRow>
            <InfoRow>
              <InfoLabel>Origin:</InfoLabel>
              <InfoValue>{shipment.origin_location}</InfoValue>
            </InfoRow>
            <InfoRow>
              <InfoLabel>Destination:</InfoLabel>
              <InfoValue>{shipment.destination_location}</InfoValue>
            </InfoRow>
            <InfoRow>
              <InfoLabel>Expected Delivery:</InfoLabel>
              <InfoValue>
                {shipment.expected_delivery_date 
                  ? format(parseISO(shipment.expected_delivery_date), 'MMM dd, yyyy')
                  : 'Not set'
                }
              </InfoValue>
            </InfoRow>
            <InfoRow>
              <InfoLabel>Actual Delivery:</InfoLabel>
              <InfoValue>
                {shipment.actual_delivery_date 
                  ? format(parseISO(shipment.actual_delivery_date), 'MMM dd, yyyy')
                  : 'Not delivered'
                }
              </InfoValue>
            </InfoRow>
            <InfoRow>
              <InfoLabel>Created:</InfoLabel>
              <InfoValue>
                {format(parseISO(shipment.created_at), 'MMM dd, yyyy HH:mm')}
              </InfoValue>
            </InfoRow>
          </ShipmentInfo>

          <AlertsPanel>
            <PanelHeader>
              <FaBell color="#ef4444" />
              <PanelTitle>Active Alerts ({unresolvedAlerts.length})</PanelTitle>
            </PanelHeader>
            
            {unresolvedAlerts.length === 0 ? (
              <EmptyState>
                <FaCheckCircle size={24} style={{ marginBottom: '8px', color: '#10b981' }} />
                <p>No active alerts</p>
              </EmptyState>
            ) : (
              unresolvedAlerts.slice(0, 5).map((alert) => {
                const severityColors = getSeverityColor(alert.severity);
                const IconComponent = getAlertIcon(alert.alert_type);
                
                return (
                  <AlertItem
                    key={alert.id}
                    severityColor={severityColors.border}
                    severityBg={severityColors.bg}
                  >
                    <AlertHeader>
                      <AlertTitle>
                        <IconComponent style={{ marginRight: '8px' }} />
                        {alert.title}
                      </AlertTitle>
                      <AlertTime>
                        {format(parseISO(alert.created_at), 'MMM dd, HH:mm')}
                      </AlertTime>
                    </AlertHeader>
                    <AlertDescription>{alert.description}</AlertDescription>
                  </AlertItem>
                );
              })
            )}
          </AlertsPanel>
        </Sidebar>
      </ContentGrid>

      <FullWidthGrid>
        <ProductJourneyTimeline shipmentId={shipmentId} showControls={true} />
      </FullWidthGrid>
    </DashboardContainer>
  );
};

export default ShipmentDashboard;