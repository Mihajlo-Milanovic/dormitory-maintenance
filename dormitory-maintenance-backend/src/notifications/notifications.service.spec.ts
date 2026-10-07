import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsService } from './notifications.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { NotificationsGateway } from './notifications.gateway.js';
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('NotificationsService', () => {
  let service: NotificationsService;
  let gateway: NotificationsGateway;

  const mockPrismaService = {
    notification: {
      findMany: vi.fn().mockResolvedValue([{ id: 'notif-1', userId: 'user-1', type: 'report.created' }]),
      findUnique: vi.fn().mockResolvedValue({ id: 'notif-1', userId: 'user-1', type: 'report.created' }),
      update: vi.fn().mockResolvedValue({ id: 'notif-1', readAt: new Date() }),
      create: vi.fn().mockResolvedValue({ id: 'notif-1', userId: 'user-1', type: 'report.created' }),
    },
  };

  const mockGateway = {
    sendToUser: vi.fn(),
    broadcastToCategory: vi.fn(),
    broadcastToRole: vi.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: NotificationsGateway, useValue: mockGateway },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
    gateway = module.get<NotificationsGateway>(NotificationsGateway);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should find all notifications for a user', async () => {
    const results = await service.findAll('user-1');
    expect(results).toHaveLength(1);
    expect(results[0].id).toBe('notif-1');
  });

  it('should mark notification as read', async () => {
    const result = await service.markAsRead('user-1', 'notif-1');
    expect(result).toHaveProperty('readAt');
  });

  it('should create and send notification', async () => {
    const result = await service.createAndSend('user-1', 'report.created', { id: 'rep-1' });
    expect(result).toBeDefined();
    expect(gateway.sendToUser).toHaveBeenCalledWith('user-1', 'report.created', result);
  });
});
