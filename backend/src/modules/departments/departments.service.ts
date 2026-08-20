import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';

@Injectable()
export class DepartmentsService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.department.findMany({
      include: { _count: { select: { employees: true } } },
      orderBy: { name: 'asc' },
    });
  }

  async create(dto: CreateDepartmentDto) {
    const existing = await this.prisma.department.findUnique({ where: { name: dto.name } });
    if (existing) throw new ConflictException('이미 존재하는 부서명입니다.');
    return this.prisma.department.create({ data: dto });
  }

  async update(id: string, dto: UpdateDepartmentDto) {
    const department = await this.prisma.department.findUnique({ where: { id } });
    if (!department) throw new NotFoundException('부서를 찾을 수 없습니다.');

    const duplicate = await this.prisma.department.findFirst({
      where: { name: dto.name, NOT: { id } },
    });
    if (duplicate) throw new ConflictException('이미 존재하는 부서명입니다.');

    return this.prisma.department.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    const department = await this.prisma.department.findUnique({
      where: { id },
      include: { _count: { select: { employees: true } } },
    });
    if (!department) throw new NotFoundException('부서를 찾을 수 없습니다.');
    if (department._count.employees > 0) {
      throw new ConflictException('소속 직원이 있는 부서는 삭제할 수 없습니다.');
    }

    await this.prisma.department.delete({ where: { id } });
    return { success: true };
  }
}
