import { Server as SocketIOServer } from 'socket.io';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

export const setupWebSocket = (io: SocketIOServer, prisma: PrismaClient) => {
  // Store user socket mappings
  const userSockets = new Map<string, Set<string>>();

  io.on('connection', (socket) => {
    console.log('WebSocket client connected:', socket.id);

    // User joins - identify themselves with token
    socket.on('user:join', (token: string) => {
      try {
        const decoded = jwt.verify(
          token,
          process.env.JWT_SECRET || 'your_jwt_secret_key_change_in_production'
        ) as any;

        const userId = decoded.userId;
        socket.userId = userId;
        socket.join(userId); // Join room named after userId

        // Track socket
        if (!userSockets.has(userId)) {
          userSockets.set(userId, new Set());
        }
        userSockets.get(userId)!.add(socket.id);

        console.log(`User ${userId} joined with socket ${socket.id}`);

        // Send connected status
        socket.emit('user:connected', { userId, socketId: socket.id });
      } catch (error) {
        console.error('WebSocket auth error:', error);
        socket.emit('error', { message: 'Authentication failed' });
      }
    });

    // Task room join (for real-time task updates)
    socket.on('task:join', (taskId: string) => {
      if (!socket.userId) {
        socket.emit('error', { message: 'Not authenticated' });
        return;
      }

      socket.join(`task:${taskId}`);
      console.log(`Socket ${socket.id} joined task room ${taskId}`);
    });

    socket.on('task:leave', (taskId: string) => {
      socket.leave(`task:${taskId}`);
      console.log(`Socket ${socket.id} left task room ${taskId}`);
    });

    // Broadcast task status change
    socket.on('task:statusChanged', (data: { taskId: string; status: string }) => {
      if (!socket.userId) return;

      io.to(`task:${data.taskId}`).emit('task:statusChanged', {
        ...data,
        updatedBy: socket.userId,
      });
    });

    // Broadcast comment added
    socket.on('comment:added', (data: { taskId: string; comment: any }) => {
      if (!socket.userId) return;

      io.to(`task:${data.taskId}`).emit('comment:added', {
        ...data.comment,
        addedBy: socket.userId,
      });
    });

    // Timer updates
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

    // Notification events
    socket.on('notification:read', (notificationId: string) => {
      if (!socket.userId) return;

      io.to(socket.userId).emit('notification:read', { notificationId });
    });

    socket.on('notifications:readAll', () => {
      if (!socket.userId) return;

      io.to(socket.userId).emit('notifications:readAll', { success: true });
    });

    // Heartbeat
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
        console.log(`User ${socket.userId} disconnected (${socket.id})`);
      } else {
        console.log(`Anonymous socket disconnected (${socket.id})`);
      }
    });

    socket.on('error', (error) => {
      console.error('WebSocket error:', error);
    });
  });
};

declare global {
  var io: SocketIOServer;
}
