import websocketService from './websocketService';

class SocketService {
  constructor() {
    this.isInitialized = false;
  }

  initSocket() {
    if (this.isInitialized) {
      return;
    }

    console.log('Initializing WebSocket connection...');
    
    // Set up event listeners
    websocketService.on('connected', () => {
      console.log('WebSocket connected successfully');
    });

    websocketService.on('disconnected', (event) => {
      console.log('WebSocket disconnected:', event);
    });

    websocketService.on('error', (error) => {
      console.error('WebSocket error:', error);
    });

    websocketService.on('message', (data) => {
      console.log('Received WebSocket message:', data);
      this.handleMessage(data);
    });

    // Connect to WebSocket
    websocketService.connect();
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
    if (websocketService.isConnected) {
      websocketService.send(message);
    } else {
      console.warn('WebSocket not connected. Cannot send message.');
    }
  }

  disconnect() {
    websocketService.disconnect();
    this.isInitialized = false;
  }

  isConnected() {
    return websocketService.isConnected;
  }
}

// Create singleton instance
const socketService = new SocketService();

// Initialize socket when module is imported
socketService.initSocket();

export default socketService;