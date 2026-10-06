import { IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

export class CreateSupplyRequestDto {
  @IsString()
  @IsNotEmpty()
  item: string;

  @IsInt()
  @Min(1)
  quantity: number;

  @IsOptional()
  @IsString()
  justification?: string;
}
