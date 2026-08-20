import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { InventoryService } from './inventory.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Inventory')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('inventory-transactions')
export class InventoryController {
  constructor(private inventoryService: InventoryService) {}

  @Get()
  findAll(@Query('itemId') itemId?: string) {
    return this.inventoryService.findAll(itemId);
  }

  @Post()
  @Roles('ADMIN', 'MANAGER')
  create(@Body() dto: CreateTransactionDto) {
    return this.inventoryService.create(dto);
  }
}
