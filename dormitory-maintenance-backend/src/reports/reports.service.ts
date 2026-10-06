import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateReportDto } from './dto/create-report.dto.js';
import { UpdateReportDto } from './dto/update-report.dto.js';
import { ReassignReportDto } from './dto/reassign-report.dto.js';
import { Role, ReportStatus, EventType, Severity } from '@prisma/client';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

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

    return this.findOne({ id: studentId, role: Role.student }, report.id);
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
      // Janitor sees reports matching their specializations or jobs assigned to them
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

    // Administrator sees all reports
    return this.prisma.report.findMany({
      include: { attachments: true, jobs: { include: { janitor: true }, }, student: true },
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
      return this.prisma.report.update({
        where: { id },
        data: {
          category: dto.category,
          title: dto.title,
          description: dto.description,
          location: dto.location,
        },
        include: { attachments: true },
      });
    }

    if (user.role === Role.administrator) {
      return this.prisma.$transaction(async (tx) => {
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

        const updated = await tx.report.update({
          where: { id },
          data: updateData,
          include: { attachments: true, jobs: true },
        });

        if (eventData) {
          await tx.reportEvent.create({ data: eventData });
        }

        return updated;
      });
    }

    throw new ForbiddenException('Unauthorized to update report');
  }

  async cancel(studentId: string, id: string) {
    const report = await this.findOne({ id: studentId, role: Role.student }, id);
    if (report.status !== ReportStatus.Waiting) {
      throw new BadRequestException('Can only cancel reports that are waiting');
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.report.update({
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

      return updated;
    });
  }

  async reassign(adminId: string, reportId: string, dto: ReassignReportDto) {
    const report = await this.prisma.report.findUnique({
      where: { id: reportId },
      include: { jobs: { where: { finishedAt: null } } },
    });

    if (!report) {
      throw new NotFoundException(`Report with ID ${reportId} not found`);
    }

    return this.prisma.$transaction(async (tx) => {
      // Close any active jobs for this report
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

      const updated = await tx.report.update({
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

      return updated;
    });
  }

  async acceptJob(janitorId: string, reportId: string) {
    // Check if janitor already has an active job (finishedAt is null)
    const activeJob = await this.prisma.job.findFirst({
      where: { janitorId, finishedAt: null },
    });

    if (activeJob) {
      throw new ConflictException('Janitor already has an active job. Complete or pause current job first.');
    }

    return this.prisma.$transaction(async (tx) => {
      const report = await tx.report.findUnique({ where: { id: reportId } });
      if (!report) {
        throw new NotFoundException(`Report with ID ${reportId} not found`);
      }
      if (report.status !== ReportStatus.Waiting) {
        throw new BadRequestException('Report is no longer waiting for acceptance');
      }

      const job = await tx.job.create({
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

      return job;
    });
  }
}
