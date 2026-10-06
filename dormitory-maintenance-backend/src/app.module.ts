import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { AuthModule } from './auth/auth.module.js';
import { UsersModule } from './users/users.module.js';
import { ReportsModule } from './reports/reports.module.js';
import { JobsModule } from './jobs/jobs.module.js';
import { SuppliesModule } from './supplies/supplies.module.js';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    UsersModule,
    ReportsModule,
    JobsModule,
    SuppliesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
