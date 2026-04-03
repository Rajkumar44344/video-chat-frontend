import { useRef, useCallback } from 'react';
import { io } from 'socket.io-client';

const WS_URL = import.meta.env.VITE_WS_URL || 'https://video-chat-python-backend.onrender.com/';

const useWebSocket = () => {
  const socketRef = useRef(null);

  const connect = useCallback((onConnectCallback) => {
    const socket = io(WS_URL, {
      path: '/ws',
      transports: ['websocket', 'polling'],
      reconnectionDelay: 3000,
    });

    socket.on('connect', () => {
      console.log('Socket.IO connected:', socket.id);
      onConnectCallback?.(socket);
    });

    socket.on('connect_error', (err) => console.error('Connection error:', err.message));

    socketRef.current = socket;
  }, []);

  const send = useCallback((event, data) => {
    socketRef.current?.emit(event, data);
  }, []);

  const on = useCallback((event, callback) => {
    socketRef.current?.on(event, callback);
  }, []);

  const off = useCallback((event) => {
    socketRef.current?.off(event);
  }, []);

  const disconnect = useCallback(() => {
    socketRef.current?.disconnect();
  }, []);

  return { connect, send, on, off, disconnect, socketRef };
};

export default useWebSocket;
