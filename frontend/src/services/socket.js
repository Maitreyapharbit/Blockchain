// WebSocket removed. Provide a minimal socket service stub to keep imports working.
console.warn('socketService: WebSockets removed. Use EventSource via notificationService for server pushes.');

class SocketService {
  constructor() {
    this.isInitialized = false;
  }

  initSocket() {
    this.isInitialized = true;
    return null;
  }

  sendMessage(_msg) {
    console.warn('socketService.sendMessage called but WebSockets are removed.');
  }

  disconnect() {
    this.isInitialized = false;
  }

  isConnected() {
    return false;
  }
}

const socketService = new SocketService();
socketService.initSocket();
export default socketService;