import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class ActivityLogService {
  static async log(
    taskId: string,
    userId: string,
    action: string,
    details?: any
  ) {
    return prisma.activityLog.create({
      data: {
        taskId,
        userId,
        action,
        details: details ? JSON.stringify(details) : null,
      },
    });
  }

  static async getTaskActivity(taskId: string) {
    return prisma.activityLog.findMany({
      where: { taskId },
      include: {
        // Will add user info manually if needed
      },
      orderBy: {
        createdAt: 'asc',
      },
    });
  }

  static async getUserActivity(userId: string) {
    return prisma.activityLog.findMany({
      where: { userId },
      orderBy: {
        createdAt: 'desc',
      },
      take: 50,
    });
  }
}
