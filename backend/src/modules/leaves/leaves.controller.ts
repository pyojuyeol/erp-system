import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { LeavesService } from './leaves.service';
import { CreateLeaveDto } from './dto/create-leave.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Leaves')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('leaves')
export class LeavesController {
  constructor(private leavesService: LeavesService) {}

  @Post()
  create(@Req() req: any, @Body() dto: CreateLeaveDto) {
    return this.leavesService.create(req.user.userId, dto);
  }

  @Get('me')
  findMine(@Req() req: any) {
    return this.leavesService.findMine(req.user.userId);
  }

  @Get()
  @Roles('ADMIN', 'MANAGER')
  findAll(@Query('status') status?: string) {
    return this.leavesService.findAll(status);
  }

  @Patch(':id/approve')
  @Roles('ADMIN', 'MANAGER')
  approve(@Param('id') id: string) {
    return this.leavesService.approve(id);
  }

  @Patch(':id/reject')
  @Roles('ADMIN', 'MANAGER')
  reject(@Param('id') id: string) {
    return this.leavesService.reject(id);
  }

  @Delete(':id')
  remove(@Req() req: any, @Param('id') id: string) {
    const isAdmin = req.user.role === 'ADMIN';
    return this.leavesService.remove(id, req.user.userId, isAdmin);
  }
}
