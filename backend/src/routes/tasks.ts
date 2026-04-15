import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest, managerOnly } from '../middleware/auth';
import { TaskService } from '../services/TaskService';
import { TimeLogService } from '../services/TimeLogService';
import { NotificationService } from '../services/NotificationService';

const router = Router();
const prisma = new PrismaClient();

router.post('/', managerOnly, async (req: AuthRequest, res) => {
  try {
    const { title, description, assigneeId, dueDate, priority } = req.body;

    if (!title || !assigneeId) {
      return res.status(400).json({ error: 'Title and assignee required' });
    }

    const assignee = await prisma.user.findUnique({
      where: { id: assigneeId },
    });

    if (!assignee || assignee.role !== 'EMPLOYEE') {
      return res.status(400).json({ error: 'Assignee must be an employee' });
    }

    const task = await TaskService.createTask(
      title,
      description,
      assigneeId,
      req.userId!,
      dueDate,
      priority || 'MEDIUM'
    );

    const taskDetail = await TaskService.getTaskDetail(task.id);
    await NotificationService.notifyTaskAssigned(taskDetail);

    res.status(201).json(taskDetail);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/', async (req: AuthRequest, res) => {
  try {
    const { role } = req.user;
    const tasks = role === 'MANAGER'
      ? await TaskService.getTasksByCreator(req.userId!)
      : await TaskService.getTasksByAssignee(req.userId!);

    res.json(tasks);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:taskId', async (req: AuthRequest, res) => {
  try {
    const task = await TaskService.getTaskDetail(req.params.taskId);

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    if (task.creatorId !== req.userId && task.assigneeId !== req.userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json(task);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.patch('/:taskId/status', async (req: AuthRequest, res) => {
  try {
    const { status, returnReason } = req.body;
    const task = await TaskService.getTaskDetail(req.params.taskId);

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    if (task.creatorId !== req.userId && task.assigneeId !== req.userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const updatedTask = await TaskService.updateTaskStatus(
      req.params.taskId,
      status,
      req.userId!,
      req.user.role,
      returnReason
    );

    if (status === 'IN_PROGRESS') {
      await NotificationService.notifyTaskStarted(updatedTask);
    } else if (status === 'COMPLETED') {
      const totalTime = await TimeLogService.getTotalTaskTime(req.params.taskId);
      await NotificationService.notifyTaskCompleted(updatedTask, totalTime);
    } else if (status === 'RETURNED') {
      await NotificationService.notifyTaskReturned(updatedTask, returnReason);
    } else if (status === 'APPROVED') {
      await NotificationService.notifyTaskApproved(updatedTask);
    }

    res.json(updatedTask);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/:taskId/timer/start', async (req: AuthRequest, res) => {
  try {
    const task = await TaskService.getTaskDetail(req.params.taskId);

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    if (task.assigneeId !== req.userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (task.status !== 'IN_PROGRESS') {
      return res.status(400).json({ error: 'Task must be in progress to start timer' });
    }

    const activeTimer = await TimeLogService.getActiveTimer(req.params.taskId);
    if (activeTimer) {
      return res.status(400).json({ error: 'Timer already running' });
    }

    const timeLog = await TimeLogService.startTimer(req.params.taskId, req.userId!);
    res.json(timeLog);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/:taskId/timer/pause', async (req: AuthRequest, res) => {
  try {
    const { timeLogId } = req.body;

    if (!timeLogId) {
      return res.status(400).json({ error: 'timeLogId required' });
    }

    const timeLog = await prisma.timeLog.findUnique({
      where: { id: timeLogId },
    });

    if (!timeLog || timeLog.taskId !== req.params.taskId) {
      return res.status(404).json({ error: 'Time log not found' });
    }

    const pausedLog = await TimeLogService.pauseTimer(timeLogId);
    res.json(pausedLog);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:taskId/timeLogs', async (req: AuthRequest, res) => {
  try {
    const task = await TaskService.getTaskDetail(req.params.taskId);

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    if (task.creatorId !== req.userId && task.assigneeId !== req.userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const timeLogs = await TimeLogService.getTaskTimeLogs(req.params.taskId);
    const totalTime = await TimeLogService.getTotalTaskTime(req.params.taskId);

    res.json({
      timeLogs,
      totalTime,
      elapsedTime: await TimeLogService.getTaskElapsedTime(req.params.taskId),
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/manager/team-tasks', managerOnly, async (req: AuthRequest, res) => {
  try {
    const tasks = await TaskService.getTasksForTeam(req.userId!);
    res.json(tasks);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/manager/stats', managerOnly, async (req: AuthRequest, res) => {
  try {
    const stats = await TaskService.getTaskStats(req.userId!);
    res.json(stats);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
