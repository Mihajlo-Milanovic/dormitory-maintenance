import { Module } from '@nestjs/common';
import { SuppliesService } from './supplies.service.js';
import { SuppliesController } from './supplies.controller.js';

@Module({
  controllers: [SuppliesController],
  providers: [SuppliesService],
  exports: [SuppliesService],
})
export class SuppliesModule {}
