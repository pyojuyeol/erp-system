import { IsDateString, IsEnum, IsOptional, IsString } from 'class-validator';

export enum LeaveTypeDto {
  ANNUAL = 'ANNUAL',
  HALF_DAY = 'HALF_DAY',
  SICK = 'SICK',
  OTHER = 'OTHER',
}

export class CreateLeaveDto {
  @IsEnum(LeaveTypeDto)
  type: LeaveTypeDto;

  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;

  @IsOptional()
  @IsString()
  reason?: string;
}
