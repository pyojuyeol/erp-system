import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateLeaveDto } from './dto/create-leave.dto';

@Injectable()
export class LeavesService {
  constructor(private prisma: PrismaService) {}

  private async getEmployeeByUserId(userId: string) {
    const employee = await this.prisma.employee.findUnique({ where: { userId } });
    if (!employee) throw new ForbiddenException('직원 정보가 없는 계정입니다.');
    return employee;
  }

  async create(userId: string, dto: CreateLeaveDto) {
    const employee = await this.getEmployeeByUserId(userId);
    const start = new Date(dto.startDate);
    const end = new Date(dto.endDate);

    if (end < start) {
      throw new BadRequestException('종료일은 시작일보다 빠를 수 없습니다.');
    }

    return this.prisma.leave.create({
      data: {
        employeeId: employee.id,
        type: dto.type,
        startDate: start,
        endDate: end,
        reason: dto.reason,
      },
      include: { employee: { include: { user: true, department: true } } },
    });
  }

  async findMine(userId: string) {
    const employee = await this.getEmployeeByUserId(userId);
    return this.prisma.leave.findMany({
      where: { employeeId: employee.id },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findAll(status?: string) {
    return this.prisma.leave.findMany({
      where: status ? { status: status as any } : undefined,
      include: { employee: { include: { user: true, department: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async approve(id: string) {
    return this.updateStatus(id, 'APPROVED');
  }

  async reject(id: string) {
    return this.updateStatus(id, 'REJECTED');
  }

  private async updateStatus(id: string, status: 'APPROVED' | 'REJECTED') {
    const leave = await this.prisma.leave.findUnique({ where: { id } });
    if (!leave) throw new NotFoundException('휴가 신청을 찾을 수 없습니다.');
    if (leave.status !== 'PENDING') {
      throw new BadRequestException('이미 처리된 휴가 신청입니다.');
    }
    return this.prisma.leave.update({
      where: { id },
      data: { status },
      include: { employee: { include: { user: true, department: true } } },
    });
  }

  async remove(id: string, userId: string, isAdmin: boolean) {
    const leave = await this.prisma.leave.findUnique({ where: { id }, include: { employee: true } });
    if (!leave) throw new NotFoundException('휴가 신청을 찾을 수 없습니다.');

    if (!isAdmin) {
      const employee = await this.getEmployeeByUserId(userId);
      if (leave.employeeId !== employee.id) {
        throw new ForbiddenException('본인의 신청만 취소할 수 있습니다.');
      }
      if (leave.status !== 'PENDING') {
        throw new BadRequestException('대기 중인 신청만 취소할 수 있습니다.');
      }
    }

    await this.prisma.leave.delete({ where: { id } });
    return { success: true };
  }
}
