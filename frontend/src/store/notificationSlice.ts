import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Notification, PaginatedResponse } from '../types';
import { 
  getNotificationsFromStorage, 
  saveNotificationToStorage, 
  markNotificationAsRead as markAsReadStorage,
  clearAllNotifications as clearAllStorage 
} from '../utils/notificationService';

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  filters: {
    type: string;
    severity: string;
    read: boolean | null;
    search: string;
  };
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  realTimeEnabled: boolean;
  connectionStatus: 'connected' | 'disconnected' | 'connecting';
}

const initialState: NotificationState = {
  notifications: getNotificationsFromStorage(),
  unreadCount: 0,
  loading: false,
  error: null,
  filters: {
    type: '',
    severity: '',
    read: null,
    search: '',
  },
  pagination: {
    page: 1,
    limit: 20,
    total: 0,
    hasNext: false,
    hasPrev: false,
  },
  realTimeEnabled: true,
  connectionStatus: 'disconnected',
};

// Async thunks
export const fetchNotifications = createAsyncThunk(
  'notification/fetchNotifications',
  async (params?: { 
    page?: number; 
    limit?: number; 
    type?: string; 
    severity?: string; 
    read?: boolean;
    search?: string;
  }) => {
    // In a real app, this would call an API
    // For now, we'll use local storage
    const allNotifications = getNotificationsFromStorage();
    
    // Apply filters
    let filteredNotifications = allNotifications;
    
    if (params?.type) {
      filteredNotifications = filteredNotifications.filter(n => n.type === params.type);
    }
    
    if (params?.severity) {
      filteredNotifications = filteredNotifications.filter(n => n.severity === params.severity);
    }
    
    if (params?.read !== null && params?.read !== undefined) {
      filteredNotifications = filteredNotifications.filter(n => n.read === params.read);
    }
    
    if (params?.search) {
      const searchLower = params.search.toLowerCase();
      filteredNotifications = filteredNotifications.filter(n => 
        n.title.toLowerCase().includes(searchLower) || 
        n.message.toLowerCase().includes(searchLower)
      );
    }
    
    // Apply pagination
    const page = params?.page || 1;
    const limit = params?.limit || 20;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    
    const paginatedNotifications = filteredNotifications.slice(startIndex, endIndex);
    
    return {
      data: paginatedNotifications,
      total: filteredNotifications.length,
      page,
      limit,
      hasNext: endIndex < filteredNotifications.length,
      hasPrev: page > 1,
    };
  }
);

export const markNotificationAsRead = createAsyncThunk(
  'notification/markAsRead',
  async (notificationId: string) => {
    markAsReadStorage(notificationId);
    return notificationId;
  }
);

export const markAllAsRead = createAsyncThunk(
  'notification/markAllAsRead',
  async () => {
    const notifications = getNotificationsFromStorage();
    notifications.forEach(notification => {
      notification.read = true;
    });
    localStorage.setItem('notifications', JSON.stringify(notifications));
    return true;
  }
);

export const deleteNotification = createAsyncThunk(
  'notification/deleteNotification',
  async (notificationId: string) => {
    const notifications = getNotificationsFromStorage();
    const filteredNotifications = notifications.filter(n => n.id !== notificationId);
    localStorage.setItem('notifications', JSON.stringify(filteredNotifications));
    return notificationId;
  }
);

export const clearAllNotifications = createAsyncThunk(
  'notification/clearAll',
  async () => {
    clearAllStorage();
    return true;
  }
);

export const addNotification = createAsyncThunk(
  'notification/addNotification',
  async (notification: Notification) => {
    saveNotificationToStorage(notification);
    return notification;
  }
);

const notificationSlice = createSlice({
  name: 'notification',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setFilters: (state, action: PayloadAction<Partial<NotificationState['filters']>>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    setPagination: (state, action: PayloadAction<Partial<NotificationState['pagination']>>) => {
      state.pagination = { ...state.pagination, ...action.payload };
    },
    setRealTimeEnabled: (state, action: PayloadAction<boolean>) => {
      state.realTimeEnabled = action.payload;
    },
    setConnectionStatus: (state, action: PayloadAction<NotificationState['connectionStatus']>) => {
      state.connectionStatus = action.payload;
    },
    updateNotificationInList: (state, action: PayloadAction<Notification>) => {
      const index = state.notifications.findIndex(n => n.id === action.payload.id);
      if (index !== -1) {
        state.notifications[index] = action.payload;
      }
    },
    addNotificationToList: (state, action: PayloadAction<Notification>) => {
      state.notifications.unshift(action.payload);
      if (!action.payload.read) {
        state.unreadCount += 1;
      }
    },
    removeNotificationFromList: (state, action: PayloadAction<string>) => {
      const notification = state.notifications.find(n => n.id === action.payload);
      if (notification && !notification.read) {
        state.unreadCount = Math.max(0, state.unreadCount - 1);
      }
      state.notifications = state.notifications.filter(n => n.id !== action.payload);
    },
    updateUnreadCount: (state) => {
      state.unreadCount = state.notifications.filter(n => !n.read).length;
    },
  },
  extraReducers: (builder) => {
    // Fetch notifications
    builder
      .addCase(fetchNotifications.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.loading = false;
        state.notifications = action.payload.data;
        state.pagination = {
          page: action.payload.page,
          limit: action.payload.limit,
          total: action.payload.total,
          hasNext: action.payload.hasNext,
          hasPrev: action.payload.hasPrev,
        };
        state.unreadCount = action.payload.data.filter(n => !n.read).length;
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch notifications';
      });

    // Mark notification as read
    builder
      .addCase(markNotificationAsRead.fulfilled, (state, action) => {
        const notification = state.notifications.find(n => n.id === action.payload);
        if (notification && !notification.read) {
          notification.read = true;
          state.unreadCount = Math.max(0, state.unreadCount - 1);
        }
      });

    // Mark all as read
    builder
      .addCase(markAllAsRead.fulfilled, (state) => {
        state.notifications.forEach(notification => {
          notification.read = true;
        });
        state.unreadCount = 0;
      });

    // Delete notification
    builder
      .addCase(deleteNotification.fulfilled, (state, action) => {
        const notification = state.notifications.find(n => n.id === action.payload);
        if (notification && !notification.read) {
          state.unreadCount = Math.max(0, state.unreadCount - 1);
        }
        state.notifications = state.notifications.filter(n => n.id !== action.payload);
      });

    // Clear all notifications
    builder
      .addCase(clearAllNotifications.fulfilled, (state) => {
        state.notifications = [];
        state.unreadCount = 0;
      });

    // Add notification
    builder
      .addCase(addNotification.fulfilled, (state, action) => {
        state.notifications.unshift(action.payload);
        if (!action.payload.read) {
          state.unreadCount += 1;
        }
      });
  },
});

export const {
  clearError,
  setFilters,
  setPagination,
  setRealTimeEnabled,
  setConnectionStatus,
  updateNotificationInList,
  addNotificationToList,
  removeNotificationFromList,
  updateUnreadCount,
} = notificationSlice.actions;

export default notificationSlice.reducer;