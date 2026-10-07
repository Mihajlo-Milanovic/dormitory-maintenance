import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { NotificationsService } from '../notifications/notifications.service.js';
import { CreateReportDto } from './dto/create-report.dto.js';
import { UpdateReportDto } from './dto/update-report.dto.js';
import { ReassignReportDto } from './dto/reassign-report.dto.js';
import { Role, ReportStatus, EventType } from '@prisma/client';

@Injectable()
export class ReportsService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
  ) {}

  async create(studentId: string, dto: CreateReportDto) {
    const report = await this.prisma.$transaction(async (tx) => {
      const newReport = await tx.report.create({
        data: {
          studentId,
          category: dto.category,
          title: dto.title,
          description: dto.description,
          location: dto.location,
          severity: dto.severity,
          status: ReportStatus.Waiting,
          attachments: dto.attachments?.length
            ? {
                create: dto.attachments.map((url) => ({ url })),
              }
            : undefined,
        },
        include: { attachments: true },
      });

      await tx.reportEvent.create({
        data: {
          reportId: newReport.id,
          actorId: studentId,
          eventType: EventType.status_change,
          toStatus: ReportStatus.Waiting,
          comment: 'Report created',
        },
      });

      return newReport;
    });

    const fullReport = await this.findOne({ id: studentId, role: Role.student }, report.id);
    void this.notifications.broadcastToCategory(dto.category, 'report.created', fullReport);
    void this.notifications.broadcastToRole('administrator', 'report.created', fullReport);

    return fullReport;
  }

  async findAll(user: { id: string; role: Role }) {
    if (user.role === Role.student) {
      return this.prisma.report.findMany({
        where: { studentId: user.id },
        include: { attachments: true, jobs: { include: { janitor: true } } },
        orderBy: { createdAt: 'desc' },
      });
    }

    if (user.role === Role.janitor) {
      const janitorSpecs = await this.prisma.janitorSpecialization.findMany({
        where: { janitorId: user.id },
      });
      const categories = janitorSpecs.map((s) => s.category);

      return this.prisma.report.findMany({
        where: {
          OR: [
            { status: ReportStatus.Waiting, category: { in: categories } },
            { jobs: { some: { janitorId: user.id } } },
          ],
        },
        include: { attachments: true, jobs: { include: { janitor: true } } },
        orderBy: { createdAt: 'desc' },
      });
    }

    return this.prisma.report.findMany({
      include: { attachments: true, jobs: { include: { janitor: true } }, student: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(user: { id: string; role: Role }, id: string) {
    const report = await this.prisma.report.findUnique({
      where: { id },
      include: {
        student: { select: { id: true, name: true, email: true, roomNumber: true } },
        attachments: true,
        jobs: { include: { janitor: { select: { id: true, name: true, email: true } }, supplyRequests: true } },
        events: { include: { actor: { select: { id: true, name: true, role: true } } }, orderBy: { at: 'asc' } },
      },
    });

    if (!report) {
      throw new NotFoundException(`Report with ID ${id} not found`);
    }

    if (user.role === Role.student && report.studentId !== user.id) {
      throw new ForbiddenException('Access denied to this report');
    }

    return report;
  }

  async update(user: { id: string; role: Role }, id: string, dto: UpdateReportDto) {
    const report = await this.findOne(user, id);

    if (user.role === Role.student) {
      if (report.status !== ReportStatus.Waiting) {
        throw new BadRequestException('Cannot edit report after it has been accepted or processed');
      }
      const updated = await this.prisma.report.update({
        where: { id },
        data: {
          category: dto.category,
          title: dto.title,
          description: dto.description,
          location: dto.location,
        },
        include: { attachments: true },
      });
      void this.notifications.broadcastToRole('administrator', 'report.updated', updated);
      return updated;
    }

    if (user.role === Role.administrator) {
      const updated = await this.prisma.$transaction(async (tx) => {
        const updateData: any = {};
        let eventData: any = null;

        if (dto.severity && dto.severity !== report.severity) {
          updateData.severity = dto.severity;
          eventData = {
            reportId: id,
            actorId: user.id,
            eventType: EventType.severity_change,
            fromSeverity: report.severity,
            toSeverity: dto.severity,
            comment: dto.comment || 'Severity adjusted by administrator',
          };
        }

        if (dto.status && dto.status !== report.status) {
          updateData.status = dto.status;
          eventData = {
            reportId: id,
            actorId: user.id,
            eventType: EventType.status_change,
            fromStatus: report.status,
            toStatus: dto.status,
            comment: dto.comment || 'Status adjusted by administrator',
          };
        }

        const up = await tx.report.update({
          where: { id },
          data: updateData,
          include: { attachments: true, jobs: true },
        });

        if (eventData) {
          await tx.reportEvent.create({ data: eventData });
        }

        return up;
      });

      void this.notifications.createAndSend(report.studentId, 'report.updated', updated);
      void this.notifications.broadcastToRole('administrator', 'report.updated', updated);
      return updated;
    }

    throw new ForbiddenException('Unauthorized to update report');
  }

  async cancel(studentId: string, id: string) {
    const report = await this.findOne({ id: studentId, role: Role.student }, id);
    if (report.status !== ReportStatus.Waiting) {
      throw new BadRequestException('Can only cancel reports that are waiting');
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const up = await tx.report.update({
        where: { id },
        data: { status: ReportStatus.Cancelled },
      });

      await tx.reportEvent.create({
        data: {
          reportId: id,
          actorId: studentId,
          eventType: EventType.status_change,
          fromStatus: ReportStatus.Waiting,
          toStatus: ReportStatus.Cancelled,
          comment: 'Report cancelled by student',
        },
      });

      return up;
    });

    void this.notifications.broadcastToRole('administrator', 'report.updated', updated);
    return updated;
  }

  async reassign(adminId: string, reportId: string, dto: ReassignReportDto) {
    const report = await this.prisma.report.findUnique({
      where: { id: reportId },
      include: { jobs: { where: { finishedAt: null } } },
    });

    if (!report) {
      throw new NotFoundException(`Report with ID ${reportId} not found`);
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      await tx.job.updateMany({
        where: { reportId, finishedAt: null },
        data: { finishedAt: new Date() },
      });

      let newStatus: ReportStatus = ReportStatus.Waiting;
      let comment = dto.comment || 'Report reassigned by administrator';

      if (dto.newJanitorId) {
        const janitor = await tx.user.findUnique({
          where: { id: dto.newJanitorId, role: Role.janitor },
        });
        if (!janitor || !janitor.active) {
          throw new BadRequestException('Invalid or inactive janitor ID');
        }

        await tx.job.create({
          data: {
            reportId,
            janitorId: dto.newJanitorId,
            startedAt: new Date(),
          },
        });
        newStatus = ReportStatus.Accepted;
        comment = `Report reassigned to janitor ${janitor.name}`;
      }

      const up = await tx.report.update({
        where: { id: reportId },
        data: { status: newStatus },
        include: { jobs: { include: { janitor: true } } },
      });

      await tx.reportEvent.create({
        data: {
          reportId,
          actorId: adminId,
          eventType: EventType.status_change,
          fromStatus: report.status,
          toStatus: newStatus,
          comment,
        },
      });

      await tx.auditLog.create({
        data: {
          actorId: adminId,
          action: 'REASSIGN_REPORT',
          targetUserId: dto.newJanitorId,
          newValue: JSON.stringify({ reportId, newStatus, newJanitorId: dto.newJanitorId }),
        },
      });

      return up;
    });

    void this.notifications.createAndSend(report.studentId, 'report.updated', updated);
    void this.notifications.broadcastToRole('administrator', 'job.reassigned', updated);
    if (dto.newJanitorId) {
      void this.notifications.createAndSend(dto.newJanitorId, 'job.reassigned', updated);
    }

    return updated;
  }

  async acceptJob(janitorId: string, reportId: string) {
    const activeJob = await this.prisma.job.findFirst({
      where: { janitorId, finishedAt: null },
    });

    if (activeJob) {
      throw new ConflictException('Janitor already has an active job. Complete or pause current job first.');
    }

    const job = await this.prisma.$transaction(async (tx) => {
      const report = await tx.report.findUnique({ where: { id: reportId } });
      if (!report) {
        throw new NotFoundException(`Report with ID ${reportId} not found`);
      }
      if (report.status !== ReportStatus.Waiting) {
        throw new BadRequestException('Report is no longer waiting for acceptance');
      }

      const j = await tx.job.create({
        data: {
          reportId,
          janitorId,
          startedAt: new Date(),
        },
      });

      await tx.report.update({
        where: { id: reportId },
        data: { status: ReportStatus.Accepted },
      });

      await tx.reportEvent.create({
        data: {
          reportId,
          actorId: janitorId,
          eventType: EventType.status_change,
          fromStatus: ReportStatus.Waiting,
          toStatus: ReportStatus.Accepted,
          comment: 'Job accepted by janitor',
        },
      });

      return j;
    });

    void this.notifications.broadcastToRole('administrator', 'report.updated', job);
    return job;
  }
}
