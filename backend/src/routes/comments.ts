import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';
import { NotificationService } from '../services/NotificationService';
import { ActivityLogService } from '../services/ActivityLogService';

const router = Router();
const prisma = new PrismaClient();

// Create comment
router.post('/', async (req: AuthRequest, res) => {
  try {
    const { taskId, content } = req.body;

    if (!taskId || !content) {
      return res.status(400).json({ error: 'taskId and content required' });
    }

    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        creator: true,
        assignee: true,
      },
    });

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Check access
    if (task.creatorId !== req.userId && task.assigneeId !== req.userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Sanitize comment input
    const sanitizedContent = content
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .trim();

    if (sanitizedContent.length === 0 || sanitizedContent.length > 1000) {
      return res.status(400).json({ error: 'Comment must be 1-1000 characters' });
    }

    const comment = await prisma.comment.create({
      data: {
        taskId,
        authorId: req.userId!,
        content: sanitizedContent,
      },
      include: {
        author: true,
      },
    });

    // Log activity
    await ActivityLogService.log(taskId, req.userId!, 'commented', {
      commentId: comment.id,
    });

    // Notify other party
    await NotificationService.notifyCommentAdded(comment, task);

    // Emit via WebSocket
    if (global.io) {
      global.io.to(taskId).emit('comment:added', comment);
    }

    res.status(201).json(comment);
  } catch (error: any) {
    console.error('Create comment error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get task comments
router.get('/:taskId', async (req: AuthRequest, res) => {
  try {
    const task = await prisma.task.findUnique({
      where: { id: req.params.taskId },
    });

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Check access
    if (task.creatorId !== req.userId && task.assigneeId !== req.userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const comments = await prisma.comment.findMany({
      where: { taskId: req.params.taskId },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    res.json(comments);
  } catch (error: any) {
    console.error('Get comments error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
