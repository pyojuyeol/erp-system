import { IsDateString, IsEmail, IsString, IsUUID, MinLength } from 'class-validator';

export class CreateEmployeeDto {
  @IsString()
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsUUID()
  departmentId: string;

  @IsString()
  position: string;

  @IsDateString()
  hireDate: string;
}
