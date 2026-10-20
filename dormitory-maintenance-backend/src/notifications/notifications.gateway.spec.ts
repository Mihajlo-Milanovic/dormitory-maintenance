import { describe, expect, it, vi } from 'vitest';
import { JwtService } from '@nestjs/jwt';
import type { Socket } from 'socket.io';
import { NotificationsGateway } from './notifications.gateway.js';
import { PrismaService } from '../prisma/prisma.service.js';

describe('NotificationsGateway authentication', () => {
  it.each([undefined, 'expired'])('signals authentication rejection for token %s before disconnecting', async (token) => {
    const jwt = { verify: vi.fn(() => { throw new Error('invalid token'); }) };
    const gateway = new NotificationsGateway(jwt as unknown as JwtService, {} as PrismaService);
    const client = {
      handshake: { auth: { token }, headers: {} },
      emit: vi.fn(), disconnect: vi.fn(), join: vi.fn(),
    };
    await gateway.handleConnection(client as unknown as Socket);
    expect(client.emit).toHaveBeenCalledWith('auth.rejected');
    expect(client.disconnect).toHaveBeenCalledOnce();
    expect(client.emit.mock.invocationCallOrder[0]).toBeLessThan(client.disconnect.mock.invocationCallOrder[0]);
    expect(client.join).not.toHaveBeenCalled();
  });
});
