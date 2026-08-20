import { IsInt, IsOptional, IsString, Min, MinLength } from 'class-validator';

export class CreateItemDto {
  @IsString()
  @MinLength(1)
  sku: string;

  @IsString()
  @MinLength(1)
  name: string;

  @IsString()
  unit: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  price?: number;
}
