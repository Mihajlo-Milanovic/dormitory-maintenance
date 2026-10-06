import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { ReportStatus } from '@prisma/client';

export class UpdateJobDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  estimateMinutes?: number;

  @IsOptional()
  @IsEnum(ReportStatus)
  status?: ReportStatus;

  @IsOptional()
  @IsString()
  comment?: string;
}
