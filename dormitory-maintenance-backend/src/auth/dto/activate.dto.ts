import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class ActivateDto {
  @IsString()
  @IsNotEmpty()
  token: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;
}
