import { IsNotEmpty, IsString } from 'class-validator';

export class ImportUsersDto {
  @IsString()
  @IsNotEmpty()
  csvData: string; // CSV format: name,email,role,roomNumber,specializations (comma separated categories)
}
