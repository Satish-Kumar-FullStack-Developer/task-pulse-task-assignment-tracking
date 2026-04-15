import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';

export function useWebSocket() {
  const { token } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!token) return;

    const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:3001';
    const newSocket = io(wsUrl, {
      auth: { token },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    newSocket.on('connect', () => {
      console.log('WebSocket connected');
      newSocket.emit('user:join', token);
      setConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('WebSocket disconnected');
      setConnected(false);
    });

    newSocket.on('error', (error) => {
      console.error('WebSocket error:', error);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [token]);

  return { socket, connected };
}

export function useTaskUpdates(taskId: string) {
  const { socket } = useWebSocket();
  const [updates, setUpdates] = useState<any>(null);

  useEffect(() => {
    if (!socket || !taskId) return;

    socket.emit('task:join', taskId);

    socket.on('task:statusChanged', (data) => {
      setUpdates({ type: 'statusChanged', ...data });
    });

    socket.on('comment:added', (comment) => {
      setUpdates({ type: 'commentAdded', comment });
    });

    socket.on('timer:started', (data) => {
      setUpdates({ type: 'timerStarted', ...data });
    });

    socket.on('timer:paused', (data) => {
      setUpdates({ type: 'timerPaused', ...data });
    });

    return () => {
      socket.emit('task:leave', taskId);
      socket.off('task:statusChanged');
      socket.off('comment:added');
      socket.off('timer:started');
      socket.off('timer:paused');
    };
  }, [socket, taskId]);

  return updates;
}
