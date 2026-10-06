import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { UsersService } from './users.service.js';
import { CreateUserDto } from './dto/create-user.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
import { ImportUsersDto } from './dto/import-users.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { Role } from '@prisma/client';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.administrator)
@Controller('api/v1/users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  findAll(@Query('role') role?: Role) {
    return this.usersService.findAll(role);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@CurrentUser() currentUser: any, @Body() dto: CreateUserDto) {
    return this.usersService.create(currentUser.id, dto);
  }

  @Post('import')
  @HttpCode(HttpStatus.OK)
  importCsv(@CurrentUser() currentUser: any, @Body() dto: ImportUsersDto) {
    return this.usersService.importCsv(currentUser.id, dto.csvData);
  }

  @Patch(':id')
  update(
    @CurrentUser() currentUser: any,
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
  ) {
    return this.usersService.update(currentUser.id, id, dto);
  }

  @Post(':id/invite')
  @HttpCode(HttpStatus.OK)
  invite(@CurrentUser() currentUser: any, @Param('id') id: string) {
    return this.usersService.invite(currentUser.id, id);
  }
}
