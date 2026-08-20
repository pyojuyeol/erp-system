import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateItemDto } from './dto/create-item.dto';
import { UpdateItemDto } from './dto/update-item.dto';

@Injectable()
export class ItemsService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.item.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async findOne(id: string) {
    const item = await this.prisma.item.findUnique({ where: { id } });
    if (!item) throw new NotFoundException('품목을 찾을 수 없습니다.');
    return item;
  }

  async create(dto: CreateItemDto) {
    const existing = await this.prisma.item.findUnique({ where: { sku: dto.sku } });
    if (existing) throw new ConflictException('이미 존재하는 SKU입니다.');
    return this.prisma.item.create({ data: { ...dto, price: dto.price ?? 0 } });
  }

  async update(id: string, dto: UpdateItemDto) {
    await this.findOne(id);
    return this.prisma.item.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.item.delete({ where: { id } });
    return { success: true };
  }
}
