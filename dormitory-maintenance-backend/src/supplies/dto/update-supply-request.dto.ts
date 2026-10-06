import { IsEnum, IsOptional, IsISO8601 } from 'class-validator';
import { SupplyStatus } from '@prisma/client';

export class UpdateSupplyRequestDto {
  @IsOptional()
  @IsEnum(SupplyStatus)
  status?: SupplyStatus;

  @IsOptional()
  @IsISO8601()
  arrivalAt?: string;
}
