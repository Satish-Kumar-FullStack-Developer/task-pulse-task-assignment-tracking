import { PrismaClient, TaskStatus, TaskPriority } from '@prisma/client';
import { ActivityLogService } from './ActivityLogService';
import { TASK_STATUS, TASK_PRIORITY, USER_ROLES } from '../constants';

const prisma = new PrismaClient();

export class TaskService {
  static async createTask(
    title: string,
    description: string | undefined,
    assigneeId: string,
    creatorId: string,
    dueDate: string | undefined,
    priority: TaskPriority = TASK_PRIORITY.MEDIUM
  ) {
    const task = await prisma.task.create({
      data: {
        title,
        description,
        assigneeId,
        creatorId,
        dueDate: dueDate ? new Date(dueDate) : null,
        priority,
        status: TASK_STATUS.PENDING,
      },
      include: {
        creator: true,
        assignee: true,
      },
    });

    await ActivityLogService.log(task.id, creatorId, 'task_created', {
      title,
      assigneeId,
    });

    return task;
  }

  static async getTasksByCreator = (creatorId: string) => {
    return await prisma.task.findMany({
      where: { creatorId },
      include: {
        creator: true,
        assignee: true,
        timeLogs: true,
        comments: {
          include: { author: true },
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  };

  static async getTasksByAssignee = (assigneeId: string) => {
    return await prisma.task.findMany({
      where: { assigneeId },
      include: {
        creator: true,
        assignee: true,
        timeLogs: true,
        comments: {
          include: { author: true },
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  };

  static async getTaskDetail = (taskId: string) => {
    return await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        creator: true,
        assignee: true,
        timeLogs: { orderBy: { createdAt: 'asc' } },
        comments: {
          include: { author: true },
          orderBy: { createdAt: 'asc' },
        },
      },
    });
  };

  static validateTransition = (currentStatus: TaskStatus, nextStatus: TaskStatus, userRole: string) => {
    const validTransitions: Record<TaskStatus, TaskStatus[]> = {
      PENDING: [TASK_STATUS.IN_PROGRESS as TaskStatus],
      IN_PROGRESS: [TASK_STATUS.COMPLETED as TaskStatus, TASK_STATUS.PENDING as TaskStatus],
      COMPLETED: [TASK_STATUS.APPROVED as TaskStatus, TASK_STATUS.RETURNED as TaskStatus],
      APPROVED: [],
      RETURNED: [TASK_STATUS.IN_PROGRESS as TaskStatus],
    };

    if (!validTransitions[currentStatus]?.includes(nextStatus)) {
      throw new Error(`Cannot transition from ${currentStatus} to ${nextStatus}`);
    }

    if ((nextStatus === TASK_STATUS.APPROVED || nextStatus === TASK_STATUS.RETURNED) && userRole !== USER_ROLES.MANAGER) {
      throw new Error('Only managers can approve or return tasks');
    }
  };

  static async updateTaskStatus(
    taskId: string,
    nextStatus: TaskStatus,
    userId: string,
    userRole: string,
    returnReason?: string
  ) {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: { assignee: true, creator: true },
    });

    if (!task) {
      throw new Error('Task not found');
    }

    this.validateTransition(task.status, nextStatus, userRole);

    if (nextStatus === TASK_STATUS.IN_PROGRESS && task.assigneeId !== userId) {
      throw new Error('Only the assigned employee can start this task');
    }

    if ((nextStatus === TASK_STATUS.APPROVED || nextStatus === TASK_STATUS.RETURNED) && task.creatorId !== userId) {
      throw new Error('Only the task creator can approve or return tasks');
    }

    const updateData: any = { status: nextStatus };

    if (nextStatus === TASK_STATUS.IN_PROGRESS && !task.startedAt) {
      updateData.startedAt = new Date();
    }

    if (nextStatus === TASK_STATUS.COMPLETED) {
      updateData.completedAt = new Date();
    }

    if (nextStatus === TASK_STATUS.APPROVED) {
      updateData.approvedAt = new Date();
    }

    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: updateData,
      include: {
        creator: true,
        assignee: true,
        timeLogs: true,
        comments: { include: { author: true } },
      },
    });

    await ActivityLogService.log(taskId, userId, `task_${nextStatus.toLowerCase()}`, {
      from: task.status,
      to: nextStatus,
    });

    if (nextStatus === TASK_STATUS.RETURNED && returnReason) {
      await prisma.comment.create({
        data: {
          taskId,
          authorId: userId,
          content: `[MANAGER] Task returned: ${returnReason}`,
          isSystem: true,
        },
      });
    }

    return updatedTask;
  }

  static async getTasksForTeam = (managerId: string) => {
    return await prisma.task.findMany({
      where: { creatorId: managerId },
      include: {
        creator: true,
        assignee: true,
        timeLogs: true,
        comments: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  };

  static async getTaskStats = async (managerId: string) => {
    const tasks = await prisma.task.findMany({
      where: { creatorId: managerId },
    });

    return {
      total: tasks.length,
      pending: tasks.filter((t) => t.status === TASK_STATUS.PENDING).length,
      inProgress: tasks.filter((t) => t.status === TASK_STATUS.IN_PROGRESS).length,
      completed: tasks.filter((t) => t.status === TASK_STATUS.COMPLETED).length,
      approved: tasks.filter((t) => t.status === TASK_STATUS.APPROVED).length,
      returned: tasks.filter((t) => t.status === TASK_STATUS.RETURNED).length,
    };
  };
}
