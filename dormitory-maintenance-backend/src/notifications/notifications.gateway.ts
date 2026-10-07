import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service.js';

@WebSocketGateway({
  namespace: 'ws',
  cors: {
    origin: '*',
  },
})
export class NotificationsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server!: Server;

  constructor(
    private jwtService: JwtService,
    private prisma: PrismaService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token =
        client.handshake.auth?.token ||
        client.handshake.headers?.authorization?.replace('Bearer ', '');

      if (!token) {
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify(token);
      client.data.user = payload;

      const userId = payload.sub;
      const role = payload.role;

      // Join user-specific room
      await client.join(`user:${userId}`);
      // Join role-specific room
      await client.join(`role:${role}`);

      // If janitor, join specialization category rooms
      if (role === 'janitor') {
        const specs = await this.prisma.janitorSpecialization.findMany({
          where: { janitorId: userId },
        });
        for (const spec of specs) {
          await client.join(`category:${spec.category}`);
        }
      }
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(_client: Socket) {
    // Cleanup if necessary
  }

  sendToUser(userId: string, event: string, payload: any) {
    if (this.server) {
      this.server.to(`user:${userId}`).emit(event, payload);
    }
  }

  broadcastToCategory(category: string, event: string, payload: any) {
    if (this.server) {
      this.server.to(`category:${category}`).emit(event, payload);
    }
  }

  broadcastToRole(role: string, event: string, payload: any) {
    if (this.server) {
      this.server.to(`role:${role}`).emit(event, payload);
    }
  }
}
