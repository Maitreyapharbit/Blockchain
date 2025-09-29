import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { 
  FaPlus, 
  FaTruck, 
  FaBell, 
  FaThermometerHalf,
  FaMapMarkerAlt,
  FaSearch,
  FaFilter,
  FaSignOutAlt,
  FaUser
} from 'react-icons/fa';
import { useSupabase } from '../contexts/SupabaseContext';
import ShipmentDashboard from './ShipmentDashboard';
import ShipmentTimeline from './ShipmentTimeline';
import AuthComponent from './AuthComponent';
import toast from 'react-hot-toast';

const AppContainer = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
`;

const Header = styled.header`
  background: white;
  border-radius: 16px;
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: 0 10px 25px rgba(0,0,0,0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const Title = styled.h1`
  margin: 0;
  color: #1f2937;
  font-size: 32px;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 12px;
`;

const HeaderActions = styled.div`
  display: flex;
  gap: 12px;
  align-items: center;
`;

const UserInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 16px;
  background: #f8fafc;
  border-radius: 12px;
  color: #374151;
  font-weight: 500;
`;

const SignOutButton = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: #ef4444;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: #dc2626;
    transform: translateY(-1px);
  }
`;

const SearchContainer = styled.div`
  position: relative;
  display: flex;
  align-items: center;
`;

const SearchInput = styled.input`
  padding: 12px 16px 12px 40px;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  font-size: 14px;
  width: 300px;
  transition: all 0.2s ease;
  
  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
`;

const SearchIcon = styled(FaSearch)`
  position: absolute;
  left: 12px;
  color: #6b7280;
  font-size: 14px;
`;

const FilterButton = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: #f8fafc;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  color: #374151;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: #e5e7eb;
    border-color: #d1d5db;
  }
`;

const AlertButton = styled.button`
  position: relative;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: #ef4444;
  color: white;
  border: none;
  border-radius: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: #dc2626;
    transform: translateY(-1px);
  }
`;

const AlertBadge = styled.span`
  position: absolute;
  top: -4px;
  right: -4px;
  background: #fbbf24;
  color: #92400e;
  font-size: 12px;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 10px;
  min-width: 18px;
  text-align: center;
`;

const CreateButton = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  background: #10b981;
  color: white;
  border: none;
  border-radius: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: #059669;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
  }
`;

const MainContent = styled.div`
  display: grid;
  grid-template-columns: 1fr 400px;
  gap: 24px;
  
  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
  }
`;

const ShipmentsList = styled.div`
  background: white;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 10px 25px rgba(0,0,0,0.1);
  max-height: 80vh;
  overflow-y: auto;
`;

const ShipmentCard = styled.div`
  border: 2px solid ${props => props.borderColor || '#e5e7eb'};
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 16px;
  cursor: pointer;
  transition: all 0.2s ease;
  background: ${props => props.isSelected ? '#f0f9ff' : 'white'};
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0,0,0,0.1);
    border-color: #3b82f6;
  }
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const ShipmentHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
`;

const ShipmentTitle = styled.h3`
  margin: 0;
  color: #1f2937;
  font-size: 18px;
  font-weight: 600;
`;

const StatusBadge = styled.span`
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  background: ${props => props.bgColor};
  color: ${props => props.color};
`;

const ShipmentDetails = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 16px;
`;

const DetailItem = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  color: #6b7280;
  font-size: 14px;
`;

const DetailValue = styled.span`
  color: #1f2937;
  font-weight: 500;
`;

const ShipmentProgress = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 12px;
`;

const ProgressBar = styled.div`
  flex: 1;
  height: 6px;
  background: #e5e7eb;
  border-radius: 3px;
  overflow: hidden;
`;

const ProgressFill = styled.div`
  height: 100%;
  background: linear-gradient(90deg, #3b82f6, #8b5cf6);
  width: ${props => props.percentage}%;
  transition: width 0.3s ease;
`;

const ProgressText = styled.span`
  font-size: 12px;
  color: #6b7280;
  font-weight: 500;
  min-width: 40px;
  text-align: right;
`;

const Sidebar = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
`;

const AlertsPanel = styled.div`
  background: white;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 10px 25px rgba(0,0,0,0.1);
  max-height: 400px;
  overflow-y: auto;
`;

const PanelHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 2px solid #e5e7eb;
`;

const PanelTitle = styled.h3`
  margin: 0;
  color: #1f2937;
  font-size: 20px;
  font-weight: 600;
`;

const AlertItem = styled.div`
  padding: 16px;
  border-radius: 12px;
  border-left: 4px solid ${props => props.severityColor};
  background: ${props => props.severityBg};
  margin-bottom: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    transform: translateX(4px);
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

const ShipmentTrackingApp = () => {
  const { 
    user, 
    loading, 
    shipments, 
    alerts, 
    getUnresolvedAlerts,
    getShipmentById,
    resolveAlert,
    signOut
  } = useSupabase();

  const [selectedShipmentId, setSelectedShipmentId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showAlerts, setShowAlerts] = useState(false);

  const unresolvedAlerts = getUnresolvedAlerts();

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

  const getProgressPercentage = (shipment) => {
    const statuses = ['pending', 'in_transit', 'delivered'];
    const currentIndex = statuses.indexOf(shipment.status);
    return ((currentIndex + 1) / statuses.length) * 100;
  };

  const filteredShipments = shipments.filter(shipment => {
    const matchesSearch = 
      shipment.tracking_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      shipment.origin_location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      shipment.destination_location.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || shipment.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const handleShipmentSelect = (shipmentId) => {
    setSelectedShipmentId(shipmentId);
  };

  const handleAlertClick = async (alert) => {
    // Navigate to shipment details
    setSelectedShipmentId(alert.shipment_id);
    setShowAlerts(false);
  };

  const handleResolveAlert = async (alertId, event) => {
    event.stopPropagation();
    try {
      await resolveAlert(alertId, 'Resolved from dashboard');
      toast.success('Alert resolved successfully');
    } catch (error) {
      toast.error('Failed to resolve alert');
    }
  };

  if (loading) {
    return (
      <AppContainer>
        <LoadingState>Loading shipment tracking system...</LoadingState>
      </AppContainer>
    );
  }

  if (!user) {
    return <AuthComponent />;
  }

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success('Signed out successfully');
    } catch (error) {
      toast.error('Failed to sign out');
    }
  };

  return (
    <AppContainer>
      <Header>
        <Title>
          <FaTruck />
          Shipment Tracking
        </Title>
        
        <HeaderActions>
          <SearchContainer>
            <SearchIcon />
            <SearchInput
              type="text"
              placeholder="Search shipments..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </SearchContainer>
          
          <FilterButton onClick={() => setStatusFilter(statusFilter === 'all' ? 'in_transit' : 'all')}>
            <FaFilter />
            {statusFilter === 'all' ? 'All' : 'In Transit'}
          </FilterButton>
          
          <AlertButton onClick={() => setShowAlerts(!showAlerts)}>
            <FaBell />
            Alerts
            {unresolvedAlerts.length > 0 && (
              <AlertBadge>{unresolvedAlerts.length}</AlertBadge>
            )}
          </AlertButton>
          
          <CreateButton>
            <FaPlus />
            New Shipment
          </CreateButton>
          
          <UserInfo>
            <FaUser />
            {user.email}
          </UserInfo>
          
          <SignOutButton onClick={handleSignOut}>
            <FaSignOutAlt />
            Sign Out
          </SignOutButton>
        </HeaderActions>
      </Header>

      <MainContent>
        <ShipmentsList>
          <h2 style={{ margin: '0 0 20px 0', color: '#1f2937' }}>
            Your Shipments ({filteredShipments.length})
          </h2>
          
          {filteredShipments.length === 0 ? (
            <EmptyState>
              <FaTruck size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
              <p>No shipments found</p>
            </EmptyState>
          ) : (
            filteredShipments.map((shipment) => {
              const statusColors = getStatusColor(shipment.status);
              const isSelected = selectedShipmentId === shipment.id;
              const progress = getProgressPercentage(shipment);
              
              return (
                <ShipmentCard
                  key={shipment.id}
                  onClick={() => handleShipmentSelect(shipment.id)}
                  isSelected={isSelected}
                  borderColor={isSelected ? '#3b82f6' : statusColors.bg}
                >
                  <ShipmentHeader>
                    <ShipmentTitle>{shipment.tracking_number}</ShipmentTitle>
                    <StatusBadge bgColor={statusColors.bg} color={statusColors.color}>
                      {shipment.status.replace('_', ' ')}
                    </StatusBadge>
                  </ShipmentHeader>
                  
                  <ShipmentDetails>
                    <DetailItem>
                      <FaMapMarkerAlt />
                      <span>From:</span>
                      <DetailValue>{shipment.origin_location}</DetailValue>
                    </DetailItem>
                    <DetailItem>
                      <FaMapMarkerAlt />
                      <span>To:</span>
                      <DetailValue>{shipment.destination_location}</DetailValue>
                    </DetailItem>
                    <DetailItem>
                      <FaThermometerHalf />
                      <span>Temp:</span>
                      <DetailValue>
                        {shipment.current_temperature ? `${shipment.current_temperature}°C` : 'N/A'}
                      </DetailValue>
                    </DetailItem>
                    <DetailItem>
                      <span>Batch:</span>
                      <DetailValue>{shipment.batches?.batch_number || 'N/A'}</DetailValue>
                    </DetailItem>
                  </ShipmentDetails>
                  
                  <ShipmentProgress>
                    <ProgressBar>
                      <ProgressFill percentage={progress} />
                    </ProgressBar>
                    <ProgressText>{Math.round(progress)}%</ProgressText>
                  </ShipmentProgress>
                </ShipmentCard>
              );
            })
          )}
        </ShipmentsList>

        <Sidebar>
          {selectedShipmentId ? (
            <ShipmentDashboard shipmentId={selectedShipmentId} />
          ) : (
            <EmptyState>
              <FaTruck size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
              <p>Select a shipment to view details</p>
            </EmptyState>
          )}

          {showAlerts && (
            <AlertsPanel>
              <PanelHeader>
                <FaBell color="#ef4444" />
                <PanelTitle>Active Alerts ({unresolvedAlerts.length})</PanelTitle>
              </PanelHeader>
              
              {unresolvedAlerts.length === 0 ? (
                <EmptyState>
                  <FaBell size={24} style={{ marginBottom: '8px', color: '#10b981' }} />
                  <p>No active alerts</p>
                </EmptyState>
              ) : (
                unresolvedAlerts.slice(0, 5).map((alert) => {
                  const severityColors = getSeverityColor(alert.severity);
                  
                  return (
                    <AlertItem
                      key={alert.id}
                      onClick={() => handleAlertClick(alert)}
                      severityColor={severityColors.border}
                      severityBg={severityColors.bg}
                    >
                      <AlertHeader>
                        <AlertTitle>{alert.title}</AlertTitle>
                        <AlertTime>
                          {new Date(alert.created_at).toLocaleDateString()}
                        </AlertTime>
                      </AlertHeader>
                      <AlertDescription>{alert.description}</AlertDescription>
                    </AlertItem>
                  );
                })
              )}
            </AlertsPanel>
          )}
        </Sidebar>
      </MainContent>
    </AppContainer>
  );
};

export default ShipmentTrackingApp;