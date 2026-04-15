import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';
import { NotificationService } from '../services/NotificationService';

const router = Router();
const prisma = new PrismaClient();

router.get('/', async (req: AuthRequest, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 20;
    const notifications = await NotificationService.getUserNotifications(
      req.userId!,
      limit
    );

    res.json(notifications);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/count/unread', async (req: AuthRequest, res) => {
  try {
    const count = await NotificationService.getUnreadCount(req.userId!);
    res.json({ count });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.patch('/:notificationId/read', async (req: AuthRequest, res) => {
  try {
    const notification = await prisma.notification.findUnique({
      where: { id: req.params.notificationId },
    });

    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    if (notification.recipientId !== req.userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const updated = await NotificationService.markAsRead(req.params.notificationId);
    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.patch('/read/all', async (req: AuthRequest, res) => {
  try {
    await NotificationService.markAllAsRead(req.userId!);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
