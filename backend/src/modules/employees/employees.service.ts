import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';

@Injectable()
export class EmployeesService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.employee.findMany({
      include: { user: true, department: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const employee = await this.prisma.employee.findUnique({
      where: { id },
      include: { user: true, department: true },
    });
    if (!employee) throw new NotFoundException('직원을 찾을 수 없습니다.');
    return employee;
  }

  async create(dto: CreateEmployeeDto) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) {
      throw new ConflictException('이미 사용 중인 이메일입니다.');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: dto.email,
          passwordHash,
          name: dto.name,
          role: 'EMPLOYEE',
        },
      });

      return tx.employee.create({
        data: {
          userId: user.id,
          departmentId: dto.departmentId,
          position: dto.position,
          hireDate: new Date(dto.hireDate),
        },
        include: { user: true, department: true },
      });
    });
  }

  async update(id: string, dto: UpdateEmployeeDto) {
    await this.findOne(id);

    const employee = await this.prisma.employee.findUnique({ where: { id } });

    return this.prisma.$transaction(async (tx) => {
      if (dto.name) {
        await tx.user.update({
          where: { id: employee!.userId },
          data: { name: dto.name },
        });
      }

      return tx.employee.update({
        where: { id },
        data: {
          departmentId: dto.departmentId,
          position: dto.position,
          hireDate: dto.hireDate ? new Date(dto.hireDate) : undefined,
        },
        include: { user: true, department: true },
      });
    });
  }

  async remove(id: string) {
    const employee = await this.findOne(id);

    await this.prisma.$transaction(async (tx) => {
      await tx.employee.delete({ where: { id } });
      await tx.user.delete({ where: { id: employee.userId } });
    });

    return { success: true };
  }
}
