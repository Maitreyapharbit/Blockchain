import {
  notificationService,
  createNotification,
  formatNotificationTime,
  getSeverityColor,
  getSeverityIcon,
  saveNotificationToStorage,
  getNotificationsFromStorage,
  markNotificationAsRead,
  clearAllNotifications,
} from '../../utils/notificationService';
import { Notification } from '../../types';

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock EventSource
global.EventSource = jest.fn().mockImplementation(() => ({
  addEventListener: jest.fn(),
  close: jest.fn(),
  onopen: jest.fn(),
  onmessage: jest.fn(),
  onerror: jest.fn(),
}));

// Mock Notification API
Object.defineProperty(window, 'Notification', {
  value: jest.fn().mockImplementation(() => ({
    close: jest.fn(),
  })),
  writable: true,
});

describe('notificationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  describe('subscribe', () => {
    it('should subscribe to notifications', () => {
      const callback = jest.fn();
      const unsubscribe = notificationService.subscribe('recall', callback);

      expect(typeof unsubscribe).toBe('function');
    });

    it('should unsubscribe from notifications', () => {
      const callback = jest.fn();
      const unsubscribe = notificationService.subscribe('recall', callback);
      
      unsubscribe();
      
      // Should not throw error
      expect(() => unsubscribe()).not.toThrow();
    });
  });

  describe('requestPermission', () => {
    it('should return true when permission is granted', async () => {
      (window.Notification as any).permission = 'granted';
      (window.Notification as any).requestPermission = jest.fn().mockResolvedValue('granted');

      const result = await notificationService.requestPermission();

      expect(result).toBe(true);
    });

    it('should return false when permission is denied', async () => {
      (window.Notification as any).permission = 'denied';
      (window.Notification as any).requestPermission = jest.fn().mockResolvedValue('denied');

      const result = await notificationService.requestPermission();

      expect(result).toBe(false);
    });

    it('should return false when browser does not support notifications', async () => {
      // @ts-ignore
      delete window.Notification;

      const result = await notificationService.requestPermission();

      expect(result).toBe(false);
    });
  });

  describe('getConnectionStatus', () => {
    it('should return connection status', () => {
      const status = notificationService.getConnectionStatus();
      expect(['connected', 'disconnected', 'connecting']).toContain(status);
    });
  });

  describe('reconnect', () => {
    it('should reconnect to notification server', () => {
      expect(() => notificationService.reconnect()).not.toThrow();
    });
  });

  describe('disconnect', () => {
    it('should disconnect from notification server', () => {
      expect(() => notificationService.disconnect()).not.toThrow();
    });
  });
});

describe('utility functions', () => {
  describe('createNotification', () => {
    it('should create notification with required fields', () => {
      const notification = createNotification(
        'recall',
        'Test Title',
        'Test Message',
        'info',
        false,
        'related-id'
      );

      expect(notification.type).toBe('recall');
      expect(notification.title).toBe('Test Title');
      expect(notification.message).toBe('Test Message');
      expect(notification.severity).toBe('info');
      expect(notification.actionRequired).toBe(false);
      expect(notification.relatedId).toBe('related-id');
      expect(notification.read).toBe(false);
      expect(notification.id).toMatch(/^notif_\d+_[a-z0-9]+$/);
      expect(notification.timestamp).toBeDefined();
    });

    it('should create notification with default values', () => {
      const notification = createNotification('recall', 'Test Title', 'Test Message');

      expect(notification.severity).toBe('info');
      expect(notification.actionRequired).toBe(false);
      expect(notification.relatedId).toBeUndefined();
    });
  });

  describe('formatNotificationTime', () => {
    it('should format recent time as "Just now"', () => {
      const now = new Date();
      const timestamp = now.toISOString();
      const formatted = formatNotificationTime(timestamp);
      expect(formatted).toBe('Just now');
    });

    it('should format time in minutes', () => {
      const now = new Date();
      const timestamp = new Date(now.getTime() - 5 * 60 * 1000).toISOString();
      const formatted = formatNotificationTime(timestamp);
      expect(formatted).toBe('5 minutes ago');
    });

    it('should format time in hours', () => {
      const now = new Date();
      const timestamp = new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString();
      const formatted = formatNotificationTime(timestamp);
      expect(formatted).toBe('2 hours ago');
    });

    it('should format time in days', () => {
      const now = new Date();
      const timestamp = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString();
      const formatted = formatNotificationTime(timestamp);
      expect(formatted).toBe('3 days ago');
    });
  });

  describe('getSeverityColor', () => {
    it('should return correct colors for different severities', () => {
      expect(getSeverityColor('info')).toBe('#2196F3');
      expect(getSeverityColor('warning')).toBe('#FF9800');
      expect(getSeverityColor('error')).toBe('#F44336');
      expect(getSeverityColor('critical')).toBe('#9C27B0');
      expect(getSeverityColor('unknown')).toBe('#2196F3');
    });
  });

  describe('getSeverityIcon', () => {
    it('should return correct icons for different severities', () => {
      expect(getSeverityIcon('info')).toBe('info');
      expect(getSeverityIcon('warning')).toBe('warning');
      expect(getSeverityIcon('error')).toBe('error');
      expect(getSeverityIcon('critical')).toBe('error_outline');
      expect(getSeverityIcon('unknown')).toBe('info');
    });
  });

  describe('saveNotificationToStorage', () => {
    it('should save notification to localStorage', () => {
      const notification: Notification = {
        id: 'test-id',
        type: 'recall',
        title: 'Test Title',
        message: 'Test Message',
        severity: 'info',
        timestamp: '2023-01-01T00:00:00Z',
        read: false,
        actionRequired: false,
      };

      localStorageMock.getItem.mockReturnValue('[]');

      saveNotificationToStorage(notification);

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'notifications',
        JSON.stringify([notification])
      );
    });

    it('should limit notifications to 100', () => {
      const notifications = Array.from({ length: 101 }, (_, i) => ({
        id: `test-id-${i}`,
        type: 'recall' as const,
        title: `Test Title ${i}`,
        message: 'Test Message',
        severity: 'info' as const,
        timestamp: '2023-01-01T00:00:00Z',
        read: false,
        actionRequired: false,
      }));

      localStorageMock.getItem.mockReturnValue(JSON.stringify(notifications));

      const newNotification: Notification = {
        id: 'new-id',
        type: 'recall',
        title: 'New Title',
        message: 'New Message',
        severity: 'info',
        timestamp: '2023-01-01T00:00:00Z',
        read: false,
        actionRequired: false,
      };

      saveNotificationToStorage(newNotification);

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'notifications',
        JSON.stringify([newNotification, ...notifications.slice(0, 99)])
      );
    });

    it('should handle localStorage errors', () => {
      const notification: Notification = {
        id: 'test-id',
        type: 'recall',
        title: 'Test Title',
        message: 'Test Message',
        severity: 'info',
        timestamp: '2023-01-01T00:00:00Z',
        read: false,
        actionRequired: false,
      };

      localStorageMock.getItem.mockImplementation(() => {
        throw new Error('localStorage error');
      });

      expect(() => saveNotificationToStorage(notification)).not.toThrow();
    });
  });

  describe('getNotificationsFromStorage', () => {
    it('should return notifications from localStorage', () => {
      const notifications = [
        {
          id: 'test-id',
          type: 'recall',
          title: 'Test Title',
          message: 'Test Message',
          severity: 'info',
          timestamp: '2023-01-01T00:00:00Z',
          read: false,
          actionRequired: false,
        },
      ];

      localStorageMock.getItem.mockReturnValue(JSON.stringify(notifications));

      const result = getNotificationsFromStorage();

      expect(result).toEqual(notifications);
    });

    it('should return empty array when no notifications in localStorage', () => {
      localStorageMock.getItem.mockReturnValue(null);

      const result = getNotificationsFromStorage();

      expect(result).toEqual([]);
    });

    it('should handle localStorage errors', () => {
      localStorageMock.getItem.mockImplementation(() => {
        throw new Error('localStorage error');
      });

      const result = getNotificationsFromStorage();

      expect(result).toEqual([]);
    });
  });

  describe('markNotificationAsRead', () => {
    it('should mark notification as read in localStorage', () => {
      const notifications = [
        {
          id: 'test-id',
          type: 'recall',
          title: 'Test Title',
          message: 'Test Message',
          severity: 'info',
          timestamp: '2023-01-01T00:00:00Z',
          read: false,
          actionRequired: false,
        },
      ];

      localStorageMock.getItem.mockReturnValue(JSON.stringify(notifications));

      markNotificationAsRead('test-id');

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'notifications',
        JSON.stringify([
          {
            id: 'test-id',
            type: 'recall',
            title: 'Test Title',
            message: 'Test Message',
            severity: 'info',
            timestamp: '2023-01-01T00:00:00Z',
            read: true,
            actionRequired: false,
          },
        ])
      );
    });

    it('should handle notification not found', () => {
      const notifications = [
        {
          id: 'other-id',
          type: 'recall',
          title: 'Test Title',
          message: 'Test Message',
          severity: 'info',
          timestamp: '2023-01-01T00:00:00Z',
          read: false,
          actionRequired: false,
        },
      ];

      localStorageMock.getItem.mockReturnValue(JSON.stringify(notifications));

      markNotificationAsRead('test-id');

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'notifications',
        JSON.stringify(notifications)
      );
    });

    it('should handle localStorage errors', () => {
      localStorageMock.getItem.mockImplementation(() => {
        throw new Error('localStorage error');
      });

      expect(() => markNotificationAsRead('test-id')).not.toThrow();
    });
  });

  describe('clearAllNotifications', () => {
    it('should clear all notifications from localStorage', () => {
      clearAllNotifications();

      expect(localStorageMock.removeItem).toHaveBeenCalledWith('notifications');
    });

    it('should handle localStorage errors', () => {
      localStorageMock.removeItem.mockImplementation(() => {
        throw new Error('localStorage error');
      });

      expect(() => clearAllNotifications()).not.toThrow();
    });
  });
});