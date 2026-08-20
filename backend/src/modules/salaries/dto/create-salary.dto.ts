import { IsInt, IsOptional, IsString, IsUUID, Matches, Min } from 'class-validator';

export class CreateSalaryDto {
  @IsUUID()
  employeeId: string;

  @IsString()
  @Matches(/^\d{4}-\d{2}$/, { message: 'payMonth는 YYYY-MM 형식이어야 합니다.' })
  payMonth: string;

  @IsInt()
  @Min(0)
  baseSalary: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  allowance?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  deduction?: number;

  @IsOptional()
  @IsString()
  memo?: string;
}
