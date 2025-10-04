import WebSocketClient from './WebSocketClient';

class SocketService {
  constructor() {
    this.client = new WebSocketClient();
    this.isInitialized = false;
    this.wsUrl = process.env.REACT_APP_WS_URL || 'ws://localhost:3001';
  }

  initSocket() {
    if (this.isInitialized) {
      return;
    }

    console.log('Initializing WebSocket connection...');
    
    // Set up event listeners
    this.client.on('connected', () => {
      console.log('WebSocket connected successfully');
    });

    this.client.on('disconnected', (event) => {
      console.log('WebSocket disconnected:', event);
    });

    this.client.on('error', (error) => {
      console.error('WebSocket error:', error);
    });

    this.client.on('message', (data) => {
      console.log('Received WebSocket message:', data);
      this.handleMessage(data);
    });

    // Connect to WebSocket
    this.client.connect(this.wsUrl);
    this.isInitialized = true;
  }

  handleMessage(data) {
    // Handle different types of messages
    switch (data.type) {
      case 'connection':
        console.log('Connection message:', data.message);
        break;
      case 'echo':
        console.log('Echo message:', data.originalMessage);
        break;
      case 'error':
        console.error('WebSocket server error:', data.message);
        break;
      default:
        console.log('Unknown message type:', data.type);
    }
  }

  sendMessage(message) {
    if (this.client.isConnected()) {
      this.client.send(message);
    } else {
      console.warn('WebSocket not connected. Cannot send message.');
    }
  }

  disconnect() {
    this.client.disconnect();
    this.isInitialized = false;
  }

  isConnected() {
    return this.client.isConnected();
  }
}

// Create singleton instance
const socketService = new SocketService();

// Initialize socket when module is imported
socketService.initSocket();

export default socketService;