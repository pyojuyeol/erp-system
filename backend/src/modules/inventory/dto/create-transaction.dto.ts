import { IsEnum, IsInt, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export enum TransactionTypeDto {
  IN = 'IN',
  OUT = 'OUT',
}

export class CreateTransactionDto {
  @IsUUID()
  itemId: string;

  @IsEnum(TransactionTypeDto)
  type: TransactionTypeDto;

  @IsInt()
  @Min(1)
  quantity: number;

  @IsOptional()
  @IsString()
  memo?: string;
}
