import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class RequestPasswordResetDto {
  @IsEmail()
  email: string;
}

export class ConfirmPasswordResetDto {
  @IsString()
  @IsNotEmpty()
  token: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  newPassword: string;
}
