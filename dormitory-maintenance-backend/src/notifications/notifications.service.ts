import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { NotificationsGateway } from './notifications.gateway.js';

@Injectable()
export class NotificationsService {
  constructor(
    private prisma: PrismaService,
    private gateway: NotificationsGateway,
  ) {}

  async findAll(userId: string) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async markAsRead(userId: string, id: string) {
    const notification = await this.prisma.notification.findUnique({
      where: { id },
    });

    if (!notification || notification.userId !== userId) {
      throw new NotFoundException(`Notification with ID ${id} not found`);
    }

    return this.prisma.notification.update({
      where: { id },
      data: { readAt: new Date() },
    });
  }

  async createAndSend(userId: string, type: string, payload: any) {
    const notification = await this.prisma.notification.create({
      data: {
        userId,
        type,
        payload,
      },
    });

    this.gateway.sendToUser(userId, type, notification);
    return notification;
  }

  async broadcastToCategory(category: string, event: string, payload: any) {
    this.gateway.broadcastToCategory(category, event, payload);
  }

  async broadcastToRole(role: string, event: string, payload: any) {
    this.gateway.broadcastToRole(role, event, payload);
  }
}
