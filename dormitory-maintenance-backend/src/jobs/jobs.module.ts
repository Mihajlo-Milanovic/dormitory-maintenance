import { Module } from '@nestjs/common';
import { JobsService } from './jobs.service.js';
import { JobsController } from './jobs.controller.js';
import { NotificationsModule } from '../notifications/notifications.module.js';

@Module({
  imports: [NotificationsModule],
  controllers: [JobsController],
  providers: [JobsService],
  exports: [JobsService],
})
export class JobsModule {}
