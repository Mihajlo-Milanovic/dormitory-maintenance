import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsArray,
} from 'class-validator';
import { Category, Severity } from '@prisma/client';

export class CreateReportDto {
  @IsEnum(Category)
  category: Category;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsString()
  @IsNotEmpty()
  location: string;

  @IsEnum(Severity)
  severity: Severity;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  attachments?: string[];
}
