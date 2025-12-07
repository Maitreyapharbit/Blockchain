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
  FaSync
} from 'react-icons/fa';
import { format, parseISO } from 'date-fns';
import { supabase } from '../config/supabase';
import { realtimeService } from '../services/realtimeService';
import { alertService } from '../services/alertService';
import { useSupabase } from '../contexts/SupabaseContext';
import toast from 'react-hot-toast';
import ConfirmModal from './ConfirmModal';
import ShipmentTimeline from './ShipmentTimeline';
import EnhancedAlerts from './EnhancedAlerts';
import ProductJourneyTimeline from './ProductJourneyTimeline';
import PricingComparisonDashboard from './PricingComparisonDashboard';
import EquipmentCalibrationTracker from './EquipmentCalibrationTracker';

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
  border-left: 4px solid ${props => props.$severityColor};
  background: ${props => props.$severityBg};
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
  background: ${props => props.$bgColor};
  color: ${props => props.$color};
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
  const [activeTab, setActiveTab] = useState('details');
  const { updateShipmentStatus } = useSupabase();

  const [selectedStatus, setSelectedStatus] = useState('pending');
  const [statusNotes, setStatusNotes] = useState('');
  const [statusLocation, setStatusLocation] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  useEffect(() => {
    if (shipmentId) {
      fetchShipmentData();
      setupRealtimeSubscriptions();
    }

    return () => {
      realtimeService.unsubscribeAll();
    };
  }, [shipmentId]);

  useEffect(() => {
    if (shipment) {
      setSelectedStatus(shipment.status || 'pending');
    }
  }, [shipment]);

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
      // Fetch shipment from API instead of Supabase directly
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:3001/api'}/shipments/${shipmentId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch shipment');
      }

      const result = await response.json();
      setShipment(result.data || result);
    } catch (error) {
      console.error('Error fetching shipment:', error);
      // Fallback: try Supabase
      try {
        const { data, error: sbError } = await supabase
          .from('shipments')
          .select('*')
          .eq('id', shipmentId)
          .single();

        if (sbError) throw sbError;
        setShipment(data);
      } catch (sbErr) {
        console.error('Fallback Supabase fetch also failed:', sbErr);
      }
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
      in_factory: { bg: '#eef2ff', color: '#3730a3' },
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

        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid #e5e7eb' }}
            >
              <option value="pending">Pending</option>
              <option value="in_transit">In Transit</option>
              <option value="in_factory">In Factory</option>
              <option value="delivered">Delivered</option>
              <option value="delayed">Delayed</option>
              <option value="damaged">Damaged</option>
              <option value="lost">Lost</option>
            </select>
            <button
              onClick={async () => {
                try {
                  setUpdatingStatus(true);
                  const { data, error } = await updateShipmentStatus(shipmentId, selectedStatus, { location: statusLocation, notes: statusNotes });
                  if (error) throw error;
                  setShipment(data);
                  toast.success('Shipment status updated');
                } catch (err) {
                  console.error('Quick status update failed', err);
                  toast.error('Failed to update status');
                } finally {
                  setUpdatingStatus(false);
                }
              }}
              style={{ padding: '8px 12px', borderRadius: 8, border: 'none', background: '#3b82f6', color: '#fff', cursor: 'pointer' }}
              disabled={updatingStatus}
            >
              {updatingStatus ? 'Updating...' : 'Set'}
            </button>
          </div>

          <RefreshButton onClick={handleRefresh} disabled={refreshing}>
            <FaSync className={refreshing ? 'animate-spin' : ''} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </RefreshButton>
        </div>
      </Header>

      <StatsGrid>
        <StatCard>
          <StatHeader>
            <StatIcon $bgColor="#3b82f6">
              <FaTruck />
            </StatIcon>
            <StatTitle>Status</StatTitle>
          </StatHeader>
          <StatusBadge $bgColor={statusColors.bg} $color={statusColors.color}>
            {shipment.status.replace('_', ' ').toUpperCase()}
          </StatusBadge>
        </StatCard>

        <StatCard>
          <StatHeader>
            <StatIcon $bgColor="#10b981">
              <FaCheckCircle />
            </StatIcon>
            <StatTitle>Alerts</StatTitle>
          </StatHeader>
          <StatValue>{unresolvedAlerts.length}</StatValue>
          <StatChange $positive={unresolvedAlerts.length === 0}>
            {unresolvedAlerts.length === 0 ? 'All Clear' : 'Active Alerts'}
          </StatChange>
        </StatCard>

        <StatCard>
          <StatHeader>
            <StatIcon $bgColor="#f59e0b">
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
            <StatIcon $bgColor="#8b5cf6">
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
              active={activeTab === 'details'} 
              onClick={() => setActiveTab('details')}
            >
              Detailed Information
            </TabButton>
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
            <TabButton 
              active={activeTab === 'pricing'} 
              onClick={() => setActiveTab('pricing')}
            >
              💰 Pricing Transparency
            </TabButton>
            <TabButton 
              active={activeTab === 'calibration'} 
              onClick={() => setActiveTab('calibration')}
            >
              🔧 Equipment Calibration
            </TabButton>
          </TabContainer>
          
          {activeTab === 'details' && (
            <div>
              <h3 style={{ margin: '0 0 20px 0', color: '#1f2937', fontSize: '18px', fontWeight: 600 }}>
                Complete Shipment Information
              </h3>
              
              {/* Basic Information */}
              <div style={{ marginBottom: '30px' }}>
                <h4 style={{ margin: '0 0 16px 0', color: '#374151', fontSize: '14px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  📋 Basic Information
                </h4>
                <div style={{ background: '#f9fafb', padding: '16px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                  <InfoRow>
                    <InfoLabel>Tracking Number:</InfoLabel>
                    <InfoValue>{shipment.tracking_number}</InfoValue>
                  </InfoRow>
                  <InfoRow>
                    <InfoLabel>Shipment ID:</InfoLabel>
                    <InfoValue style={{ fontSize: '12px', fontFamily: 'monospace' }}>{shipment.id}</InfoValue>
                  </InfoRow>
                  <InfoRow>
                    <InfoLabel>Status:</InfoLabel>
                    <InfoValue>
                      <StatusBadge $bgColor={statusColors.bg} $color={statusColors.color}>
                        {shipment.status.replace('_', ' ').toUpperCase()}
                      </StatusBadge>
                    </InfoValue>
                  </InfoRow>
                  <InfoRow>
                    <InfoLabel>Created:</InfoLabel>
                    <InfoValue>{format(parseISO(shipment.created_at), 'MMM dd, yyyy HH:mm')}</InfoValue>
                  </InfoRow>
                </div>
              </div>

              {/* Location Information */}
              <div style={{ marginBottom: '30px' }}>
                <h4 style={{ margin: '0 0 16px 0', color: '#374151', fontSize: '14px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  📍 Location Information
                </h4>
                <div style={{ background: '#f9fafb', padding: '16px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                  <InfoRow>
                    <InfoLabel>Origin Location:</InfoLabel>
                    <InfoValue>{shipment.origin_location}</InfoValue>
                  </InfoRow>
                  <InfoRow>
                    <InfoLabel>Destination Location:</InfoLabel>
                    <InfoValue>{shipment.destination_location}</InfoValue>
                  </InfoRow>
                  {shipment.current_location && (
                    <InfoRow>
                      <InfoLabel>Current Location:</InfoLabel>
                      <InfoValue>{shipment.current_location}</InfoValue>
                    </InfoRow>
                  )}
                </div>
              </div>

              {/* Delivery Schedule */}
              <div style={{ marginBottom: '30px' }}>
                <h4 style={{ margin: '0 0 16px 0', color: '#374151', fontSize: '14px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  📅 Delivery Schedule
                </h4>
                <div style={{ background: '#f9fafb', padding: '16px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
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
                </div>
              </div>

              {/* Environmental Conditions */}
              <div style={{ marginBottom: '30px' }}>
                <h4 style={{ margin: '0 0 16px 0', color: '#374151', fontSize: '14px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  🌡️ Environmental Conditions
                </h4>
                <div style={{ background: '#f9fafb', padding: '16px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                  <InfoRow>
                    <InfoLabel>Current Temperature:</InfoLabel>
                    <InfoValue>
                      {shipment.current_temperature ? `${shipment.current_temperature}°C` : 'N/A'}
                    </InfoValue>
                  </InfoRow>
                  <InfoRow>
                    <InfoLabel>Temperature Range:</InfoLabel>
                    <InfoValue>
                      {shipment.temperature_min && shipment.temperature_max 
                        ? `${shipment.temperature_min}°C - ${shipment.temperature_max}°C`
                        : 'Not specified'
                      }
                    </InfoValue>
                  </InfoRow>
                  <InfoRow>
                    <InfoLabel>Current Humidity:</InfoLabel>
                    <InfoValue>
                      {shipment.current_humidity ? `${shipment.current_humidity}%` : 'N/A'}
                    </InfoValue>
                  </InfoRow>
                  <InfoRow>
                    <InfoLabel>Humidity Range:</InfoLabel>
                    <InfoValue>
                      {shipment.humidity_min && shipment.humidity_max 
                        ? `${shipment.humidity_min}% - ${shipment.humidity_max}%`
                        : 'Not specified'
                      }
                    </InfoValue>
                  </InfoRow>
                </div>
              </div>

              {/* Batch Information */}
              {shipment.batch_id && (
                <div style={{ marginBottom: '30px' }}>
                  <h4 style={{ margin: '0 0 16px 0', color: '#374151', fontSize: '14px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    📦 Associated Batch
                  </h4>
                  <div style={{ background: '#f9fafb', padding: '16px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                    <InfoRow>
                      <InfoLabel>Batch ID:</InfoLabel>
                      <InfoValue style={{ fontSize: '12px', fontFamily: 'monospace' }}>{shipment.batch_id}</InfoValue>
                    </InfoRow>
                    {shipment.batches && (
                      <>
                        <InfoRow>
                          <InfoLabel>Batch Number:</InfoLabel>
                          <InfoValue>{shipment.batches.batch_number || 'N/A'}</InfoValue>
                        </InfoRow>
                        <InfoRow>
                          <InfoLabel>Product Name:</InfoLabel>
                          <InfoValue>{shipment.batches.drug_name || 'N/A'}</InfoValue>
                        </InfoRow>
                        <InfoRow>
                          <InfoLabel>Batch Status:</InfoLabel>
                          <InfoValue>
                            <StatusBadge $bgColor="#dbeafe" $color="#1e40af">
                              {shipment.batches.status || 'N/A'}
                            </StatusBadge>
                          </InfoValue>
                        </InfoRow>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Additional Details */}
              {shipment.metadata && Object.keys(shipment.metadata).length > 0 && (
                <div style={{ marginBottom: '30px' }}>
                  <h4 style={{ margin: '0 0 16px 0', color: '#374151', fontSize: '14px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    ⚙️ Additional Metadata
                  </h4>
                  <div style={{ background: '#f9fafb', padding: '16px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                    {Object.entries(shipment.metadata).map(([key, value]) => (
                      <InfoRow key={key}>
                        <InfoLabel>{key}:</InfoLabel>
                        <InfoValue>
                          {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                        </InfoValue>
                      </InfoRow>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          
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
            <InfoRow style={{ alignItems: 'center', gap: 12 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
                <label style={{ fontSize: 12, color: '#6b7280', fontWeight: 600 }}>Update Status</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #e5e7eb', flex: 1 }}
                  >
                    <option value="pending">Pending</option>
                    <option value="in_transit">In Transit</option>
                    <option value="in_factory">In Factory</option>
                    <option value="delivered">Delivered</option>
                    <option value="delayed">Delayed</option>
                    <option value="damaged">Damaged</option>
                    <option value="lost">Lost</option>
                  </select>
                </div>
                <input
                  placeholder="Location (optional)"
                  value={statusLocation}
                  onChange={(e) => setStatusLocation(e.target.value)}
                  style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #e5e7eb' }}
                />
                <input
                  placeholder="Notes (optional)"
                  value={statusNotes}
                  onChange={(e) => setStatusNotes(e.target.value)}
                  style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #e5e7eb' }}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <button
                  onClick={async () => {
                    // If marking as delivered, show confirmation modal first
                    if (selectedStatus === 'delivered') {
                      setShowConfirmModal(true);
                      return;
                    }

                    try {
                      setUpdatingStatus(true);
                      const { data, error } = await updateShipmentStatus(shipmentId, selectedStatus, { location: statusLocation, notes: statusNotes });
                      if (error) throw error;
                      setShipment(data);
                      toast.success('Shipment status updated');
                    } catch (err) {
                      console.error('Status update failed', err);
                      toast.error('Failed to update status');
                    } finally {
                      setUpdatingStatus(false);
                    }
                  }}
                  style={{ padding: '10px 16px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer' }}
                  disabled={updatingStatus}
                >
                  {updatingStatus ? 'Updating...' : 'Update'}
                </button>
              </div>
            </InfoRow>

            <ConfirmModal
              open={showConfirmModal}
              title="Confirm Delivery"
              message={
                <p>
                  Marking shipment <strong>{shipment?.tracking_number}</strong> as <strong>Delivered</strong> will set the actual delivery date to now. Continue?
                </p>
              }
              onCancel={() => setShowConfirmModal(false)}
              onConfirm={async () => {
                try {
                  setUpdatingStatus(true);
                  const actual_delivery_date = new Date().toISOString();
                  const { data, error } = await updateShipmentStatus(shipmentId, 'delivered', { location: statusLocation, notes: statusNotes, actual_delivery_date });
                  if (error) throw error;
                  setShipment(data);
                  setShowConfirmModal(false);
                  toast.success('Shipment marked as delivered');
                } catch (err) {
                  console.error('Delivery confirmation failed', err);
                  toast.error('Failed to mark as delivered');
                } finally {
                  setUpdatingStatus(false);
                }
              }}
              cancelLabel="Cancel"
              confirmLabel="Confirm Delivery"
              loading={updatingStatus}
            />
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
                    $severityColor={severityColors.border}
                    $severityBg={severityColors.bg}
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