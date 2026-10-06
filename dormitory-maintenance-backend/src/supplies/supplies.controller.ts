import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { SuppliesService } from './supplies.service.js';
import { UpdateSupplyRequestDto } from './dto/update-supply-request.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { Role } from '@prisma/client';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('api/v1/supplies')
export class SuppliesController {
  constructor(private readonly suppliesService: SuppliesService) {}

  @Get()
  @Roles(Role.janitor, Role.administrator)
  findAll(@CurrentUser() user: any) {
    return this.suppliesService.findAll(user);
  }

  @Patch(':id')
  @Roles(Role.administrator)
  update(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: UpdateSupplyRequestDto,
  ) {
    return this.suppliesService.update(user.id, id, dto);
  }
}
