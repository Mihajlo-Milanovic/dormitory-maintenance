import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { NotificationsService } from '../notifications/notifications.service.js';
import { UpdateJobDto } from './dto/update-job.dto.js';
import { CreateSupplyRequestDto } from './dto/create-supply-request.dto.js';
import { ReportStatus, EventType } from '@prisma/client';

@Injectable()
export class JobsService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
  ) {}

  async update(janitorId: string, jobId: string, dto: UpdateJobDto) {
    const job = await this.prisma.job.findUnique({
      where: { id: jobId },
      include: { report: true },
    });

    if (!job) {
      throw new NotFoundException(`Job with ID ${jobId} not found`);
    }

    if (job.janitorId !== janitorId) {
      throw new ForbiddenException('Job is not assigned to this janitor');
    }

    const updatedJob = await this.prisma.$transaction(async (tx) => {
      const updateData: any = {};
      if (dto.estimateMinutes !== undefined) {
        updateData.estimateMinutes = dto.estimateMinutes;
      }

      if (dto.status && dto.status !== job.report.status) {
        if (
          dto.status !== ReportStatus.Repair_in_progress &&
          dto.status !== ReportStatus.Finished &&
          dto.status !== ReportStatus.Accepted
        ) {
          throw new BadRequestException('Invalid status transition for job');
        }

        await tx.report.update({
          where: { id: job.reportId },
          data: { status: dto.status },
        });

        if (dto.status === ReportStatus.Finished) {
          updateData.finishedAt = new Date();
        }

        await tx.reportEvent.create({
          data: {
            reportId: job.reportId,
            actorId: janitorId,
            eventType: EventType.status_change,
            fromStatus: job.report.status,
            toStatus: dto.status,
            comment: dto.comment || `Job status updated to ${dto.status}`,
          },
        });
      }

      const up = await tx.job.update({
        where: { id: jobId },
        data: updateData,
        include: { report: { include: { attachments: true } }, supplyRequests: true },
      });

      return up;
    });

    void this.notifications.broadcastToRole('administrator', 'report.updated', updatedJob);
    void this.notifications.createAndSend(job.report.studentId, 'report.updated', updatedJob);

    return updatedJob;
  }

  async createSupplyRequest(
    janitorId: string,
    jobId: string,
    dto: CreateSupplyRequestDto,
  ) {
    const job = await this.prisma.job.findUnique({
      where: { id: jobId },
      include: { report: true },
    });

    if (!job) {
      throw new NotFoundException(`Job with ID ${jobId} not found`);
    }

    if (job.janitorId !== janitorId) {
      throw new ForbiddenException('Job is not assigned to this janitor');
    }

    const supplyRequest = await this.prisma.$transaction(async (tx) => {
      const sr = await tx.supplyRequest.create({
        data: {
          jobId,
          janitorId,
          item: dto.item,
          quantity: dto.quantity,
          justification: dto.justification,
        },
      });

      await tx.report.update({
        where: { id: job.reportId },
        data: { status: ReportStatus.Waiting_for_supplies },
      });

      await tx.reportEvent.create({
        data: {
          reportId: job.reportId,
          actorId: janitorId,
          eventType: EventType.status_change,
          fromStatus: job.report.status,
          toStatus: ReportStatus.Waiting_for_supplies,
          comment: `Supply requested: ${dto.item} (x${dto.quantity})`,
        },
      });

      return sr;
    });

    void this.notifications.broadcastToRole('administrator', 'supply.updated', supplyRequest);
    void this.notifications.createAndSend(janitorId, 'supply.updated', supplyRequest);

    return supplyRequest;
  }
}
