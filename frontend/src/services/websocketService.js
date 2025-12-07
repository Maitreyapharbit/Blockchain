import WebSocketClient from './WebSocketClient';

class WebSocketService {
  constructor() {
    this.client = new WebSocketClient();
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectInterval = 3000;
  }

  // Generate WebSocket URL based on environment
  getWebSocketUrl() {
    // If an explicit environment override is provided, prefer it first.
    // This makes it easy to force connections to a specific host/port
    // (for example codespace backend on port 3001) without relying on
    // the browser host detection logic.
    if (process.env.REACT_APP_WS_URL && process.env.REACT_APP_WS_URL.length > 0) {
      return process.env.REACT_APP_WS_URL;
    }

    // Direct connection override: if `REACT_APP_WS_DIRECT=true` is set
    // and running in Codespaces/browser preview, attempt to connect directly
    // to the backend on localhost:3001. This is useful when the preview proxy
    // interferes with websocket upgrades and you have access to the backend
    // via the container's localhost.
    if (typeof window !== 'undefined' && window.location && window.location.hostname && window.location.hostname.includes('.app.github.dev')) {
      const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
      if (process.env.REACT_APP_WS_DIRECT === 'true') {
        // Try direct backend host on localhost:3001
        return `${protocol}://localhost:3001/ws`;
      }
      // Default: try same-origin preview host so the proxy handles WS upgrade
      return `${protocol}://${window.location.host}/ws`;
    }

    // Fallback to localhost websocket
    return 'ws://localhost:3001/ws';
  }

  connect() {
    const url = this.getWebSocketUrl();
    console.log('WebSocketService: Connecting to', url);
    
    this.client.connect(url);
    
    // Set up event listeners
    this.client.on('connected', () => {
      console.log('WebSocketService: Connected successfully');
      this.isConnected = true;
      this.reconnectAttempts = 0;
    });

    this.client.on('disconnected', (event) => {
      console.log('WebSocketService: Disconnected', event.code, event.reason);
      this.isConnected = false;
      
      // Attempt to reconnect if we haven't exceeded max attempts
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        this.reconnectAttempts++;
        console.log(`WebSocketService: Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
        setTimeout(() => this.connect(), this.reconnectInterval);
      } else {
        console.error('WebSocketService: Max reconnection attempts reached');
      }
    });

    this.client.on('error', (error) => {
      console.error('WebSocketService: Error', error);
      this.isConnected = false;
    });

    this.client.on('message', (data) => {
      console.log('WebSocketService: Received message', data);
      // Handle different message types
      this.handleMessage(data);
    });
  }

  disconnect() {
    console.log('WebSocketService: Disconnecting');
    this.client.disconnect();
    this.isConnected = false;
  }

  send(data) {
    if (this.isConnected) {
      this.client.send(data);
    } else {
      console.warn('WebSocketService: Cannot send message, not connected');
    }
  }

  handleMessage(data) {
    // Handle different types of WebSocket messages
    switch (data.type) {
      case 'connection':
        console.log('WebSocketService: Connection established:', data.message);
        break;
      case 'echo':
        console.log('WebSocketService: Echo received:', data.originalMessage);
        break;
      case 'error':
        console.error('WebSocketService: Server error:', data.message);
        break;
      default:
        console.log('WebSocketService: Unknown message type:', data.type);
    }
  }

  // Subscribe to specific events
  on(event, callback) {
    this.client.on(event, callback);
  }

  // Unsubscribe from events
  off(event, callback) {
    this.client.off(event, callback);
  }

  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      readyState: this.client.getReadyState(),
      reconnectAttempts: this.reconnectAttempts
    };
  }
}

// Create singleton instance
const websocketService = new WebSocketService();

export default websocketService;