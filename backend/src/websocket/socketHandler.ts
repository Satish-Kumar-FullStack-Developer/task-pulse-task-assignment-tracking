import { Server as SocketIOServer } from 'socket.io';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

export const setupWebSocket = (io: SocketIOServer, prisma: PrismaClient) => {
  const userSockets = new Map<string, Set<string>>();

  io.on('connection', (socket) => {
    socket.on('user:join', (token: string) => {
      try {
        const decoded = jwt.verify(
          token,
          process.env.JWT_SECRET || 'your_jwt_secret_key_change_in_production'
        ) as any;

        const userId = decoded.userId;
        socket.userId = userId;
        socket.join(userId);

        if (!userSockets.has(userId)) {
          userSockets.set(userId, new Set());
        }
        userSockets.get(userId)!.add(socket.id);

        socket.emit('user:connected', { userId, socketId: socket.id });
      } catch (error) {
        socket.emit('error', { message: 'Authentication failed' });
      }
    });

    socket.on('task:join', (taskId: string) => {
      if (!socket.userId) {
        socket.emit('error', { message: 'Not authenticated' });
        return;
      }

      socket.join(`task:${taskId}`);
    });

    socket.on('task:leave', (taskId: string) => {
      socket.leave(`task:${taskId}`);
    });

    socket.on('task:statusChanged', (data: { taskId: string; status: string }) => {
      if (!socket.userId) return;

      io.to(`task:${data.taskId}`).emit('task:statusChanged', {
        ...data,
        updatedBy: socket.userId,
      });
    });

    socket.on('comment:added', (data: { taskId: string; comment: any }) => {
      if (!socket.userId) return;

      io.to(`task:${data.taskId}`).emit('comment:added', {
        ...data.comment,
        addedBy: socket.userId,
      });
    });

    socket.on('timer:started', (data: { taskId: string; startTime: string }) => {
      if (!socket.userId) return;

      io.to(`task:${data.taskId}`).emit('timer:started', {
        ...data,
        startedBy: socket.userId,
      });
    });

    socket.on('timer:paused', (data: { taskId: string; duration: number }) => {
      if (!socket.userId) return;

      io.to(`task:${data.taskId}`).emit('timer:paused', {
        ...data,
        pausedBy: socket.userId,
      });
    });

    socket.on('notification:read', (notificationId: string) => {
      if (!socket.userId) return;

      io.to(socket.userId).emit('notification:read', { notificationId });
    });

    socket.on('notifications:readAll', () => {
      if (!socket.userId) return;

      io.to(socket.userId).emit('notifications:readAll', { success: true });
    });

    socket.on('ping', () => {
      socket.emit('pong');
    });

    socket.on('disconnect', () => {
      if (socket.userId) {
        const sockets = userSockets.get(socket.userId);
        if (sockets) {
          sockets.delete(socket.id);
          if (sockets.size === 0) {
            userSockets.delete(socket.userId);
          }
        }
      }
    });

    socket.on('error', (error) => {
      // Handle socket errors silently
    });
  });
};
