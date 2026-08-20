import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class UpdateSalaryDto {
  @IsOptional()
  @IsInt()
  @Min(0)
  baseSalary?: number;

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
