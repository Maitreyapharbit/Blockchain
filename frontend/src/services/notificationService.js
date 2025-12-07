import { supabase } from '../config/supabase';
import toast from 'react-hot-toast';
import { alertSounds } from '../utils/alertSound';

class NotificationService {
  constructor() {
    this.permission = null;
    this.isSupported = 'Notification' in window;
    this.soundEnabled = true;
    this.alertSound = null;
    this.initializeService();
  }

  // Initialize notification service
  async initializeService() {
    if (this.isSupported) {
      this.permission = await Notification.requestPermission();
    }
    
    // Load alert sound
    this.loadAlertSound();
  }

  // Load alert sound
  loadAlertSound() {
    try {
      // Attempt to create audio element if the file exists; guard against null
      if (!this.alertSound) {
        try {
          this.alertSound = new Audio('/sounds/alert.mp3');
        } catch (err) {
          // ignore creation errors (browser may block or file may not exist)
          this.alertSound = null;
        }
      }

      if (this.alertSound) {
        this.alertSound.preload = 'auto';
        this.alertSound.volume = 0.6;
      }
    } catch (error) {
      console.warn('Could not load alert sound:', error);
    }
  }

  // Show browser notification
  showNotification(alert) {
    if (!this.isSupported || this.permission !== 'granted') {
      return;
    }

    const notification = new Notification(alert.title, {
      body: alert.description,
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      tag: `alert-${alert.id}`,
      requireInteraction: alert.severity === 'critical',
      data: {
        alertId: alert.id,
        shipmentId: alert.shipment_id,
        severity: alert.severity,
        type: alert.alert_type
      }
    });

    // Auto-close non-critical notifications after 5 seconds
    if (alert.severity !== 'critical') {
      setTimeout(() => notification.close(), 5000);
    }

    // Handle notification click
    notification.onclick = () => {
      window.focus();
      notification.close();
      // Navigate to shipment details
      window.location.href = `/shipments/${alert.shipment_id}`;
    };

    // Handle notification close
    notification.onclose = () => {
      console.log('Notification closed:', alert.id);
    };

    return notification;
  }

  // Show toast notification
  showToast(alert) {
    const toastOptions = {
      duration: alert.severity === 'critical' ? 0 : 4000, // Critical alerts don't auto-dismiss
      position: 'top-right',
      style: {
        background: this.getSeverityColor(alert.severity),
        color: 'white',
        fontWeight: 'bold',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        borderRadius: '8px',
        padding: '12px 16px',
        fontSize: '14px'
      },
      icon: this.getSeverityIcon(alert.severity)
    };

    return toast(alert.title, toastOptions);
  }

  // Play alert sound
  playAlertSound(severity) {
    if (!this.soundEnabled) return;

    try {
      const soundFunction = alertSounds[severity] || alertSounds.medium;
      soundFunction();
    } catch (error) {
      console.warn('Could not play alert sound:', error);
    }
  }

  // Get severity color
  getSeverityColor(severity) {
    const colors = {
      low: '#10B981', // green
      medium: '#F59E0B', // yellow
      high: '#EF4444', // red
      critical: '#DC2626' // dark red
    };
    return colors[severity] || colors.medium;
  }

  // Get severity icon
  getSeverityIcon(severity) {
    const icons = {
      low: '✅',
      medium: '⚠️',
      high: '🚨',
      critical: '🔥'
    };
    return icons[severity] || '⚠️';
  }

  // Get volume based on severity
  getSeverityVolume(severity) {
    const volumes = {
      low: 0.3,
      medium: 0.5,
      high: 0.7,
      critical: 0.9
    };
    return volumes[severity] || 0.5;
  }

  // Process incoming alert
  processAlert(alert) {
    console.log('Processing alert:', alert);

    // Show toast notification
    this.showToast(alert);

    // Show browser notification
    this.showNotification(alert);

    // Play sound for medium+ alerts
    if (['medium', 'high', 'critical'].includes(alert.severity)) {
      this.playAlertSound(alert.severity);
    }

    // Store alert in localStorage for persistence
    this.storeAlert(alert);

    // Update browser tab title if critical
    if (alert.severity === 'critical') {
      this.updateTabTitle('CRITICAL ALERT');
    }
  }

  // Update browser tab title
  updateTabTitle(title) {
    const originalTitle = document.title;
    document.title = `🚨 ${title} - ${originalTitle}`;
    
    // Reset title after 10 seconds
    setTimeout(() => {
      document.title = originalTitle;
    }, 10000);
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

  // Clear stored alerts
  clearStoredAlerts() {
    try {
      localStorage.removeItem('shipment_alerts');
    } catch (error) {
      console.warn('Could not clear stored alerts:', error);
    }
  }

  // Toggle sound on/off
  toggleSound() {
    this.soundEnabled = !this.soundEnabled;
    localStorage.setItem('alert_sound_enabled', this.soundEnabled);
    return this.soundEnabled;
  }

  // Load sound preference from localStorage
  loadSoundPreference() {
    try {
      const saved = localStorage.getItem('alert_sound_enabled');
      this.soundEnabled = saved !== null ? JSON.parse(saved) : true;
    } catch (error) {
      console.warn('Could not load sound preference:', error);
      this.soundEnabled = true;
    }
  }

  // Save sound preference to localStorage
  saveSoundPreference() {
    try {
      localStorage.setItem('alert_sound_enabled', this.soundEnabled);
    } catch (error) {
      console.warn('Could not save sound preference:', error);
    }
  }

  // Get notification permission status
  getPermissionStatus() {
    if (!this.isSupported) return 'unsupported';
    return this.permission || 'default';
  }

  // Request notification permission
  async requestPermission() {
    if (!this.isSupported) return false;
    
    this.permission = await Notification.requestPermission();
    return this.permission === 'granted';
  }

  // Check if notifications are supported and enabled
  isNotificationEnabled() {
    return this.isSupported && this.permission === 'granted';
  }

  // Create custom notification
  createCustomNotification(title, options = {}) {
    if (!this.isSupported || this.permission !== 'granted') {
      return null;
    }

    const defaultOptions = {
      body: '',
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      requireInteraction: false,
      silent: false
    };

    const notification = new Notification(title, { ...defaultOptions, ...options });

    // Auto-close after 5 seconds unless requireInteraction is true
    if (!options.requireInteraction) {
      setTimeout(() => notification.close(), 5000);
    }

    return notification;
  }

  // Show success notification
  showSuccess(message, options = {}) {
    return toast.success(message, {
      duration: 3000,
      position: 'top-right',
      style: {
        background: '#10B981',
        color: 'white',
        fontWeight: 'bold'
      },
      ...options
    });
  }

  // Show error notification
  showError(message, options = {}) {
    return toast.error(message, {
      duration: 4000,
      position: 'top-right',
      style: {
        background: '#EF4444',
        color: 'white',
        fontWeight: 'bold'
      },
      ...options
    });
  }

  // Show warning notification
  showWarning(message, options = {}) {
    return toast(message, {
      duration: 4000,
      position: 'top-right',
      style: {
        background: '#F59E0B',
        color: 'white',
        fontWeight: 'bold'
      },
      icon: '⚠️',
      ...options
    });
  }

  // Show info notification
  showInfo(message, options = {}) {
    return toast(message, {
      duration: 3000,
      position: 'top-right',
      style: {
        background: '#3B82F6',
        color: 'white',
        fontWeight: 'bold'
      },
      icon: 'ℹ️',
      ...options
    });
  }

  // Initialize service on load
  async init() {
    await this.initializeService();
    this.loadSoundPreference();
  }
}

// Export singleton instance
export const notificationService = new NotificationService();
export default notificationService;