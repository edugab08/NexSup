'use client';

import { io, Socket } from 'socket.io-client';

// A URL base do socket é a mesma da API, sem o sufixo /api
const SOCKET_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api')
  .replace(/\/api\/?$/, '');

let socket: Socket | null = null;

// Cria (ou reaproveita) a conexão socket autenticada pelo JWT atual.
export function getSocket(): Socket | null {
  if (typeof window === 'undefined') return null;
  const token = localStorage.getItem('nexsupport_token');
  if (!token) return null;

  if (!socket) {
    socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket'],
      autoConnect: true,
    });
  }
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
