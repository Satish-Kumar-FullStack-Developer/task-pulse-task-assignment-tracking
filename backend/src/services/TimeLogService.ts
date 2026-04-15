import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class TimeLogService {
  static async startTimer(taskId: string, userId: string) {
    const timeLog = await prisma.timeLog.create({
      data: {
        taskId,
        userId,
        startTime: new Date(),
      },
    });

    return timeLog;
  }

  static async pauseTimer(timeLogId: string) {
    const timeLog = await prisma.timeLog.findUnique({
      where: { id: timeLogId },
    });

    if (!timeLog) {
      throw new Error('Time log not found');
    }

    if (timeLog.endTime) {
      throw new Error('Timer already paused');
    }

    const now = new Date();
    const duration = Math.floor(
      (now.getTime() - timeLog.startTime.getTime()) / 1000
    );

    return prisma.timeLog.update({
      where: { id: timeLogId },
      data: {
        endTime: now,
        duration,
      },
    });
  }

  static async getTaskTimeLogs(taskId: string) {
    return prisma.timeLog.findMany({
      where: { taskId },
      orderBy: {
        createdAt: 'asc',
      },
    });
  }

  static async getTotalTaskTime(taskId: string) {
    const timeLogs = await this.getTaskTimeLogs(taskId);
    return timeLogs.reduce((total, log) => total + (log.duration || 0), 0);
  }

  static async getActiveTimer(taskId: string) {
    return prisma.timeLog.findFirst({
      where: {
        taskId,
        endTime: null,
      },
    });
  }

  static async getTaskElapsedTime(taskId: string): Promise<number> {
    const timeLogs = await this.getTaskTimeLogs(taskId);
    let totalTime = 0;

    for (const log of timeLogs) {
      if (log.duration) {
        totalTime += log.duration;
      } else if (!log.endTime) {
        // Still running
        const elapsed = Math.floor(
          (new Date().getTime() - log.startTime.getTime()) / 1000
        );
        totalTime += elapsed;
      }
    }

    return totalTime;
  }
}
