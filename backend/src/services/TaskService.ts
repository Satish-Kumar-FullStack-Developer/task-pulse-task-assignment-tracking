import { PrismaClient, TaskStatus, TaskPriority } from '@prisma/client';
import { ActivityLogService } from './ActivityLogService';

const prisma = new PrismaClient();

export class TaskService {
  static async createTask(
    title: string,
    description: string | undefined,
    assigneeId: string,
    creatorId: string,
    dueDate: string | undefined,
    priority: TaskPriority = 'MEDIUM'
  ) {
    const task = await prisma.task.create({
      data: {
        title,
        description,
        assigneeId,
        creatorId,
        dueDate: dueDate ? new Date(dueDate) : null,
        priority,
        status: 'PENDING',
      },
      include: {
        creator: true,
        assignee: true,
      },
    });

    // Log activity
    await ActivityLogService.log(task.id, creatorId, 'task_created', {
      title,
      assigneeId,
    });

    return task;
  }

  static async getTasksByCreator(creatorId: string) {
    return prisma.task.findMany({
      where: { creatorId },
      include: {
        creator: true,
        assignee: true,
        timeLogs: true,
        comments: {
          include: {
            author: true,
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  static async getTasksByAssignee(assigneeId: string) {
    return prisma.task.findMany({
      where: { assigneeId },
      include: {
        creator: true,
        assignee: true,
        timeLogs: true,
        comments: {
          include: {
            author: true,
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  static async getTaskDetail(taskId: string) {
    return prisma.task.findUnique({
      where: { id: taskId },
      include: {
        creator: true,
        assignee: true,
        timeLogs: {
          orderBy: {
            createdAt: 'asc',
          },
        },
        comments: {
          include: {
            author: true,
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
    });
  }

  static validateTransition(currentStatus: TaskStatus, nextStatus: TaskStatus, userRole: string) {
    const validTransitions: Record<TaskStatus, TaskStatus[]> = {
      PENDING: ['IN_PROGRESS'],
      IN_PROGRESS: ['COMPLETED', 'PENDING'],
      COMPLETED: ['APPROVED', 'RETURNED'],
      APPROVED: [],
      RETURNED: ['IN_PROGRESS'],
    };

    if (!validTransitions[currentStatus]?.includes(nextStatus)) {
      throw new Error(`Cannot transition from ${currentStatus} to ${nextStatus}`);
    }

    // Only managers can approve/return
    if ((nextStatus === 'APPROVED' || nextStatus === 'RETURNED') && userRole !== 'MANAGER') {
      throw new Error('Only managers can approve or return tasks');
    }
  }

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

    // Validate transition
    this.validateTransition(task.status, nextStatus, userRole);

    // Validate user can perform this action
    if (nextStatus === 'IN_PROGRESS' && task.assigneeId !== userId) {
      throw new Error('Only the assigned employee can start this task');
    }

    if ((nextStatus === 'APPROVED' || nextStatus === 'RETURNED') && task.creatorId !== userId) {
      throw new Error('Only the task creator can approve or return tasks');
    }

    let updateData: any = { status: nextStatus };

    if (nextStatus === 'IN_PROGRESS' && !task.startedAt) {
      updateData.startedAt = new Date();
    }

    if (nextStatus === 'COMPLETED') {
      updateData.completedAt = new Date();
    }

    if (nextStatus === 'APPROVED') {
      updateData.approvedAt = new Date();
    }

    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: updateData,
      include: {
        creator: true,
        assignee: true,
        timeLogs: true,
        comments: {
          include: {
            author: true,
          },
        },
      },
    });

    // Log activity
    await ActivityLogService.log(taskId, userId, `task_${nextStatus.toLowerCase()}`, {
      from: task.status,
      to: nextStatus,
    });

    // If returned, add comment
    if (nextStatus === 'RETURNED' && returnReason) {
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

  static async getTasksForTeam(managerId: string) {
    const users = await prisma.user.findMany({
      where: {
        OR: [{ id: managerId }, { managerId }],
      },
      select: { id: true },
    });

    const userIds = users.map((u) => u.id);

    return prisma.task.findMany({
      where: {
        OR: [{ creatorId: { in: userIds } }, { assigneeId: { in: userIds } }],
      },
      include: {
        creator: true,
        assignee: true,
        timeLogs: true,
        comments: {
          include: {
            author: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  static async getOverdueTasks(userId: string) {
    const now = new Date();
    return prisma.task.findMany({
      where: {
        assigneeId: userId,
        dueDate: {
          lt: now,
        },
        status: {
          in: ['PENDING', 'IN_PROGRESS'],
        },
      },
    });
  }

  static async getTaskStats(managerId: string) {
    const tasks = await this.getTasksForTeam(managerId);

    const stats = {
      total: tasks.length,
      pending: tasks.filter((t) => t.status === 'PENDING').length,
      inProgress: tasks.filter((t) => t.status === 'IN_PROGRESS').length,
      completed: tasks.filter((t) => t.status === 'COMPLETED').length,
      approved: tasks.filter((t) => t.status === 'APPROVED').length,
      returned: tasks.filter((t) => t.status === 'RETURNED').length,
      overdue: tasks.filter(
        (t) =>
          t.dueDate &&
          new Date(t.dueDate) < new Date() &&
          ['PENDING', 'IN_PROGRESS'].includes(t.status)
      ).length,
    };

    return stats;
  }
}
