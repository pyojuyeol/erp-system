import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEntryDto } from './dto/create-entry.dto';
import { UpdateEntryDto } from './dto/update-entry.dto';

@Injectable()
export class AccountingService {
  constructor(private prisma: PrismaService) {}

  async findAll(month?: string) {
    const where = month
      ? {
          entryDate: {
            gte: new Date(`${month}-01T00:00:00.000Z`),
            lt: new Date(
              new Date(`${month}-01T00:00:00.000Z`).setMonth(
                new Date(`${month}-01T00:00:00.000Z`).getMonth() + 1,
              ),
            ),
          },
        }
      : undefined;

    return this.prisma.accountingEntry.findMany({
      where,
      orderBy: { entryDate: 'desc' },
    });
  }

  async summary(month: string) {
    const entries = await this.findAll(month);
    const income = entries.filter((e) => e.type === 'INCOME').reduce((s, e) => s + e.amount, 0);
    const expense = entries.filter((e) => e.type === 'EXPENSE').reduce((s, e) => s + e.amount, 0);
    return { income, expense, balance: income - expense };
  }

  create(dto: CreateEntryDto) {
    return this.prisma.accountingEntry.create({
      data: { ...dto, entryDate: new Date(dto.entryDate) },
    });
  }

  async update(id: string, dto: UpdateEntryDto) {
    const entry = await this.prisma.accountingEntry.findUnique({ where: { id } });
    if (!entry) throw new NotFoundException('전표를 찾을 수 없습니다.');
    return this.prisma.accountingEntry.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    const entry = await this.prisma.accountingEntry.findUnique({ where: { id } });
    if (!entry) throw new NotFoundException('전표를 찾을 수 없습니다.');
    await this.prisma.accountingEntry.delete({ where: { id } });
    return { success: true };
  }
}
