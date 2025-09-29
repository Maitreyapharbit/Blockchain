import { supabase } from '../config/supabase';
import toast from 'react-hot-toast';

class AlertService {
  constructor() {
    this.alertSound = null;
    this.notificationPermission = null;
    this.initializeNotifications();
  }

  // Initialize browser notifications
  async initializeNotifications() {
    if ('Notification' in window) {
      this.notificationPermission = await Notification.requestPermission();
    }
  }

  // Play alert sound
  playAlertSound(severity) {
    if (!this.alertSound) {
      this.alertSound = new Audio('/sounds/alert.mp3'); // You'll need to add this sound file
    }
    
    try {
      this.alertSound.volume = severity === 'critical' ? 0.8 : 0.5;
      this.alertSound.play().catch(console.warn);
    } catch (error) {
      console.warn('Could not play alert sound:', error);
    }
  }

  // Show browser notification
  showNotification(alert) {
    if (this.notificationPermission === 'granted') {
      const notification = new Notification(alert.title, {
        body: alert.description,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: `alert-${alert.id}`,
        requireInteraction: alert.severity === 'critical',
        data: {
          alertId: alert.id,
          shipmentId: alert.shipment_id,
          severity: alert.severity
        }
      });

      // Auto-close non-critical notifications after 5 seconds
      if (alert.severity !== 'critical') {
        setTimeout(() => notification.close(), 5000);
      }

      notification.onclick = () => {
        window.focus();
        notification.close();
        // Navigate to shipment details
        window.location.href = `/shipments/${alert.shipment_id}`;
      };
    }
  }

  // Show toast notification
  showToast(alert) {
    const toastOptions = {
      duration: alert.severity === 'critical' ? 0 : 4000, // Critical alerts don't auto-dismiss
      position: 'top-right',
      style: {
        background: this.getSeverityColor(alert.severity),
        color: 'white',
        fontWeight: 'bold'
      }
    };

    toast(alert.title, toastOptions);
  }

  // Get color based on severity
  getSeverityColor(severity) {
    const colors = {
      low: '#10B981', // green
      medium: '#F59E0B', // yellow
      high: '#EF4444', // red
      critical: '#DC2626' // dark red
    };
    return colors[severity] || colors.medium;
  }

  // Get icon based on alert type
  getAlertIcon(alertType) {
    const icons = {
      temperature_excursion: '🌡️',
      delay: '⏰',
      anomaly: '⚠️',
      humidity_excursion: '💧',
      location_anomaly: '📍',
      delivery_delay: '🚚',
      damage_detected: '💥'
    };
    return icons[alertType] || '⚠️';
  }

  // Process incoming alert
  processAlert(alert) {
    console.log('Processing alert:', alert);

    // Show toast notification
    this.showToast(alert);

    // Show browser notification
    this.showNotification(alert);

    // Play sound for high/critical alerts
    if (alert.severity === 'high' || alert.severity === 'critical') {
      this.playAlertSound(alert.severity);
    }

    // Store alert in localStorage for persistence
    this.storeAlert(alert);
  }

  // Store alert in localStorage
  storeAlert(alert) {
    try {
      const storedAlerts = JSON.parse(localStorage.getItem('shipment_alerts') || '[]');
      storedAlerts.unshift(alert);
      
      // Keep only last 100 alerts to prevent storage bloat
      const limitedAlerts = storedAlerts.slice(0, 100);
      localStorage.setItem('shipment_alerts', JSON.stringify(limitedAlerts));
    } catch (error) {
      console.warn('Could not store alert:', error);
    }
  }

  // Get stored alerts
  getStoredAlerts() {
    try {
      return JSON.parse(localStorage.getItem('shipment_alerts') || '[]');
    } catch (error) {
      console.warn('Could not retrieve stored alerts:', error);
      return [];
    }
  }

  // Mark alert as resolved
  async resolveAlert(alertId, resolvedBy) {
    try {
      const { error } = await supabase
        .from('shipment_alerts')
        .update({
          is_resolved: true,
          resolved_at: new Date().toISOString(),
          resolved_by: resolvedBy
        })
        .eq('id', alertId);

      if (error) throw error;

      // Remove from localStorage
      this.removeStoredAlert(alertId);

      toast.success('Alert resolved successfully');
    } catch (error) {
      console.error('Error resolving alert:', error);
      toast.error('Failed to resolve alert');
    }
  }

  // Remove alert from localStorage
  removeStoredAlert(alertId) {
    try {
      const storedAlerts = this.getStoredAlerts();
      const filteredAlerts = storedAlerts.filter(alert => alert.id !== alertId);
      localStorage.setItem('shipment_alerts', JSON.stringify(filteredAlerts));
    } catch (error) {
      console.warn('Could not remove stored alert:', error);
    }
  }

  // Get alerts for a shipment
  async getShipmentAlerts(shipmentId) {
    try {
      const { data, error } = await supabase
        .from('shipment_alerts')
        .select('*')
        .eq('shipment_id', shipmentId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching shipment alerts:', error);
      toast.error('Failed to fetch alerts');
      return [];
    }
  }

  // Get all unresolved alerts for user
  async getUnresolvedAlerts() {
    try {
      const { data, error } = await supabase
        .from('shipment_alerts')
        .select(`
          *,
          shipments!inner(tracking_number, status)
        `)
        .eq('is_resolved', false)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching unresolved alerts:', error);
      toast.error('Failed to fetch alerts');
      return [];
    }
  }

  // Create a new alert
  async createAlert(alertData) {
    try {
      const { data, error } = await supabase
        .from('shipment_alerts')
        .insert([alertData])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating alert:', error);
      toast.error('Failed to create alert');
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
        ).length
      };

      // Count by severity
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
        recent: 0
      };
    }
  }
}

// Export singleton instance
export const alertService = new AlertService();
export default alertService;