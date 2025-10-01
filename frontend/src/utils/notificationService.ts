import { Notification } from '../types';

// Notification service for real-time updates
export class NotificationService {
  private static instance: NotificationService;
  private eventSource: EventSource | null = null;
  private listeners: Map<string, Set<(notification: Notification) => void>> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  constructor() {
    this.connect();
  }

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  // Connect to notification server
  private connect(): void {
    const token = localStorage.getItem('authToken');
    if (!token) {
      console.warn('No auth token found, skipping notification connection');
      return;
    }

    const url = `${process.env.REACT_APP_NOTIFICATION_URL || 'http://localhost:3001'}/notifications/stream?token=${token}`;
    
    this.eventSource = new EventSource(url);

    this.eventSource.onopen = () => {
      console.log('Connected to notification stream');
      this.reconnectAttempts = 0;
    };

    this.eventSource.onmessage = (event) => {
      try {
        const notification: Notification = JSON.parse(event.data);
        this.handleNotification(notification);
      } catch (error) {
        console.error('Error parsing notification:', error);
      }
    };

    this.eventSource.onerror = (error) => {
      console.error('Notification stream error:', error);
      this.handleReconnect();
    };

    this.eventSource.addEventListener('recall', (event) => {
      try {
        const notification: Notification = JSON.parse(event.data);
        this.handleNotification(notification, 'recall');
      } catch (error) {
        console.error('Error parsing recall notification:', error);
      }
    });

    this.eventSource.addEventListener('counterfeit', (event) => {
      try {
        const notification: Notification = JSON.parse(event.data);
        this.handleNotification(notification, 'counterfeit');
      } catch (error) {
        console.error('Error parsing counterfeit notification:', error);
      }
    });

    this.eventSource.addEventListener('verification', (event) => {
      try {
        const notification: Notification = JSON.parse(event.data);
        this.handleNotification(notification, 'verification');
      } catch (error) {
        console.error('Error parsing verification notification:', error);
      }
    });
  }

  // Handle reconnection logic
  private handleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

    setTimeout(() => {
      console.log(`Attempting to reconnect... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      this.disconnect();
      this.connect();
    }, delay);
  }

  // Handle incoming notification
  private handleNotification(notification: Notification, type?: string): void {
    // Notify all listeners
    const allListeners = this.listeners.get('*') || new Set();
    allListeners.forEach(listener => listener(notification));

    // Notify type-specific listeners
    if (type) {
      const typeListeners = this.listeners.get(type) || new Set();
      typeListeners.forEach(listener => listener(notification));
    }

    // Show browser notification if permission granted
    this.showBrowserNotification(notification);
  }

  // Show browser notification
  private showBrowserNotification(notification: Notification): void {
    if (Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: notification.message,
        icon: this.getNotificationIcon(notification.severity),
        tag: notification.id,
        requireInteraction: notification.actionRequired,
      });
    }
  }

  // Get notification icon based on severity
  private getNotificationIcon(severity: Notification['severity']): string {
    const icons = {
      info: '/icons/info.png',
      warning: '/icons/warning.png',
      error: '/icons/error.png',
      critical: '/icons/critical.png',
    };
    return icons[severity] || icons.info;
  }

  // Subscribe to notifications
  subscribe(type: string, callback: (notification: Notification) => void): () => void {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }
    this.listeners.get(type)!.add(callback);

    // Return unsubscribe function
    return () => {
      const typeListeners = this.listeners.get(type);
      if (typeListeners) {
        typeListeners.delete(callback);
        if (typeListeners.size === 0) {
          this.listeners.delete(type);
        }
      }
    };
  }

  // Unsubscribe from notifications
  unsubscribe(type: string, callback: (notification: Notification) => void): void {
    const typeListeners = this.listeners.get(type);
    if (typeListeners) {
      typeListeners.delete(callback);
      if (typeListeners.size === 0) {
        this.listeners.delete(type);
      }
    }
  }

  // Request notification permission
  async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.warn('This browser does not support notifications');
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission === 'denied') {
      console.warn('Notification permission denied');
      return false;
    }

    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  // Disconnect from notification server
  disconnect(): void {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
  }

  // Get connection status
  getConnectionStatus(): 'connected' | 'disconnected' | 'connecting' {
    if (!this.eventSource) return 'disconnected';
    return this.eventSource.readyState === EventSource.OPEN ? 'connected' : 'connecting';
  }

  // Reconnect manually
  reconnect(): void {
    this.disconnect();
    this.reconnectAttempts = 0;
    this.connect();
  }
}

// Export singleton instance
export const notificationService = NotificationService.getInstance();

// Utility functions for notifications
export const createNotification = (
  type: Notification['type'],
  title: string,
  message: string,
  severity: Notification['severity'] = 'info',
  actionRequired: boolean = false,
  relatedId?: string
): Notification => ({
  id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  type,
  title,
  message,
  severity,
  timestamp: new Date().toISOString(),
  read: false,
  actionRequired,
  relatedId,
});

export const formatNotificationTime = (timestamp: string): string => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return 'Just now';
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  } else {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  }
};

export const getSeverityColor = (severity: Notification['severity']): string => {
  const colors = {
    info: '#2196F3',
    warning: '#FF9800',
    error: '#F44336',
    critical: '#9C27B0',
  };
  return colors[severity] || colors.info;
};

export const getSeverityIcon = (severity: Notification['severity']): string => {
  const icons = {
    info: 'info',
    warning: 'warning',
    error: 'error',
    critical: 'error_outline',
  };
  return icons[severity] || icons.info;
};

// Local storage utilities for notifications
export const saveNotificationToStorage = (notification: Notification): void => {
  try {
    const notifications = getNotificationsFromStorage();
    notifications.unshift(notification);
    
    // Keep only last 100 notifications
    if (notifications.length > 100) {
      notifications.splice(100);
    }
    
    localStorage.setItem('notifications', JSON.stringify(notifications));
  } catch (error) {
    console.error('Error saving notification to storage:', error);
  }
};

export const getNotificationsFromStorage = (): Notification[] => {
  try {
    const stored = localStorage.getItem('notifications');
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error getting notifications from storage:', error);
    return [];
  }
};

export const markNotificationAsRead = (notificationId: string): void => {
  try {
    const notifications = getNotificationsFromStorage();
    const notification = notifications.find(n => n.id === notificationId);
    if (notification) {
      notification.read = true;
      localStorage.setItem('notifications', JSON.stringify(notifications));
    }
  } catch (error) {
    console.error('Error marking notification as read:', error);
  }
};

export const clearAllNotifications = (): void => {
  try {
    localStorage.removeItem('notifications');
  } catch (error) {
    console.error('Error clearing notifications:', error);
  }
};

export default notificationService;