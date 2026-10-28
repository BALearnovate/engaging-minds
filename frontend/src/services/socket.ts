import { io, Socket } from 'socket.io-client';

export const getSocketUrl = (): string => {
  if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_WS_URL) {
    return import.meta.env.VITE_WS_URL;
  }
  if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }
  if (typeof window !== 'undefined') {
    const { protocol, hostname, port } = window.location;
    if ((hostname === 'localhost' || hostname === '127.0.0.1') && port && port !== '3000') {
      return `${protocol}//${hostname}:3000`;
    }
    return window.location.origin;
  }
  return 'http://localhost:3000';
};

export const SOCKET_URL = getSocketUrl();

let socket: Socket | null = null;

export const getSocket = (): Socket => {
  if (!socket) {
    const targetUrl = getSocketUrl();
    console.log(`[Socket.IO] Initializing socket connection to: ${targetUrl}`);
    socket = io(targetUrl, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
    });

    socket.on('connect', () => {
      console.log(`[Socket.IO] Connected successfully with ID: ${socket?.id}`);
    });

    socket.on('disconnect', (reason) => {
      console.warn(`[Socket.IO] Disconnected: ${reason}`);
    });

    socket.on('connect_error', (error) => {
      console.error(`[Socket.IO] Connection error:`, error);
    });
  }

  if (!socket.connected) {
    socket.connect();
  }

  return socket;
};
