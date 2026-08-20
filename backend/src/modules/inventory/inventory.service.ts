import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';

@Injectable()
export class InventoryService {
  constructor(private prisma: PrismaService) {}

  findAll(itemId?: string) {
    return this.prisma.inventoryTransaction.findMany({
      where: itemId ? { itemId } : undefined,
      include: { item: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(dto: CreateTransactionDto) {
    const item = await this.prisma.item.findUnique({ where: { id: dto.itemId } });
    if (!item) throw new NotFoundException('품목을 찾을 수 없습니다.');

    if (dto.type === 'OUT' && item.quantity < dto.quantity) {
      throw new BadRequestException(
        `재고가 부족합니다. (현재 재고: ${item.quantity}${item.unit})`,
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const transaction = await tx.inventoryTransaction.create({
        data: dto,
        include: { item: true },
      });

      await tx.item.update({
        where: { id: dto.itemId },
        data: {
          quantity: {
            [dto.type === 'IN' ? 'increment' : 'decrement']: dto.quantity,
          },
        },
      });

      return transaction;
    });
  }
}
