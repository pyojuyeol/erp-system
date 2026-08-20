import { Controller, Get, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AttendanceService } from './attendance.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Attendance')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('attendance')
export class AttendanceController {
  constructor(private attendanceService: AttendanceService) {}

  @Post('check-in')
  checkIn(@Req() req: any) {
    return this.attendanceService.checkIn(req.user.userId);
  }

  @Post('check-out')
  checkOut(@Req() req: any) {
    return this.attendanceService.checkOut(req.user.userId);
  }

  @Get('me')
  findMine(@Req() req: any, @Query('month') month?: string) {
    return this.attendanceService.findMine(req.user.userId, month);
  }

  @Get()
  @Roles('ADMIN', 'MANAGER')
  findAll(@Query('month') month?: string) {
    return this.attendanceService.findAll(month);
  }
}
