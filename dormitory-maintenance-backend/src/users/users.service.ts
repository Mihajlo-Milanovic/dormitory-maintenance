import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateUserDto } from './dto/create-user.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
import { Role, Category } from '@prisma/client';
import * as argon2 from 'argon2';
import * as crypto from 'crypto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findAll(role?: Role) {
    return this.prisma.user.findMany({
      where: role ? { role } : undefined,
      include: { specializations: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: { specializations: true },
    });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  async create(actorId: string, dto: CreateUserDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) {
      throw new BadRequestException('User with this email already exists');
    }

    const tempPassword = crypto.randomBytes(16).toString('hex');
    const passwordHash = await argon2.hash(tempPassword);

    const user = await this.prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          name: dto.name,
          email: dto.email,
          passwordHash,
          role: dto.role,
          roomNumber: dto.roomNumber,
          active: false, // inactive until activated
        },
      });

      if (dto.role === Role.janitor && dto.specializations?.length) {
        await tx.janitorSpecialization.createMany({
          data: dto.specializations.map((category) => ({
            janitorId: newUser.id,
            category,
          })),
        });
      }

      await tx.auditLog.create({
        data: {
          actorId,
          action: 'CREATE_USER',
          targetUserId: newUser.id,
          newValue: JSON.stringify({ email: newUser.email, role: newUser.role }),
        },
      });

      return newUser;
    });

    return this.findOne(user.id);
  }

  async update(actorId: string, id: string, dto: UpdateUserDto) {
    const oldUser = await this.findOne(id);

    const updatedUser = await this.prisma.$transaction(async (tx) => {
      const u = await tx.user.update({
        where: { id },
        data: {
          role: dto.role,
          active: dto.active,
          roomNumber: dto.roomNumber,
        },
      });

      if (dto.specializations && u.role === Role.janitor) {
        await tx.janitorSpecialization.deleteMany({
          where: { janitorId: id },
        });
        if (dto.specializations.length > 0) {
          await tx.janitorSpecialization.createMany({
            data: dto.specializations.map((category) => ({
              janitorId: id,
              category,
            })),
          });
        }
      }

      await tx.auditLog.create({
        data: {
          actorId,
          action: 'UPDATE_USER',
          targetUserId: id,
          oldValue: JSON.stringify({
            role: oldUser.role,
            active: oldUser.active,
            roomNumber: oldUser.roomNumber,
          }),
          newValue: JSON.stringify(dto),
        },
      });

      return u;
    });

    return this.findOne(updatedUser.id);
  }

  async invite(actorId: string, id: string) {
    const user = await this.findOne(id);
    const tokenString = crypto.randomBytes(32).toString('hex');
    const tokenHash = await argon2.hash(tokenString);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 3); // 3 days expiry

    await this.prisma.activationToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        actorId,
        action: 'INVITE_USER',
        targetUserId: user.id,
      },
    });

    return {
      message: 'Invitation generated successfully',
      debugActivationToken: tokenString,
      user: { id: user.id, email: user.email },
    };
  }

  async importCsv(actorId: string, csvData: string) {
    const lines = csvData
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (lines.length < 2) {
      throw new BadRequestException('CSV data must contain a header and at least one row');
    }

    const header = lines[0].toLowerCase().split(',').map((h) => h.trim());
    const nameIdx = header.indexOf('name');
    const emailIdx = header.indexOf('email');
    const roleIdx = header.indexOf('role');
    const roomIdx = header.indexOf('roomnumber');
    const specsIdx = header.indexOf('specializations');

    if (nameIdx === -1 || emailIdx === -1 || roleIdx === -1) {
      throw new BadRequestException('CSV header must include name, email, and role');
    }

    const results = { imported: 0, errors: [] as string[] };

    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(',').map((c) => c.trim());
      const name = cols[nameIdx];
      const email = cols[emailIdx];
      const roleStr = cols[roleIdx]?.toLowerCase();
      const roomNumber = roomIdx !== -1 ? cols[roomIdx] : undefined;
      const specsStr = specsIdx !== -1 ? cols[specsIdx] : undefined;

      if (!email || !name || !roleStr || !(roleStr in Role)) {
        results.errors.push(`Row ${i + 1}: Invalid data or role`);
        continue;
      }

      const role = roleStr as Role;
      const specializations: Category[] = specsStr
        ? (specsStr.split(';').map((s) => s.trim()) as Category[])
        : [];

      try {
        await this.create(actorId, {
          name,
          email,
          role,
          roomNumber,
          specializations,
        });
        results.imported++;
      } catch (err: any) {
        results.errors.push(`Row ${i + 1} (${email}): ${err.message}`);
      }
    }

    return results;
  }
}
