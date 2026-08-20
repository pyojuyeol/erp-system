import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AccountingService } from './accounting.service';
import { CreateEntryDto } from './dto/create-entry.dto';
import { UpdateEntryDto } from './dto/update-entry.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Accounting')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('accounting-entries')
export class AccountingController {
  constructor(private accountingService: AccountingService) {}

  @Get()
  @Roles('ADMIN', 'MANAGER')
  findAll(@Query('month') month?: string) {
    return this.accountingService.findAll(month);
  }

  @Get('summary')
  @Roles('ADMIN', 'MANAGER')
  summary(@Query('month') month: string) {
    return this.accountingService.summary(month);
  }

  @Post()
  @Roles('ADMIN', 'MANAGER')
  create(@Body() dto: CreateEntryDto) {
    return this.accountingService.create(dto);
  }

  @Patch(':id')
  @Roles('ADMIN', 'MANAGER')
  update(@Param('id') id: string, @Body() dto: UpdateEntryDto) {
    return this.accountingService.update(id, dto);
  }

  @Delete(':id')
  @Roles('ADMIN')
  remove(@Param('id') id: string) {
    return this.accountingService.remove(id);
  }
}
