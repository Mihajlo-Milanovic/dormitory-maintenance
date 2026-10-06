import {
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  IsArray,
} from 'class-validator';
import { Role, Category } from '@prisma/client';

export class UpdateUserDto {
  @IsOptional()
  @IsEnum(Role)
  role?: Role;

  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @IsOptional()
  @IsString()
  roomNumber?: string;

  @IsOptional()
  @IsArray()
  @IsEnum(Category, { each: true })
  specializations?: Category[];
}
