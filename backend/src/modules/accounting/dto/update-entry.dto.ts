import { IsInt, IsOptional, IsString, Min, MinLength } from 'class-validator';

export class UpdateEntryDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  category?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  amount?: number;

  @IsOptional()
  @IsString()
  memo?: string;
}
