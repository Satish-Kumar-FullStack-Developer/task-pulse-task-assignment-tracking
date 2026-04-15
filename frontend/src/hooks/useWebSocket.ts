import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';

export const useWebSocket = () => {
  const { token } = useAuth();
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!token) return;

    const ws = io(import.meta.env.VITE_WS_URL || 'ws://localhost:3001', {
      auth: { token },
    });

    ws.on('connect', () => {
      ws.emit('user:join', token);
      setConnected(true);
    });

    ws.on('disconnect', () => setConnected(false));
    setSocket(ws);

    return () => ws.disconnect();
  }, [token]);

  return { socket, connected };
};

export const useTaskUpdates = (taskId: string) => {
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
