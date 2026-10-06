import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsArray,
} from 'class-validator';
import { Role, Category } from '@prisma/client';

export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEnum(Role)
  role: Role;

  @IsOptional()
  @IsString()
  roomNumber?: string;

  @IsOptional()
  @IsArray()
  @IsEnum(Category, { each: true })
  specializations?: Category[];
}
