import { io, Socket } from 'socket.io-client';
import { API_BASE_URL } from '../api/client';

export const SOCKET_URL = API_BASE_URL;

let socket: Socket | null = null;

export const getSocket = (): Socket => {
  if (!socket) {
    socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
    });
  }
  return socket;
};
