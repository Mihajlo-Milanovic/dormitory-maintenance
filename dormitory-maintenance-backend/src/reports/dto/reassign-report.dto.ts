import { IsOptional, IsString } from 'class-validator';

export class ReassignReportDto {
  @IsOptional()
  @IsString()
  newJanitorId?: string;

  @IsOptional()
  @IsString()
  comment?: string;
}
