import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest, managerOnly } from '../middleware/auth';
import { ActivityLogService } from '../services/ActivityLogService';

const router = Router();
const prisma = new PrismaClient();

router.get('/tasks/:taskId', async (req: AuthRequest, res) => {
  try {
    const task = await prisma.task.findUnique({
      where: { id: req.params.taskId },
    });

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    if (task.creatorId !== req.userId && task.assigneeId !== req.userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const activities = await ActivityLogService.getTaskActivity(req.params.taskId);

    const enrichedActivities = await Promise.all(
      activities.map(async (activity) => {
        const user = await prisma.user.findUnique({
          where: { id: activity.userId },
          select: { id: true, name: true, email: true, role: true },
        });

        return {
          ...activity,
          user,
          details: activity.details ? JSON.parse(activity.details) : null,
        };
      })
    );

    res.json(enrichedActivities);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/users/:userId', managerOnly, async (req: AuthRequest, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.userId },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.managerId !== req.userId && user.id !== req.userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const activities = await ActivityLogService.getUserActivity(req.params.userId);

    res.json(activities);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
