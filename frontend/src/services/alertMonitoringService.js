import { supabase } from '../config/supabase';
import { alertService } from './alertService';

class AlertMonitoringService {
  constructor() {
    this.monitoringInterval = null;
    this.isMonitoring = false;
    this.alertThresholds = {
      temperature: {
        critical: 5, // degrees outside range
        high: 3,
        medium: 2
      },
      delay: {
        critical: 48, // hours
        high: 24,
        medium: 12
      },
      humidity: {
        critical: 20, // percentage outside range
        high: 15,
        medium: 10
      }
    };
  }

  // Start monitoring all active shipments
  startMonitoring() {
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;
    this.monitoringInterval = setInterval(() => {
      this.checkAllShipments();
    }, 60000); // Check every minute

    console.log('Alert monitoring started');
  }

  // Stop monitoring
  stopMonitoring() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    this.isMonitoring = false;
    console.log('Alert monitoring stopped');
  }

  // Check all active shipments for anomalies
  async checkAllShipments() {
    try {
      const { data: shipments, error } = await supabase
        .from('shipments')
        .select('*')
        .in('status', ['in_transit', 'pending', 'delayed']);

      if (error) throw error;

      for (const shipment of shipments) {
        await this.checkShipmentAnomalies(shipment);
      }
    } catch (error) {
      console.error('Error checking shipments:', error);
    }
  }

  // Check individual shipment for anomalies
  async checkShipmentAnomalies(shipment) {
    try {
      // Check temperature excursions
      if (shipment.current_temperature && shipment.temperature_min && shipment.temperature_max) {
        await this.checkTemperatureExcursion(shipment);
      }

      // Check delivery delays
      if (shipment.expected_delivery_date && shipment.status !== 'delivered') {
        await this.checkDeliveryDelay(shipment);
      }

      // Check humidity excursions
      if (shipment.current_humidity && shipment.humidity_min && shipment.humidity_max) {
        await this.checkHumidityExcursion(shipment);
      }

      // Check location anomalies
      await this.checkLocationAnomaly(shipment);

    } catch (error) {
      console.error(`Error checking anomalies for shipment ${shipment.id}:`, error);
    }
  }

  // Check for temperature excursions
  async checkTemperatureExcursion(shipment) {
    const { current_temperature, temperature_min, temperature_max } = shipment;
    
    if (current_temperature < temperature_min || current_temperature > temperature_max) {
      const deviation = Math.min(
        Math.abs(current_temperature - temperature_min),
        Math.abs(current_temperature - temperature_max)
      );

      const severity = this.getSeverityLevel(deviation, this.alertThresholds.temperature);
      
      // Check if alert already exists
      const existingAlert = await this.getExistingAlert(shipment.id, 'temperature_excursion');
      
      if (!existingAlert) {
        await this.createAlert({
          shipment_id: shipment.id,
          alert_type: 'temperature_excursion',
          severity,
          title: 'Temperature Excursion Detected',
          description: `Temperature reading ${current_temperature}°C is outside acceptable range (${temperature_min}°C - ${temperature_max}°C)`,
          alert_data: {
            temperature: current_temperature,
            min_temp: temperature_min,
            max_temp: temperature_max,
            deviation,
            location: shipment.current_location || 'Unknown'
          }
        });
      }
    }
  }

  // Check for delivery delays
  async checkDeliveryDelay(shipment) {
    const now = new Date();
    const expectedDelivery = new Date(shipment.expected_delivery_date);
    
    if (now > expectedDelivery) {
      const delayHours = (now - expectedDelivery) / (1000 * 60 * 60);
      const severity = this.getSeverityLevel(delayHours, this.alertThresholds.delay);
      
      // Check if alert already exists
      const existingAlert = await this.getExistingAlert(shipment.id, 'delivery_delay');
      
      if (!existingAlert) {
        await this.createAlert({
          shipment_id: shipment.id,
          alert_type: 'delivery_delay',
          severity,
          title: 'Delivery Delay Detected',
          description: `Shipment is ${Math.round(delayHours)} hours past expected delivery date`,
          alert_data: {
            expected_delivery: shipment.expected_delivery_date,
            current_status: shipment.status,
            delay_hours: delayHours,
            delay_days: Math.round(delayHours / 24)
          }
        });
      }
    }
  }

  // Check for humidity excursions
  async checkHumidityExcursion(shipment) {
    const { current_humidity, humidity_min, humidity_max } = shipment;
    
    if (current_humidity < humidity_min || current_humidity > humidity_max) {
      const deviation = Math.min(
        Math.abs(current_humidity - humidity_min),
        Math.abs(current_humidity - humidity_max)
      );

      const severity = this.getSeverityLevel(deviation, this.alertThresholds.humidity);
      
      // Check if alert already exists
      const existingAlert = await this.getExistingAlert(shipment.id, 'humidity_excursion');
      
      if (!existingAlert) {
        await this.createAlert({
          shipment_id: shipment.id,
          alert_type: 'humidity_excursion',
          severity,
          title: 'Humidity Excursion Detected',
          description: `Humidity reading ${current_humidity}% is outside acceptable range (${humidity_min}% - ${humidity_max}%)`,
          alert_data: {
            humidity: current_humidity,
            min_humidity: humidity_min,
            max_humidity: humidity_max,
            deviation,
            location: shipment.current_location || 'Unknown'
          }
        });
      }
    }
  }

  // Check for location anomalies
  async checkLocationAnomaly(shipment) {
    try {
      // Get recent location updates
      const { data: recentEvents, error } = await supabase
        .from('shipment_events')
        .select('*')
        .eq('shipment_id', shipment.id)
        .eq('event_type', 'location_update')
        .order('timestamp', { ascending: false })
        .limit(5);

      if (error) throw error;

      if (recentEvents.length >= 2) {
        // Check if location hasn't changed for suspiciously long time
        const latestEvent = recentEvents[0];
        const previousEvent = recentEvents[1];
        
        const timeDiff = (new Date(latestEvent.timestamp) - new Date(previousEvent.timestamp)) / (1000 * 60 * 60);
        
        if (timeDiff > 24 && latestEvent.location === previousEvent.location) {
          const existingAlert = await this.getExistingAlert(shipment.id, 'location_anomaly');
          
          if (!existingAlert) {
            await this.createAlert({
              shipment_id: shipment.id,
              alert_type: 'location_anomaly',
              severity: 'medium',
              title: 'Location Anomaly Detected',
              description: `Shipment has been at the same location (${latestEvent.location}) for ${Math.round(timeDiff)} hours`,
              alert_data: {
                location: latestEvent.location,
                duration_hours: timeDiff,
                last_update: latestEvent.timestamp
              }
            });
          }
        }
      }
    } catch (error) {
      console.error('Error checking location anomaly:', error);
    }
  }

  // Get severity level based on deviation and thresholds
  getSeverityLevel(deviation, thresholds) {
    if (deviation >= thresholds.critical) return 'critical';
    if (deviation >= thresholds.high) return 'high';
    if (deviation >= thresholds.medium) return 'medium';
    return 'low';
  }

  // Check if alert already exists
  async getExistingAlert(shipmentId, alertType) {
    try {
      const { data, error } = await supabase
        .from('shipment_alerts')
        .select('id')
        .eq('shipment_id', shipmentId)
        .eq('alert_type', alertType)
        .eq('is_resolved', false)
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    } catch (error) {
      console.error('Error checking existing alert:', error);
      return null;
    }
  }

  // Create new alert
  async createAlert(alertData) {
    try {
      const alert = await alertService.createAlert(alertData);
      console.log('Alert created:', alert);
      return alert;
    } catch (error) {
      console.error('Error creating alert:', error);
      throw error;
    }
  }

  // Get alert statistics
  async getAlertStatistics() {
    try {
      const { data, error } = await supabase
        .from('shipment_alerts')
        .select('severity, alert_type, is_resolved, created_at');

      if (error) throw error;

      const stats = {
        total: data.length,
        unresolved: data.filter(alert => !alert.is_resolved).length,
        bySeverity: {},
        byType: {},
        recent: data.filter(alert => 
          new Date(alert.created_at) > new Date(Date.now() - 24 * 60 * 60 * 1000)
        ).length,
        trends: this.calculateTrends(data)
      };

      // Count by severity and type
      data.forEach(alert => {
        stats.bySeverity[alert.severity] = (stats.bySeverity[alert.severity] || 0) + 1;
        stats.byType[alert.alert_type] = (stats.byType[alert.alert_type] || 0) + 1;
      });

      return stats;
    } catch (error) {
      console.error('Error fetching alert statistics:', error);
      return {
        total: 0,
        unresolved: 0,
        bySeverity: {},
        byType: {},
        recent: 0,
        trends: {}
      };
    }
  }

  // Calculate alert trends
  calculateTrends(alerts) {
    const now = new Date();
    const last24h = new Date(now - 24 * 60 * 60 * 1000);
    const last7d = new Date(now - 7 * 24 * 60 * 60 * 1000);
    const last30d = new Date(now - 30 * 24 * 60 * 60 * 1000);

    return {
      last24h: alerts.filter(alert => new Date(alert.created_at) > last24h).length,
      last7d: alerts.filter(alert => new Date(alert.created_at) > last7d).length,
      last30d: alerts.filter(alert => new Date(alert.created_at) > last30d).length
    };
  }

  // Update alert thresholds
  updateThresholds(newThresholds) {
    this.alertThresholds = { ...this.alertThresholds, ...newThresholds };
    console.log('Alert thresholds updated:', this.alertThresholds);
  }

  // Get current thresholds
  getThresholds() {
    return this.alertThresholds;
  }

  // Simulate temperature reading for testing
  async simulateTemperatureReading(shipmentId, temperature) {
    try {
      const { data, error } = await supabase
        .from('temperature_readings')
        .insert([{
          shipment_id: shipmentId,
          temperature,
          timestamp: new Date().toISOString(),
          is_anomaly: false
        }])
        .select()
        .single();

      if (error) throw error;

      // Update shipment current temperature
      await supabase
        .from('shipments')
        .update({ current_temperature: temperature })
        .eq('id', shipmentId);

      return data;
    } catch (error) {
      console.error('Error simulating temperature reading:', error);
      throw error;
    }
  }

  // Simulate location update for testing
  async simulateLocationUpdate(shipmentId, location) {
    try {
      const { data, error } = await supabase
        .from('shipment_events')
        .insert([{
          shipment_id: shipmentId,
          event_type: 'location_update',
          location,
          event_data: { location },
          timestamp: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Error simulating location update:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const alertMonitoringService = new AlertMonitoringService();
export default alertMonitoringService;