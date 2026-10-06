import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service.js';
import * as argon2 from 'argon2';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, pass: string): Promise<any> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user || !user.active) {
      return null;
    }
    const isPasswordValid = await argon2.verify(user.passwordHash, pass);
    if (!isPasswordValid) {
      return null;
    }
    const { passwordHash, ...result } = user;
    return result;
  }

  async login(user: { id: string; email: string; role: string; name: string }) {
    const payload = { sub: user.id, email: user.email, role: user.role };
    const accessToken = this.jwtService.sign(payload, {
      expiresIn: (process.env.JWT_EXPIRES_IN || '15m') as any,
    });

    const family = crypto.randomUUID();
    const refreshTokenString = crypto.randomBytes(40).toString('hex');
    const tokenHash = await argon2.hash(refreshTokenString);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash,
        family,
        expiresAt,
      },
    });

    return {
      accessToken,
      refreshToken: `${family}.${refreshTokenString}`,
      user,
    };
  }

  async refreshTokens(rawRefreshToken: string) {
    if (!rawRefreshToken || !rawRefreshToken.includes('.')) {
      throw new UnauthorizedException('Invalid refresh token format');
    }
    const [family, tokenString] = rawRefreshToken.split('.');

    const storedTokens = await this.prisma.refreshToken.findMany({
      where: { family, revokedAt: null },
      include: { user: true },
    });

    if (storedTokens.length === 0) {
      await this.prisma.refreshToken.updateMany({
        where: { family },
        data: { revokedAt: new Date() },
      });
      throw new UnauthorizedException('Invalid or reused refresh token');
    }

    let validTokenRecord: any = null;
    for (const record of storedTokens) {
      const match = await argon2.verify(record.tokenHash, tokenString);
      if (match) {
        validTokenRecord = record;
        break;
      }
    }

    if (!validTokenRecord) {
      await this.prisma.refreshToken.updateMany({
        where: { family },
        data: { revokedAt: new Date() },
      });
      throw new UnauthorizedException('Refresh token reuse detected');
    }

    if (new Date() > validTokenRecord.expiresAt) {
      throw new UnauthorizedException('Refresh token expired');
    }

    await this.prisma.refreshToken.update({
      where: { id: validTokenRecord.id },
      data: { revokedAt: new Date() },
    });

    const user = validTokenRecord.user;
    if (!user.active) {
      throw new UnauthorizedException('User is inactive');
    }

    const payload = { sub: user.id, email: user.email, role: user.role };
    const accessToken = this.jwtService.sign(payload, {
      expiresIn: (process.env.JWT_EXPIRES_IN || '15m') as any,
    });

    const newRefreshTokenString = crypto.randomBytes(40).toString('hex');
    const newTokenHash = await argon2.hash(newRefreshTokenString);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: newTokenHash,
        family,
        expiresAt,
      },
    });

    const { passwordHash, ...userResult } = user;

    return {
      accessToken,
      refreshToken: `${family}.${newRefreshTokenString}`,
      user: userResult,
    };
  }

  async logout(rawRefreshToken: string) {
    if (!rawRefreshToken || !rawRefreshToken.includes('.')) {
      return { success: true };
    }
    const [family, tokenString] = rawRefreshToken.split('.');
    const storedTokens = await this.prisma.refreshToken.findMany({
      where: { family, revokedAt: null },
    });

    for (const record of storedTokens) {
      const match = await argon2.verify(record.tokenHash, tokenString);
      if (match) {
        await this.prisma.refreshToken.update({
          where: { id: record.id },
          data: { revokedAt: new Date() },
        });
        break;
      }
    }

    return { success: true };
  }

  async activateAccount(token: string, newPassword: string) {
    let validRecord: any = null;
    const allTokens = await this.prisma.activationToken.findMany({
      where: { usedAt: null, expiresAt: { gt: new Date() } },
    });

    for (const t of allTokens) {
      const match = await argon2.verify(t.tokenHash, token);
      if (match) {
        validRecord = t;
        break;
      }
    }

    if (!validRecord) {
      throw new BadRequestException('Invalid or expired activation token');
    }

    const passwordHash = await argon2.hash(newPassword);

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: validRecord.userId },
        data: { passwordHash, activatedAt: new Date(), active: true },
      }),
      this.prisma.activationToken.update({
        where: { id: validRecord.id },
        data: { usedAt: new Date() },
      }),
    ]);

    return { message: 'Account successfully activated' };
  }

  async requestPasswordReset(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      return { message: 'If email exists, reset instructions sent' };
    }

    const resetTokenString = crypto.randomBytes(32).toString('hex');
    const tokenHash = await argon2.hash(resetTokenString);
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1);

    await this.prisma.activationToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt,
      },
    });

    return {
      message: 'If email exists, reset instructions sent',
      debugToken: resetTokenString,
    };
  }

  async confirmPasswordReset(token: string, newPassword: string) {
    const allTokens = await this.prisma.activationToken.findMany({
      where: { usedAt: null, expiresAt: { gt: new Date() } },
    });

    let validRecord: any = null;
    for (const t of allTokens) {
      const match = await argon2.verify(t.tokenHash, token);
      if (match) {
        validRecord = t;
        break;
      }
    }

    if (!validRecord) {
      throw new BadRequestException('Invalid or expired password reset token');
    }

    const passwordHash = await argon2.hash(newPassword);

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: validRecord.userId },
        data: { passwordHash },
      }),
      this.prisma.activationToken.update({
        where: { id: validRecord.id },
        data: { usedAt: new Date() },
      }),
    ]);

    return { message: 'Password successfully reset' };
  }
}
