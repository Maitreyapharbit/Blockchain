import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { format, parseISO, isAfter, isBefore, differenceInHours, differenceInDays } from 'date-fns';
import { 
  FaIndustry, 
  FaTruck, 
  FaThermometerHalf, 
  FaMapMarkerAlt, 
  FaClock, 
  FaCheckCircle, 
  FaExclamationTriangle,
  FaTimesCircle,
  FaEye,
  FaEyeSlash,
  FaFilter,
  FaSearch,
  FaDownload,
  FaPrint
} from 'react-icons/fa';
import { supabase } from '../config/supabase';

const TimelineContainer = styled.div`
  position: relative;
  padding: 20px 0;
  max-width: 1000px;
  margin: 0 auto;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.05);
  border: 1px solid #e5e7eb;
`;

const TimelineHeader = styled.div`
  padding: 24px 24px 0 24px;
  border-bottom: 2px solid #e5e7eb;
  margin-bottom: 20px;
`;

const TimelineTitle = styled.h2`
  margin: 0 0 16px 0;
  color: #1f2937;
  font-size: 24px;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 12px;
`;

const TimelineSubtitle = styled.p`
  margin: 0 0 20px 0;
  color: #6b7280;
  font-size: 14px;
`;

const ControlsContainer = styled.div`
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
  margin-bottom: 20px;
`;

const FilterButton = styled.button`
  padding: 8px 16px;
  border: 1px solid #d1d5db;
  border-radius: 20px;
  background: ${props => props.active ? '#3b82f6' : 'white'};
  color: ${props => props.active ? 'white' : '#374151'};
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 6px;
  
  &:hover {
    border-color: #3b82f6;
    background: ${props => props.active ? '#3b82f6' : '#f8fafc'};
  }
`;

const SearchInput = styled.input`
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  color: #374151;
  min-width: 200px;
  
  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
`;

const ActionButton = styled.button`
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background: white;
  color: #374151;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 6px;
  
  &:hover {
    background: #f3f4f6;
    border-color: #3b82f6;
  }
`;

const TimelineLine = styled.div`
  position: absolute;
  left: 40px;
  top: 80px;
  bottom: 20px;
  width: 3px;
  background: linear-gradient(to bottom, #3b82f6, #8b5cf6, #10b981);
  border-radius: 2px;
  z-index: 1;
`;

const JourneyPhase = styled.div`
  margin-bottom: 40px;
  position: relative;
`;

const PhaseHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
  padding: 0 24px;
`;

const PhaseIcon = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: ${props => props.bgColor || '#3b82f6'};
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 18px;
  z-index: 2;
  border: 4px solid white;
  box-shadow: 0 4px 8px rgba(0,0,0,0.1);
`;

const PhaseInfo = styled.div`
  flex: 1;
`;

const PhaseTitle = styled.h3`
  margin: 0 0 4px 0;
  color: #1f2937;
  font-size: 18px;
  font-weight: 600;
`;

const PhaseDescription = styled.p`
  margin: 0;
  color: #6b7280;
  font-size: 14px;
`;

const PhaseDuration = styled.div`
  color: #9ca3af;
  font-size: 12px;
  font-weight: 500;
`;

const EventsList = styled.div`
  padding: 0 24px 0 80px;
`;

const EventItem = styled.div`
  position: relative;
  margin-bottom: 20px;
  padding: 16px;
  background: ${props => props.isAnomaly ? '#fef2f2' : 'white'};
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
  border-left: 4px solid ${props => props.borderColor || '#3b82f6'};
  transition: all 0.2s ease;
  opacity: ${props => props.isCollapsed ? 0.6 : 1};
  
  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  }
`;

const EventIcon = styled.div`
  position: absolute;
  left: -12px;
  top: 16px;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: ${props => props.bgColor || '#3b82f6'};
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 12px;
  z-index: 2;
  border: 3px solid white;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
`;

const EventHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 8px;
`;

const EventTitle = styled.h4`
  margin: 0;
  color: #1f2937;
  font-size: 14px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const EventTime = styled.span`
  color: #6b7280;
  font-size: 12px;
  font-weight: 500;
`;

const EventDescription = styled.p`
  margin: 8px 0;
  color: #4b5563;
  font-size: 13px;
  line-height: 1.4;
`;

const EventData = styled.div`
  margin-top: 12px;
  padding: 12px;
  background: #f9fafb;
  border-radius: 6px;
  border: 1px solid #e5e7eb;
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

const CollapseButton = styled.button`
  position: absolute;
  top: 12px;
  right: 12px;
  background: none;
  border: none;
  color: #6b7280;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: all 0.2s ease;
  
  &:hover {
    background: #f3f4f6;
    color: #374151;
  }
`;

const AnomalyBadge = styled.span`
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  background: #fecaca;
  color: #991b1b;
  margin-left: 8px;
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

const ProductJourneyTimeline = ({ shipmentId, showControls = true }) => {
  const [shipment, setShipment] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [collapsedEvents, setCollapsedEvents] = useState(new Set());

  useEffect(() => {
    fetchData();
  }, [shipmentId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchShipment(),
        fetchEvents()
      ]);
    } catch (error) {
      console.error('Error fetching data:', error);
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

  const fetchEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('shipment_events')
        .select('*')
        .eq('shipment_id', shipmentId)
        .order('timestamp', { ascending: true });

      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      console.error('Error fetching events:', error);
    }
  };

  const getPhaseInfo = (phase) => {
    const phases = {
      manufacturing: {
        title: 'Manufacturing',
        description: 'Product creation and initial quality control',
        icon: FaIndustry,
        color: '#3b82f6'
      },
      packaging: {
        title: 'Packaging',
        description: 'Product packaging and labeling',
        icon: FaCheckCircle,
        color: '#8b5cf6'
      },
      dispatch: {
        title: 'Dispatch',
        description: 'Product leaves manufacturing facility',
        icon: FaTruck,
        color: '#f59e0b'
      },
      transit: {
        title: 'In Transit',
        description: 'Product journey to destination',
        icon: FaTruck,
        color: '#10b981'
      },
      delivery: {
        title: 'Delivery',
        description: 'Product reaches final destination',
        icon: FaCheckCircle,
        color: '#10b981'
      }
    };
    return phases[phase] || phases.manufacturing;
  };

  const getEventIcon = (eventType) => {
    const icons = {
      created: FaCheckCircle,
      dispatched: FaTruck,
      in_transit: FaTruck,
      temperature_check: FaThermometerHalf,
      location_update: FaMapMarkerAlt,
      delay: FaClock,
      delivered: FaCheckCircle,
      damaged: FaTimesCircle,
      lost: FaExclamationTriangle
    };
    return icons[eventType] || FaCheckCircle;
  };

  const getEventColor = (eventType, eventData) => {
    if (eventType === 'damaged' || eventType === 'lost') return '#dc2626';
    if (eventType === 'delay') return '#f59e0b';
    if (eventType === 'delivered') return '#10b981';
    if (eventType === 'temperature_check' && eventData?.is_anomaly) return '#dc2626';
    return '#3b82f6';
  };

  const formatEventData = (eventData) => {
    if (!eventData || typeof eventData !== 'object') return null;

    const data = [];
    
    if (eventData.temperature !== undefined) {
      data.push({
        label: 'Temperature',
        value: `${eventData.temperature}°C`
      });
    }
    
    if (eventData.humidity !== undefined) {
      data.push({
        label: 'Humidity',
        value: `${eventData.humidity}%`
      });
    }
    
    if (eventData.location) {
      data.push({
        label: 'Location',
        value: eventData.location
      });
    }
    
    if (eventData.delay_hours) {
      data.push({
        label: 'Delay',
        value: `${eventData.delay_hours} hours`
      });
    }

    return data;
  };

  const toggleEventCollapse = (eventId) => {
    const newCollapsed = new Set(collapsedEvents);
    if (newCollapsed.has(eventId)) {
      newCollapsed.delete(eventId);
    } else {
      newCollapsed.add(eventId);
    }
    setCollapsedEvents(newCollapsed);
  };

  const groupEventsByPhase = (events) => {
    const phases = {
      manufacturing: [],
      packaging: [],
      dispatch: [],
      transit: [],
      delivery: []
    };

    events.forEach(event => {
      if (event.event_type === 'created') {
        phases.manufacturing.push(event);
      } else if (event.event_type === 'dispatched') {
        phases.dispatch.push(event);
      } else if (event.event_type === 'in_transit' || event.event_type === 'temperature_check' || event.event_type === 'location_update') {
        phases.transit.push(event);
      } else if (event.event_type === 'delivered') {
        phases.delivery.push(event);
      } else {
        phases.transit.push(event);
      }
    });

    return phases;
  };

  const filteredEvents = events.filter(event => {
    if (filter === 'all') return true;
    if (filter === 'temperature') return event.event_type === 'temperature_check';
    if (filter === 'location') return event.event_type === 'location_update';
    if (filter === 'alerts') return event.event_data?.is_anomaly || event.event_type === 'delay' || event.event_type === 'damaged';
    if (filter === 'delays') return event.event_type === 'delay';
    return true;
  }).filter(event => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      event.description?.toLowerCase().includes(searchLower) ||
      event.event_type.toLowerCase().includes(searchLower) ||
      event.location?.toLowerCase().includes(searchLower)
    );
  });

  const groupedEvents = groupEventsByPhase(filteredEvents);

  if (loading) {
    return (
      <TimelineContainer>
        <LoadingState>Loading journey timeline...</LoadingState>
      </TimelineContainer>
    );
  }

  if (!shipment) {
    return (
      <TimelineContainer>
        <EmptyState>
          <FaTruck size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
          <p>Shipment not found</p>
        </EmptyState>
      </TimelineContainer>
    );
  }

  return (
    <TimelineContainer>
      <TimelineHeader>
        <TimelineTitle>
          Product Journey Timeline
        </TimelineTitle>
        <TimelineSubtitle>
          Complete journey from {shipment.origin_location} to {shipment.destination_location}
        </TimelineSubtitle>

        {showControls && (
          <ControlsContainer>
            <FilterButton
              active={filter === 'all'}
              onClick={() => setFilter('all')}
            >
              All Events
            </FilterButton>
            <FilterButton
              active={filter === 'temperature'}
              onClick={() => setFilter('temperature')}
            >
              <FaThermometerHalf />
              Temperature
            </FilterButton>
            <FilterButton
              active={filter === 'location'}
              onClick={() => setFilter('location')}
            >
              <FaMapMarkerAlt />
              Location
            </FilterButton>
            <FilterButton
              active={filter === 'alerts'}
              onClick={() => setFilter('alerts')}
            >
              <FaExclamationTriangle />
              Alerts
            </FilterButton>
            <FilterButton
              active={filter === 'delays'}
              onClick={() => setFilter('delays')}
            >
              <FaClock />
              Delays
            </FilterButton>
            
            <SearchInput
              type="text"
              placeholder="Search events..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            
            <ActionButton>
              <FaDownload />
              Export
            </ActionButton>
            <ActionButton>
              <FaPrint />
              Print
            </ActionButton>
          </ControlsContainer>
        )}
      </TimelineHeader>

      <TimelineLine />
      
      {Object.entries(groupedEvents).map(([phaseKey, phaseEvents]) => {
        if (phaseEvents.length === 0) return null;
        
        const phaseInfo = getPhaseInfo(phaseKey);
        const IconComponent = phaseInfo.icon;
        
        return (
          <JourneyPhase key={phaseKey}>
            <PhaseHeader>
              <PhaseIcon bgColor={phaseInfo.color}>
                <IconComponent />
              </PhaseIcon>
              <PhaseInfo>
                <PhaseTitle>{phaseInfo.title}</PhaseTitle>
                <PhaseDescription>{phaseInfo.description}</PhaseDescription>
              </PhaseInfo>
              <PhaseDuration>
                {phaseEvents.length} event{phaseEvents.length !== 1 ? 's' : ''}
              </PhaseDuration>
            </PhaseHeader>
            
            <EventsList>
              {phaseEvents.map((event) => {
                const EventIconComponent = getEventIcon(event.event_type);
                const eventColor = getEventColor(event.event_type, event.event_data);
                const eventData = formatEventData(event.event_data);
                const isCollapsed = collapsedEvents.has(event.id);
                
                return (
                  <EventItem
                    key={event.id}
                    borderColor={eventColor}
                    isAnomaly={event.event_data?.is_anomaly}
                    isCollapsed={isCollapsed}
                  >
                    <EventIcon bgColor={eventColor}>
                      <EventIconComponent size={12} />
                    </EventIcon>
                    
                    <CollapseButton
                      onClick={() => toggleEventCollapse(event.id)}
                      title={isCollapsed ? 'Expand' : 'Collapse'}
                    >
                      {isCollapsed ? <FaEye /> : <FaEyeSlash />}
                    </CollapseButton>
                    
                    <EventHeader>
                      <EventTitle>
                        {event.event_type.replace('_', ' ').toUpperCase()}
                        {event.event_data?.is_anomaly && <AnomalyBadge>ANOMALY</AnomalyBadge>}
                      </EventTitle>
                      <EventTime>
                        {format(parseISO(event.timestamp), 'MMM dd, yyyy HH:mm')}
                      </EventTime>
                    </EventHeader>
                    
                    {event.description && (
                      <EventDescription>{event.description}</EventDescription>
                    )}
                    
                    {eventData && eventData.length > 0 && !isCollapsed && (
                      <EventData>
                        {eventData.map((item, index) => (
                          <DataRow key={index}>
                            <DataLabel>{item.label}:</DataLabel>
                            <DataValue>{item.value}</DataValue>
                          </DataRow>
                        ))}
                      </EventData>
                    )}
                  </EventItem>
                );
              })}
            </EventsList>
          </JourneyPhase>
        );
      })}
    </TimelineContainer>
  );
};

export default ProductJourneyTimeline;