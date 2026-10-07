import { Module } from '@nestjs/common';
import { SuppliesService } from './supplies.service.js';
import { SuppliesController } from './supplies.controller.js';
import { NotificationsModule } from '../notifications/notifications.module.js';

@Module({
  imports: [NotificationsModule],
  controllers: [SuppliesController],
  providers: [SuppliesService],
  exports: [SuppliesService],
})
export class SuppliesModule {}
