import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { format, parseISO, isAfter, isBefore } from 'date-fns';
import { 
  FaTruck, 
  FaThermometerHalf, 
  FaMapMarkerAlt, 
  FaClock, 
  FaCheckCircle, 
  FaExclamationTriangle,
  FaTimesCircle,
  FaEye,
  FaEyeSlash
} from 'react-icons/fa';
import { supabase } from '../config/supabase';
import { alertService } from '../services/alertService';

const TimelineContainer = styled.div`
  position: relative;
  padding: 20px 0;
  max-width: 800px;
  margin: 0 auto;
`;

const TimelineLine = styled.div`
  position: absolute;
  left: 30px;
  top: 0;
  bottom: 0;
  width: 2px;
  background: linear-gradient(to bottom, #3b82f6, #8b5cf6);
  border-radius: 1px;
`;

const EventItem = styled.div`
  position: relative;
  margin-bottom: 30px;
  padding-left: 80px;
  opacity: ${props => props.isCollapsed ? 0.6 : 1};
  transition: opacity 0.3s ease;
`;

const EventIcon = styled.div`
  position: absolute;
  left: 20px;
  top: 5px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: ${props => props.$bgColor || '#3b82f6'};
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 10px;
  z-index: 2;
  border: 3px solid white;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
`;

const EventContent = styled.div`
  background: white;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  border-left: 4px solid ${props => props.$borderColor || '#3b82f6'};
  position: relative;
  
  &::before {
    content: '';
    position: absolute;
    left: -8px;
    top: 12px;
    width: 0;
    height: 0;
    border-top: 6px solid transparent;
    border-bottom: 6px solid transparent;
    border-right: 6px solid ${props => props.$borderColor || '#3b82f6'};
  }
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
  font-size: 16px;
  font-weight: 600;
`;

const EventTime = styled.span`
  color: #6b7280;
  font-size: 14px;
  font-weight: 500;
`;

const EventDescription = styled.p`
  margin: 8px 0;
  color: #4b5563;
  font-size: 14px;
  line-height: 1.5;
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
  font-size: 13px;
  font-weight: 500;
`;

const DataValue = styled.span`
  color: #1f2937;
  font-size: 13px;
  font-weight: 600;
`;

const TemperatureValue = styled.span`
  color: ${props => {
    if (props.isAnomaly) return '#dc2626';
    if (props.isWarning) return '#f59e0b';
    return '#10b981';
  }};
  font-weight: 600;
`;

const CollapseButton = styled.button`
  position: absolute;
  top: 20px;
  right: 20px;
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

const FilterContainer = styled.div`
  margin-bottom: 20px;
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  align-items: center;
`;

const FilterButton = styled.button`
  padding: 6px 12px;
  border: 1px solid #d1d5db;
  border-radius: 20px;
  background: ${props => props.active ? '#3b82f6' : 'white'};
  color: ${props => props.active ? 'white' : '#374151'};
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    border-color: #3b82f6;
    background: ${props => props.active ? '#3b82f6' : '#f8fafc'};
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

const ShipmentTimeline = ({ shipmentId, showFilters = true }) => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [collapsedEvents, setCollapsedEvents] = useState(new Set());

  useEffect(() => {
    fetchEvents();
  }, [shipmentId]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('shipment_events')
        .select('*')
        .eq('shipment_id', shipmentId)
        .order('timestamp', { ascending: false });

      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
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

  const getEventTitle = (eventType, eventData) => {
    const titles = {
      created: 'Shipment Created',
      dispatched: 'Shipment Dispatched',
      in_transit: 'In Transit',
      temperature_check: 'Temperature Check',
      location_update: 'Location Update',
      delay: 'Delay Detected',
      delivered: 'Delivered',
      damaged: 'Damage Detected',
      lost: 'Shipment Lost'
    };
    return titles[eventType] || eventType.replace('_', ' ').toUpperCase();
  };

  const formatEventData = (eventData) => {
    if (!eventData || typeof eventData !== 'object') return null;

    const data = [];
    
    if (eventData.temperature !== undefined) {
      data.push({
        label: 'Temperature',
        value: `${eventData.temperature}°C`,
        isTemperature: true,
        isAnomaly: eventData.is_anomaly,
        isWarning: eventData.temperature_warning
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
    
    if (eventData.notes) {
      data.push({
        label: 'Notes',
        value: eventData.notes
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

  const filteredEvents = events.filter(event => {
    if (filter === 'all') return true;
    if (filter === 'temperature') return event.event_type === 'temperature_check';
    if (filter === 'alerts') return event.event_data?.is_anomaly || event.event_type === 'delay' || event.event_type === 'damaged';
    return true;
  });

  if (loading) {
    return (
      <TimelineContainer>
        <LoadingState>Loading events...</LoadingState>
      </TimelineContainer>
    );
  }

  if (events.length === 0) {
    return (
      <TimelineContainer>
        <EmptyState>
          <FaTruck size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
          <p>No events recorded for this shipment yet.</p>
        </EmptyState>
      </TimelineContainer>
    );
  }

  return (
    <TimelineContainer>
      {showFilters && (
        <FilterContainer>
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
            Temperature
          </FilterButton>
          <FilterButton
            active={filter === 'location'}
            onClick={() => setFilter('location')}
          >
            Location
          </FilterButton>
          <FilterButton
            active={filter === 'alerts'}
            onClick={() => setFilter('alerts')}
          >
            Alerts
          </FilterButton>
        </FilterContainer>
      )}
      
      <TimelineLine />
      
      {filteredEvents.map((event) => {
        const IconComponent = getEventIcon(event.event_type);
        const eventColor = getEventColor(event.event_type, event.event_data);
        const eventData = formatEventData(event.event_data);
        const isCollapsed = collapsedEvents.has(event.id);
        
        return (
          <EventItem key={event.id} isCollapsed={isCollapsed}>
            <EventIcon $bgColor={eventColor}>
              <IconComponent size={10} />
            </EventIcon>
            
            <EventContent $borderColor={eventColor}>
              <CollapseButton
                onClick={() => toggleEventCollapse(event.id)}
                title={isCollapsed ? 'Expand' : 'Collapse'}
              >
                {isCollapsed ? <FaEye /> : <FaEyeSlash />}
              </CollapseButton>
              
              <EventHeader>
                <EventTitle>{getEventTitle(event.event_type, event.event_data)}</EventTitle>
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
                      {item.isTemperature ? (
                        <TemperatureValue
                          isAnomaly={item.isAnomaly}
                          isWarning={item.isWarning}
                        >
                          {item.value}
                        </TemperatureValue>
                      ) : (
                        <DataValue>{item.value}</DataValue>
                      )}
                    </DataRow>
                  ))}
                </EventData>
              )}
            </EventContent>
          </EventItem>
        );
      })}
    </TimelineContainer>
  );
};

export default ShipmentTimeline;