import { PrismaClient, NotificationType, NotificationChannel } from '@prisma/client';
import { WhatsAppService } from './WhatsAppService';

const prisma = new PrismaClient();

export interface NotificationEvent {
  type: NotificationType;
  recipientId: string;
  message: string;
  taskId?: string;
  phone?: string;
  userRole?: string;
}

export class NotificationService {
  static async createNotification(event: NotificationEvent) {
    // Create in-app notification
    const notification = await prisma.notification.create({
      data: {
        type: event.type,
        recipientId: event.recipientId,
        message: event.message,
        taskId: event.taskId,
      },
      include: {
        recipient: true,
      },
    });

    // Emit via WebSocket if available
    if (global.io) {
      global.io.to(event.recipientId).emit('notification:created', {
        id: notification.id,
        type: event.type,
        message: event.message,
        taskId: event.taskId,
        createdAt: notification.createdAt,
      });
    }

    // Send WhatsApp if phone provided and event type supports it
    if (event.phone && this.shouldSendWhatsApp(event.type)) {
      await this.sendWhatsAppNotification(event, notification.id);
    }

    return notification;
  }

  private static shouldSendWhatsApp(type: NotificationType): boolean {
    return ['TASK_ASSIGNED', 'TASK_COMPLETED'].includes(type);
  }

  private static async sendWhatsAppNotification(
    event: NotificationEvent,
    notificationId: string
  ) {
    try {
      const recipient = await prisma.user.findUnique({
        where: { id: event.recipientId },
      });

      if (!recipient?.phone) {
        console.warn(`User ${event.recipientId} has no phone number configured`);
        return;
      }

      const parameters = this.extractTemplateParameters(event);
      const templateName = this.getTemplateNameForEvent(event.type);

      const result = await WhatsAppService.sendMessage({
        phone: recipient.phone,
        templateName,
        parameters,
      });

      // Log delivery
      await prisma.deliveryLog.create({
        data: {
          notificationId,
          channel: 'WHATSAPP',
          provider: process.env.WHATSAPP_PROVIDER || 'msg91',
          status: result.success ? 'SENT' : 'FAILED',
          externalId: result.externalId,
          errorMessage: result.error,
        },
      });

      console.log(
        `WhatsApp notification sent to ${recipient.phone}:`,
        result
      );
    } catch (error: any) {
      console.error('Failed to send WhatsApp notification:', error);

      // Log failure
      await prisma.deliveryLog.create({
        data: {
          notificationId,
          channel: 'WHATSAPP',
          provider: process.env.WHATSAPP_PROVIDER || 'msg91',
          status: 'FAILED',
          errorMessage: error.message,
        },
      });
    }
  }

  private static getTemplateNameForEvent(type: NotificationType): string {
    const templates: Record<NotificationType, string> = {
      TASK_ASSIGNED: process.env.MSG91_TEMPLATE_TASK_ASSIGNED || 'task_assigned',
      TASK_COMPLETED: process.env.MSG91_TEMPLATE_TASK_COMPLETED || 'task_completed',
      TASK_STARTED: 'task_started',
      TASK_RETURNED: 'task_returned',
      COMMENT_ADDED: 'comment_added',
      TASK_APPROVED: 'task_approved',
    };

    return templates[type];
  }

  private static extractTemplateParameters(event: NotificationEvent): string[] {
    // This will be specific to your templates
    // For now, return a generic parameter list
    return event.message.split('|').slice(1); // Remove type prefix
  }

  static async markAsRead(notificationId: string) {
    return prisma.notification.update({
      where: { id: notificationId },
      data: {
        read: true,
        readAt: new Date(),
      },
    });
  }

  static async getUserNotifications(userId: string, limit: number = 20) {
    return prisma.notification.findMany({
      where: { recipientId: userId },
      take: limit,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        task: true,
      },
    });
  }

  static async getUnreadCount(userId: string) {
    return prisma.notification.count({
      where: {
        recipientId: userId,
        read: false,
      },
    });
  }

  static async markAllAsRead(userId: string) {
    return prisma.notification.updateMany({
      where: {
        recipientId: userId,
        read: false,
      },
      data: {
        read: true,
        readAt: new Date(),
      },
    });
  }

  // Event emitters
  static async notifyTaskAssigned(task: any) {
    const recipient = task.assignee;
    
    const message = `You have been assigned task: "${task.title}"${
      task.dueDate ? ` due on ${new Date(task.dueDate).toLocaleDateString()}` : ''
    }`;

    await this.createNotification({
      type: 'TASK_ASSIGNED',
      recipientId: task.assigneeId,
      message,
      taskId: task.id,
      phone: recipient?.phone,
    });
  }

  static async notifyTaskStarted(task: any) {
    const recipient = task.creator;

    const message = `${task.assignee.name} has started task: "${task.title}"`;

    await this.createNotification({
      type: 'TASK_STARTED',
      recipientId: task.creatorId,
      message,
      taskId: task.id,
      phone: recipient?.phone,
    });
  }

  static async notifyTaskCompleted(task: any, totalTime: number) {
    const recipient = task.creator;
    const hours = Math.floor(totalTime / 3600);
    const minutes = Math.floor((totalTime % 3600) / 60);

    const message = `${task.assignee.name} has completed task: "${task.title}" (${hours}h ${minutes}m)`;

    await this.createNotification({
      type: 'TASK_COMPLETED',
      recipientId: task.creatorId,
      message,
      taskId: task.id,
      phone: recipient?.phone,
    });
  }

  static async notifyCommentAdded(comment: any, task: any) {
    const isAddedByManager = comment.author.role === 'MANAGER';
    const recipientId = isAddedByManager ? task.assigneeId : task.creatorId;

    const message = `New comment on "${task.title}": ${comment.content.substring(0, 50)}...`;

    await this.createNotification({
      type: 'COMMENT_ADDED',
      recipientId,
      message,
      taskId: task.id,
    });
  }

  static async notifyTaskReturned(task: any, reason: string) {
    const message = `Task "${task.title}" has been returned: ${reason.substring(0, 50)}...`;

    await this.createNotification({
      type: 'TASK_RETURNED',
      recipientId: task.assigneeId,
      message,
      taskId: task.id,
    });
  }

  static async notifyTaskApproved(task: any) {
    const message = `Task "${task.title}" has been approved!`;

    await this.createNotification({
      type: 'TASK_APPROVED',
      recipientId: task.assigneeId,
      message,
      taskId: task.id,
    });
  }
}
