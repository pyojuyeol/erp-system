import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSalaryDto } from './dto/create-salary.dto';
import { UpdateSalaryDto } from './dto/update-salary.dto';

@Injectable()
export class SalariesService {
  constructor(private prisma: PrismaService) {}

  findAll(payMonth?: string) {
    return this.prisma.salary.findMany({
      where: payMonth ? { payMonth } : undefined,
      include: { employee: { include: { user: true, department: true } } },
      orderBy: [{ payMonth: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async findByEmployee(employeeId: string) {
    return this.prisma.salary.findMany({
      where: { employeeId },
      orderBy: { payMonth: 'desc' },
    });
  }

  async create(dto: CreateSalaryDto) {
    const existing = await this.prisma.salary.findUnique({
      where: { employeeId_payMonth: { employeeId: dto.employeeId, payMonth: dto.payMonth } },
    });
    if (existing) {
      throw new ConflictException('해당 직원의 이번 달 급여가 이미 등록되어 있습니다.');
    }

    const allowance = dto.allowance ?? 0;
    const deduction = dto.deduction ?? 0;
    const netPay = dto.baseSalary + allowance - deduction;

    return this.prisma.salary.create({
      data: { ...dto, allowance, deduction, netPay },
      include: { employee: { include: { user: true, department: true } } },
    });
  }

  async update(id: string, dto: UpdateSalaryDto) {
    const salary = await this.prisma.salary.findUnique({ where: { id } });
    if (!salary) throw new NotFoundException('급여 내역을 찾을 수 없습니다.');

    const baseSalary = dto.baseSalary ?? salary.baseSalary;
    const allowance = dto.allowance ?? salary.allowance;
    const deduction = dto.deduction ?? salary.deduction;
    const netPay = baseSalary + allowance - deduction;

    return this.prisma.salary.update({
      where: { id },
      data: { ...dto, netPay },
      include: { employee: { include: { user: true, department: true } } },
    });
  }

  async remove(id: string) {
    const salary = await this.prisma.salary.findUnique({ where: { id } });
    if (!salary) throw new NotFoundException('급여 내역을 찾을 수 없습니다.');
    await this.prisma.salary.delete({ where: { id } });
    return { success: true };
  }
}
