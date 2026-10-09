import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.PROD ? undefined : (import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000');

class SocketService {
  constructor() {
    this.socket = null;
  }

  connect(token) {
    if (!this.socket) {
      this.socket = io(SOCKET_URL, {
        auth: {
          token,
        },
      });
      console.log('Socket initialized with token');
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  getSocket() {
    return this.socket;
  }
}

const socketService = new SocketService();
export default socketService;
