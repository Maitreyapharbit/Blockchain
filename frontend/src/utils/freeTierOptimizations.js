// Free tier optimizations for Supabase
export const FREE_TIER_LIMITS = {
  MAX_SUBSCRIPTIONS: 5,
  MAX_EVENTS_PER_SECOND: 10,
  MAX_CONCURRENT_CONNECTIONS: 2,
  MAX_DB_SIZE_MB: 500,
  MAX_BANDWIDTH_GB: 2
};

// Optimize subscription management
export const optimizeSubscriptions = (subscriptions) => {
  if (subscriptions.size >= FREE_TIER_LIMITS.MAX_SUBSCRIPTIONS) {
    console.warn('Approaching subscription limit, consider cleanup');
    return false;
  }
  return true;
};

// Batch events to reduce API calls
export const batchEvents = (events, batchSize = 5) => {
  const batches = [];
  for (let i = 0; i < events.length; i += batchSize) {
    batches.push(events.slice(i, i + batchSize));
  }
  return batches;
};

// Debounce function for frequent updates
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// Throttle function for rate limiting
export const throttle = (func, limit) => {
  let inThrottle;
  return function() {
    const args = arguments;
    const context = this;
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

// Local storage with size limits
export const localStorageWithLimit = {
  setItem: (key, value, maxSize = 5 * 1024 * 1024) => { // 5MB default
    try {
      const currentSize = JSON.stringify(localStorage).length;
      if (currentSize + value.length > maxSize) {
        // Clear old data
        const keys = Object.keys(localStorage);
        for (let i = 0; i < Math.floor(keys.length / 2); i++) {
          localStorage.removeItem(keys[i]);
        }
      }
      localStorage.setItem(key, value);
    } catch (error) {
      console.warn('LocalStorage quota exceeded:', error);
    }
  },
  
  getItem: (key) => {
    try {
      return localStorage.getItem(key);
    } catch (error) {
      console.warn('Error reading from localStorage:', error);
      return null;
    }
  }
};

// Optimize database queries
export const optimizeQuery = (query, options = {}) => {
  const { limit = 20, offset = 0, orderBy = 'created_at', orderDirection = 'desc' } = options;
  
  return query
    .select('*')
    .order(orderBy, { ascending: orderDirection === 'asc' })
    .range(offset, offset + limit - 1);
};

// Connection pooling for realtime
export class ConnectionPool {
  constructor(maxConnections = FREE_TIER_LIMITS.MAX_CONCURRENT_CONNECTIONS) {
    this.maxConnections = maxConnections;
    this.activeConnections = new Set();
    this.queue = [];
  }

  async acquire() {
    return new Promise((resolve) => {
      if (this.activeConnections.size < this.maxConnections) {
        const connection = this.createConnection();
        this.activeConnections.add(connection);
        resolve(connection);
      } else {
        this.queue.push(resolve);
      }
    });
  }

  release(connection) {
    this.activeConnections.delete(connection);
    if (this.queue.length > 0) {
      const next = this.queue.shift();
      const newConnection = this.createConnection();
      this.activeConnections.add(newConnection);
      next(newConnection);
    }
  }

  createConnection() {
    return {
      id: Date.now() + Math.random(),
      createdAt: new Date()
    };
  }
}

// Memory usage monitoring
export const monitorMemoryUsage = () => {
  if (performance.memory) {
    const memory = performance.memory;
    const usedMB = memory.usedJSHeapSize / 1024 / 1024;
    const totalMB = memory.totalJSHeapSize / 1024 / 1024;
    const limitMB = memory.jsHeapSizeLimit / 1024 / 1024;
    
    console.log(`Memory usage: ${usedMB.toFixed(2)}MB / ${totalMB.toFixed(2)}MB (${limitMB.toFixed(2)}MB limit)`);
    
    if (usedMB / limitMB > 0.8) {
      console.warn('High memory usage detected, consider cleanup');
      return true; // Indicates cleanup needed
    }
  }
  return false;
};

// Cleanup old data
export const cleanupOldData = (data, maxAge = 7 * 24 * 60 * 60 * 1000) => { // 7 days
  const cutoff = new Date(Date.now() - maxAge);
  return data.filter(item => new Date(item.created_at || item.timestamp) > cutoff);
};

// Optimize images and assets
export const optimizeImage = (src, maxWidth = 800, quality = 0.8) => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      const ratio = Math.min(maxWidth / img.width, maxWidth / img.height);
      canvas.width = img.width * ratio;
      canvas.height = img.height * ratio;
      
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      
      canvas.toBlob(resolve, 'image/jpeg', quality);
    };
    img.src = src;
  });
};

// Network status monitoring
export const monitorNetworkStatus = () => {
  if ('connection' in navigator) {
    const connection = navigator.connection;
    console.log(`Network: ${connection.effectiveType}, downlink: ${connection.downlink}Mbps`);
    
    if (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g') {
      console.warn('Slow network detected, enabling optimizations');
      return true; // Enable optimizations
    }
  }
  return false;
};

// Export all optimizations
export default {
  FREE_TIER_LIMITS,
  optimizeSubscriptions,
  batchEvents,
  debounce,
  throttle,
  localStorageWithLimit,
  optimizeQuery,
  ConnectionPool,
  monitorMemoryUsage,
  cleanupOldData,
  optimizeImage,
  monitorNetworkStatus
};