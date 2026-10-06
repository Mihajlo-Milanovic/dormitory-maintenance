import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { UpdateSupplyRequestDto } from './dto/update-supply-request.dto.js';
import { Role } from '@prisma/client';

@Injectable()
export class SuppliesService {
  constructor(private prisma: PrismaService) {}

  async findAll(user: { id: string; role: Role }) {
    if (user.role === Role.janitor) {
      return this.prisma.supplyRequest.findMany({
        where: { janitorId: user.id },
        include: { job: { include: { report: true } } },
        orderBy: { createdAt: 'desc' },
      });
    }

    if (user.role === Role.administrator) {
      return this.prisma.supplyRequest.findMany({
        include: {
          janitor: { select: { id: true, name: true, email: true } },
          job: { include: { report: true } },
        },
        orderBy: { createdAt: 'desc' },
      });
    }

    throw new ForbiddenException('Unauthorized to view supply requests');
  }

  async update(adminId: string, id: string, dto: UpdateSupplyRequestDto) {
    const supplyRequest = await this.prisma.supplyRequest.findUnique({
      where: { id },
    });

    if (!supplyRequest) {
      throw new NotFoundException(`Supply request with ID ${id} not found`);
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const u = await tx.supplyRequest.update({
        where: { id },
        data: {
          status: dto.status,
          arrivalAt: dto.arrivalAt ? new Date(dto.arrivalAt) : undefined,
        },
        include: { job: { include: { report: true } }, janitor: true },
      });

      await tx.auditLog.create({
        data: {
          actorId: adminId,
          action: 'UPDATE_SUPPLY_REQUEST',
          newValue: JSON.stringify(dto),
        },
      });

      return u;
    });

    return updated;
  }
}
