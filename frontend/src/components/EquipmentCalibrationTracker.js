import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Tool, AlertTriangle, CheckCircle, Clock, TrendingUp } from 'react-feather';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import toast from 'react-hot-toast';

const Container = styled.div`
  padding: 24px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  color: white;
`;

const Header = styled.div`
  margin-bottom: 24px;
  
  h2 {
    font-size: 28px;
    font-weight: 700;
    margin-bottom: 8px;
    display: flex;
    align-items: center;
    gap: 12px;
  }
  
  p {
    opacity: 0.9;
    font-size: 14px;
  }
`;

const StatusBar = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 12px;
  margin-bottom: 24px;
`;

const StatusCard = styled.div`
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  padding: 16px;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  text-align: center;
  
  .value {
    font-size: 24px;
    font-weight: 700;
    margin-bottom: 4px;
  }
  
  .label {
    font-size: 12px;
    text-transform: uppercase;
    opacity: 0.8;
  }
  
  &.overdue {
    background: rgba(248, 113, 113, 0.2);
    border-color: rgba(248, 113, 113, 0.4);
  }
  
  &.warning {
    background: rgba(251, 191, 36, 0.2);
    border-color: rgba(251, 191, 36, 0.4);
  }
  
  &.good {
    background: rgba(74, 222, 128, 0.2);
    border-color: rgba(74, 222, 128, 0.4);
  }
`;

const Controls = styled.div`
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
  flex-wrap: wrap;
`;

const Button = styled.button`
  padding: 10px 16px;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 14px;
  
  &.primary {
    background: white;
    color: #667eea;
    
    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    }
  }
  
  &.secondary {
    background: rgba(255, 255, 255, 0.2);
    color: white;
    border: 1px solid rgba(255, 255, 255, 0.3);
    
    &:hover {
      background: rgba(255, 255, 255, 0.3);
    }
  }
`;

const ChartContainer = styled.div`
  background: rgba(255, 255, 255, 0.95);
  padding: 20px;
  border-radius: 12px;
  margin-bottom: 24px;
  
  h3 {
    color: #333;
    margin-bottom: 16px;
    font-size: 16px;
    font-weight: 600;
  }
`;

const EquipmentGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
`;

const EquipmentCard = styled.div`
  background: rgba(255, 255, 255, 0.95);
  border-radius: 12px;
  padding: 16px;
  transition: all 0.2s;
  border: 2px solid ${props => {
    if (props.overdue) return '#f87171';
    if (props.atRisk) return '#fbbf24';
    return '#d1d5db';
  }};
  
  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 24px rgba(0, 0, 0, 0.15);
  }
`;

const EquipmentHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: start;
  margin-bottom: 12px;
`;

const EquipmentName = styled.div`
  flex: 1;
  
  .name {
    font-weight: 700;
    color: #333;
    font-size: 16px;
    margin-bottom: 4px;
  }
  
  .type {
    font-size: 12px;
    color: #999;
  }
`;

const StatusBadge = styled.div`
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  
  &.compliant {
    background: #d1fae5;
    color: #065f46;
  }
  
  &.warning {
    background: #fef3c7;
    color: #92400e;
  }
  
  &.overdue {
    background: #fee2e2;
    color: #991b1b;
  }
`;

const EquipmentStats = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  margin-bottom: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid #e0e7ff;
  
  .stat {
    font-size: 12px;
    
    .label {
      color: #999;
      margin-bottom: 2px;
    }
    
    .value {
      font-weight: 700;
      color: #667eea;
      font-size: 14px;
    }
  }
`;

const CalibrationButton = styled.button`
  width: 100%;
  padding: 8px 12px;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s;
  margin-top: 12px;
  
  &:hover {
    background: #5568d3;
    transform: translateY(-2px);
  }
`;

const AlertList = styled.div`
  background: rgba(248, 113, 113, 0.1);
  border: 1px solid rgba(248, 113, 113, 0.3);
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 24px;
  
  h3 {
    color: #f87171;
    margin-bottom: 12px;
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
  }
  
  ul {
    list-style: none;
    padding: 0;
    margin: 0;
    
    li {
      padding: 8px 0;
      border-bottom: 1px solid rgba(248, 113, 113, 0.2);
      font-size: 13px;
      
      &:last-child {
        border-bottom: none;
      }
    }
  }
`;

const EquipmentCalibrationTracker = () => {
  const [equipment, setEquipment] = useState([]);
  const [analytics, setAnalytics] = useState({});
  const [loading, setLoading] = useState(true);
  const [alerts, setAlerts] = useState([]);
  const [selectedEquipment, setSelectedEquipment] = useState(null);
  const [historyData, setHistoryData] = useState([]);

  useEffect(() => {
    fetchEquipment();
  }, []);

  useEffect(() => {
    if (selectedEquipment) {
      fetchCalibrationAnalytics(selectedEquipment.equipment_id);
      fetchCalibrationHistory(selectedEquipment.equipment_id);
    }
  }, [selectedEquipment]);

  const fetchEquipment = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${process.env.REACT_APP_API_URL}/calibration/equipment`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setEquipment(data.data || []);
        generateAlerts(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching equipment:', error);
      toast.error('Failed to load equipment');
    } finally {
      setLoading(false);
    }
  };

  const fetchCalibrationAnalytics = async (equipmentId) => {
    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/calibration/calibration-analytics/${equipmentId}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        setAnalytics(data.analytics || {});
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    }
  };

  const fetchCalibrationHistory = async (equipmentId) => {
    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/calibration/calibration-history/${equipmentId}?limit=10`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        setHistoryData(data.data.reverse().map((d, idx) => ({
          index: idx + 1,
          deviation: parseFloat(d.deviation_percent),
          passed: d.passed ? 1 : 0
        })));
      }
    } catch (error) {
      console.error('Error fetching history:', error);
    }
  };

  const generateAlerts = (equipmentList) => {
    const newAlerts = [];
    const now = new Date();
    
    equipmentList.forEach(eq => {
      const dueDate = new Date(eq.next_calibration_date);
      const daysUntil = Math.ceil((dueDate - now) / (1000 * 60 * 60 * 24));
      
      if (daysUntil < 0) {
        newAlerts.push({
          type: 'overdue',
          message: `${eq.equipment_name} calibration is ${Math.abs(daysUntil)} days overdue`
        });
      } else if (daysUntil < 7) {
        newAlerts.push({
          type: 'warning',
          message: `${eq.equipment_name} calibration due in ${daysUntil} days`
        });
      }
    });
    
    setAlerts(newAlerts);
  };

  const getStatusClass = (eq) => {
    const now = new Date();
    const dueDate = new Date(eq.next_calibration_date);
    
    if (dueDate < now) return 'overdue';
    if ((dueDate - now) / (1000 * 60 * 60 * 24) < 7) return 'warning';
    return 'good';
  };

  const getDaysUntilCalibration = (eq) => {
    const now = new Date();
    const dueDate = new Date(eq.next_calibration_date);
    return Math.ceil((dueDate - now) / (1000 * 60 * 60 * 24));
  };

  const overdueCount = equipment.filter(eq => getDaysUntilCalibration(eq) < 0).length;
  const dueSoonCount = equipment.filter(eq => {
    const days = getDaysUntilCalibration(eq);
    return days >= 0 && days < 7;
  }).length;
  const compliantCount = equipment.filter(eq => getDaysUntilCalibration(eq) >= 7).length;

  return (
    <Container>
      <Header>
        <h2>
          <Tool size={32} />
          Equipment Calibration Management
        </h2>
        <p>Track calibration status, predictive maintenance, and FDA compliance</p>
      </Header>

      <StatusBar>
        <StatusCard className="good">
          <div className="value">{compliantCount}</div>
          <div className="label">Compliant Equipment</div>
        </StatusCard>
        <StatusCard className="warning">
          <div className="value">{dueSoonCount}</div>
          <div className="label">Due Soon (7 days)</div>
        </StatusCard>
        <StatusCard className="overdue">
          <div className="value">{overdueCount}</div>
          <div className="label">Overdue</div>
        </StatusCard>
        <StatusCard>
          <div className="value">{equipment.length}</div>
          <div className="label">Total Equipment</div>
        </StatusCard>
      </StatusBar>

      {alerts.length > 0 && (
        <AlertList>
          <h3>
            <AlertTriangle size={18} />
            Active Alerts ({alerts.length})
          </h3>
          <ul>
            {alerts.map((alert, idx) => (
              <li key={idx}>⚠️ {alert.message}</li>
            ))}
          </ul>
        </AlertList>
      )}

      <Controls>
        <Button className="primary" onClick={fetchEquipment}>
          Refresh Equipment List
        </Button>
        <Button className="secondary">
          Generate FDA Report
        </Button>
        <Button className="secondary">
          Schedule Calibration
        </Button>
      </Controls>

      {selectedEquipment && historyData.length > 0 && (
        <ChartContainer>
          <h3>Calibration History - {selectedEquipment.equipment_name}</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={historyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e7ff" />
              <XAxis dataKey="index" stroke="#666" />
              <YAxis stroke="#666" />
              <Tooltip 
                contentStyle={{
                  background: 'white',
                  border: '1px solid #e0e7ff',
                  borderRadius: '8px'
                }}
                formatter={(value, name) => 
                  name === 'passed' ? (value ? 'Passed' : 'Failed') : value.toFixed(3)
                }
              />
              <Area type="monotone" dataKey="deviation" fill="#667eea" stroke="#667eea" name="Deviation %" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartContainer>
      )}

      {selectedEquipment && analytics.recommendations && (
        <ChartContainer>
          <h3>Predictive Maintenance Analysis</h3>
          <div style={{ color: '#333', lineHeight: '1.6' }}>
            <div style={{ marginBottom: '12px' }}>
              <strong>Risk Score: {analytics.predictive_risk_score}/100</strong>
              <div style={{ 
                marginTop: '8px',
                background: '#f3f4f6',
                padding: '8px',
                borderRadius: '4px',
                fontSize: '12px'
              }}>
                <div>Failure Rate: {analytics.failure_rate_percent}%</div>
                <div>Avg Deviation: {analytics.average_deviation_percent}%</div>
                <div>Pass/Fail: {analytics.pass_count}/{analytics.failure_count}</div>
              </div>
            </div>
            <div>
              <strong>Recommendations:</strong>
              <ul style={{ margin: '8px 0', paddingLeft: '20px', fontSize: '13px' }}>
                {analytics.recommendations.map((rec, idx) => (
                  <li key={idx} style={{ marginBottom: '4px' }}>{rec}</li>
                ))}
              </ul>
            </div>
          </div>
        </ChartContainer>
      )}

      <EquipmentGrid>
        {equipment.map((eq) => {
          const daysUntil = getDaysUntilCalibration(eq);
          const statusClass = getStatusClass(eq);
          
          return (
            <EquipmentCard 
              key={eq.equipment_id}
              overdue={daysUntil < 0}
              atRisk={daysUntil >= 0 && daysUntil < 7}
              onClick={() => setSelectedEquipment(eq)}
            >
              <EquipmentHeader>
                <EquipmentName>
                  <div className="name">{eq.equipment_name}</div>
                  <div className="type">{eq.equipment_type}</div>
                </EquipmentName>
                <StatusBadge className={statusClass}>
                  {statusClass === 'overdue' ? 'Overdue' : statusClass === 'warning' ? 'Due Soon' : 'OK'}
                </StatusBadge>
              </EquipmentHeader>
              
              <EquipmentStats>
                <div className="stat">
                  <div className="label">Last Calibration</div>
                  <div className="value">
                    {eq.last_calibration_date 
                      ? new Date(eq.last_calibration_date).toLocaleDateString()
                      : 'Never'
                    }
                  </div>
                </div>
                <div className="stat">
                  <div className="label">Days Until Due</div>
                  <div className="value" style={{ color: daysUntil < 0 ? '#f87171' : '#667eea' }}>
                    {daysUntil < 0 ? `Overdue ${Math.abs(daysUntil)}` : daysUntil}
                  </div>
                </div>
              </EquipmentStats>
              
              <div style={{ fontSize: '12px', color: '#999', marginBottom: '8px' }}>
                Frequency: Every {eq.calibration_frequency_days} days
              </div>
              
              <CalibrationButton>
                Record Calibration
              </CalibrationButton>
            </EquipmentCard>
          );
        })}
      </EquipmentGrid>

      {equipment.length === 0 && !loading && (
        <div style={{ 
          textAlign: 'center',
          padding: '40px',
          opacity: 0.7
        }}>
          <Tool size={48} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
          <p>No equipment registered yet. Register equipment to begin tracking calibrations.</p>
        </div>
      )}
    </Container>
  );
};

export default EquipmentCalibrationTracker;
