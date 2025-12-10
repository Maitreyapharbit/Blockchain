// WebSocket support removed. Provide a minimal stub with same API surface
class WebSocketClient {
  constructor() {
    this.connected = false;
    this.listeners = new Map();
    console.warn('WebSocketClient: WebSocket support has been removed. Use EventSource/notificationService instead.');
  }

  async connect(_url) {
    // no-op to keep imports working
    this.connected = false;
    return Promise.resolve();
  }

  disconnect() {
    this.connected = false;
  }

  send(_data) {
    console.warn('WebSocketClient.send() called but WebSockets are removed.');
  }

  on(event, cb) {
    if (!this.listeners.has(event)) this.listeners.set(event, new Set());
    this.listeners.get(event).add(cb);
  }

  off(event, cb) {
    if (this.listeners.has(event)) this.listeners.get(event).delete(cb);
  }

  emit(event, data) {
    if (this.listeners.has(event)) {
      for (const cb of this.listeners.get(event)) {
        try { cb(data); } catch (e) { /* ignore */ }
      }
    }
  }

  isConnected() {
    return false;
  }

  getReadyState() {
    // 3 === CLOSED in WebSocket API
    return 3;
  }
}

export default WebSocketClient;