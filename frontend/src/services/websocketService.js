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
    // Check if we're in GitHub Codespaces
    if (window.location.hostname.includes('app.github.dev')) {
      const codespaceName = process.env.REACT_APP_CODESPACE_NAME || 'verbose-tribble-7vxrwqqxr4g5fr9j5';
      return `wss://${codespaceName}-3001.app.github.dev/ws`;
    }
    
    // Default to local development
    return process.env.REACT_APP_WS_URL || 'ws://localhost:3001/ws';
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