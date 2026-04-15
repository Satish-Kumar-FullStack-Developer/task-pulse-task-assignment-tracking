import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest, managerOnly } from '../middleware/auth';
import { ActivityLogService } from '../services/ActivityLogService';

const router = Router();
const prisma = new PrismaClient();

// Get task activity log
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

    // Enrich with user details
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
    
});

// Get user activity (for admin/dashboard)
router.get('/users/:userId', managerOnly, async (req: AuthRequest, res) => {
  try {
    // Verify userId is in manager's team or is themselves
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

export default router;
