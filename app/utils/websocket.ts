import { io, Socket } from 'socket.io-client';

class WebSocketService {
  private socket: Socket | null = null;
  private listeners: Map<string, Function[]> = new Map();
  private isConnected = false;

  connect(token: string, userId: string) {
    if (this.socket?.connected) {
      console.log('WebSocket already connected');
      return;
    }

    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3001';
    console.log('Connecting to WebSocket:', wsUrl);

    this.socket = io(wsUrl, {
      auth: { token },
      query: { userId },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });

    this.socket.on('connect', () => {
      console.log('WebSocket connected successfully');
      this.isConnected = true;
      // Emit a custom 'connected' event that our components listen for
      this.emitEvent('connected', { message: 'Connected to server' });
    });

    this.socket.on('disconnect', (reason) => {
      console.log('WebSocket disconnected:', reason);
      this.isConnected = false;
      this.emitEvent('disconnected', { reason });
    });

    this.socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      this.emitEvent('error', { message: 'Connection failed: ' + error.message });
    });

    // Listen for all events and trigger callbacks
    this.socket.onAny((event, data) => {
      console.log('Received event:', event, data);
      const callbacks = this.listeners.get(event);
      if (callbacks) {
        callbacks.forEach(cb => cb(data));
      }
    });
  }

  private emitEvent(event: string, data?: any) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(cb => cb(data));
    }
  }

  send(event: string, data?: any) {
    if (this.socket && this.socket.connected) {
      console.log('Sending event:', event, data);
      this.socket.emit(event, data);
    } else {
      console.warn(`WebSocket not connected, cannot send: ${event}`);
      this.emitEvent('error', { message: 'Not connected to server' });
    }
  }

  on(event: string, callback: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  off(event: string, callback?: Function) {
    if (!callback) {
      this.listeners.delete(event);
    } else {
      const callbacks = this.listeners.get(event);
      if (callbacks) {
        const index = callbacks.indexOf(callback);
        if (index !== -1) callbacks.splice(index, 1);
      }
    }
  }

  emit(event: string, data?: any) {
    this.send(event, data);
  }

  once(event: string, callback: Function) {
    const wrapper = (data: any) => {
      callback(data);
      this.off(event, wrapper);
    };
    this.on(event, wrapper);
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }
}

export const webSocketService = new WebSocketService();