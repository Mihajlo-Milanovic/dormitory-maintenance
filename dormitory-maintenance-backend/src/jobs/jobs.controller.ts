import {
  Controller,
  Patch,
  Post,
  Param,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JobsService } from './jobs.service.js';
import { UpdateJobDto } from './dto/update-job.dto.js';
import { CreateSupplyRequestDto } from './dto/create-supply-request.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { Role } from '@prisma/client';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.janitor)
@Controller('api/v1/jobs')
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  @Patch(':id')
  update(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: UpdateJobDto,
  ) {
    return this.jobsService.update(user.id, id, dto);
  }

  @Post(':id/supply-requests')
  @HttpCode(HttpStatus.CREATED)
  createSupplyRequest(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: CreateSupplyRequestDto,
  ) {
    return this.jobsService.createSupplyRequest(user.id, id, dto);
  }
}
