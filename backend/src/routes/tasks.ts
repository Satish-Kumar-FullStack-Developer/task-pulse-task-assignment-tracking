import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest, managerOnly } from '../middleware/auth';
import { TaskService } from '../services/TaskService';
import { TimeLogService } from '../services/TimeLogService';
import { NotificationService } from '../services/NotificationService';

const router = Router();
const prisma = new PrismaClient();

// Create task
router.post('/', managerOnly, async (req: AuthRequest, res) => {
  try {
    const { title, description, assigneeId, dueDate, priority } = req.body;

    if (!title || !assigneeId) {
      return res.status(400).json({ error: 'Title and assignee required' });
    }

    // Verify assignee exists and is an employee
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

    // Include related data
    const taskDetail = await TaskService.getTaskDetail(task.id);

    // Notify assignee
    await NotificationService.notifyTaskAssigned(taskDetail);

    res.status(201).json(taskDetail);
  } catch (error: any) {
    console.error('Create task error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get tasks for current user
router.get('/', async (req: AuthRequest, res) => {
  try {
    const { role } = req.user;
    let tasks;

    if (role === 'MANAGER') {
      tasks = await TaskService.getTasksByCreator(req.userId!);
    } else {
      tasks = await TaskService.getTasksByAssignee(req.userId!);
    }

    res.json(tasks);
  } catch (error: any) {
    console.error('Get tasks error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get task details
router.get('/:taskId', async (req: AuthRequest, res) => {
  try {
    const task = await TaskService.getTaskDetail(req.params.taskId);

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Check access
    if (
      task.creatorId !== req.userId &&
      task.assigneeId !== req.userId
    ) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json(task);
  } catch (error: any) {
    console.error('Get task error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update task status
router.patch('/:taskId/status', async (req: AuthRequest, res) => {
  try {
    const { status, returnReason } = req.body;
    const task = await TaskService.getTaskDetail(req.params.taskId);

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Check access
    if (
      task.creatorId !== req.userId &&
      task.assigneeId !== req.userId
    ) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const updatedTask = await TaskService.updateTaskStatus(
      req.params.taskId,
      status,
      req.userId!,
      req.user.role,
      returnReason
    );

    // Send notifications
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
    console.error('Update task status error:', error);
    res.status(400).json({ error: error.message });
  }
});

// Start/Pause timer
router.post('/:taskId/timer/start', async (req: AuthRequest, res) => {
  try {
    const task = await TaskService.getTaskDetail(req.params.taskId);

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    if (task.assigneeId !== req.userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Check if task is in progress
    if (task.status !== 'IN_PROGRESS') {
      return res.status(400).json({ error: 'Task must be in progress to start timer' });
    }

    // Check if timer already running
    const activeTimer = await TimeLogService.getActiveTimer(req.params.taskId);
    if (activeTimer) {
      return res.status(400).json({ error: 'Timer already running' });
    }

    const timeLog = await TimeLogService.startTimer(req.params.taskId, req.userId!);
    res.json(timeLog);
  } catch (error: any) {
    console.error('Start timer error:', error);
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
    console.error('Pause timer error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get task time logs
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
    console.error('Get time logs error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get manager's team tasks
router.get('/manager/team-tasks', managerOnly, async (req: AuthRequest, res) => {
  try {
    const tasks = await TaskService.getTasksForTeam(req.userId!);
    res.json(tasks);
  } catch (error: any) {
    console.error('Get team tasks error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get manager's dashboard stats
router.get('/manager/stats', managerOnly, async (req: AuthRequest, res) => {
  try {
    const stats = await TaskService.getTaskStats(req.userId!);
    res.json(stats);
  } catch (error: any) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
