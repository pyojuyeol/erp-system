import { IsDateString, IsEnum, IsInt, IsOptional, IsString, Min, MinLength } from 'class-validator';

export enum EntryTypeDto {
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE',
}

export class CreateEntryDto {
  @IsEnum(EntryTypeDto)
  type: EntryTypeDto;

  @IsString()
  @MinLength(1)
  category: string;

  @IsInt()
  @Min(1)
  amount: number;

  @IsDateString()
  entryDate: string;

  @IsOptional()
  @IsString()
  memo?: string;
}
