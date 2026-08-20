import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { SalariesService } from './salaries.service';
import { CreateSalaryDto } from './dto/create-salary.dto';
import { UpdateSalaryDto } from './dto/update-salary.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Salaries')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('salaries')
export class SalariesController {
  constructor(private salariesService: SalariesService) {}

  @Get()
  @Roles('ADMIN', 'MANAGER')
  findAll(@Query('payMonth') payMonth?: string) {
    return this.salariesService.findAll(payMonth);
  }

  @Get('employee/:employeeId')
  findByEmployee(@Param('employeeId') employeeId: string) {
    return this.salariesService.findByEmployee(employeeId);
  }

  @Post()
  @Roles('ADMIN', 'MANAGER')
  create(@Body() dto: CreateSalaryDto) {
    return this.salariesService.create(dto);
  }

  @Patch(':id')
  @Roles('ADMIN', 'MANAGER')
  update(@Param('id') id: string, @Body() dto: UpdateSalaryDto) {
    return this.salariesService.update(id, dto);
  }

  @Delete(':id')
  @Roles('ADMIN')
  remove(@Param('id') id: string) {
    return this.salariesService.remove(id);
  }
}
