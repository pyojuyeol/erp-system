import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

function startOfDay(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

@Injectable()
export class AttendanceService {
  constructor(private prisma: PrismaService) {}

  private async getEmployeeByUserId(userId: string) {
    const employee = await this.prisma.employee.findUnique({ where: { userId } });
    if (!employee) throw new ForbiddenException('직원 정보가 없는 계정입니다.');
    return employee;
  }

  async checkIn(userId: string) {
    const employee = await this.getEmployeeByUserId(userId);
    const today = startOfDay(new Date());

    const existing = await this.prisma.attendance.findUnique({
      where: { employeeId_workDate: { employeeId: employee.id, workDate: today } },
    });

    if (existing?.checkIn) {
      throw new BadRequestException('이미 오늘 출근 체크를 하셨습니다.');
    }

    return this.prisma.attendance.upsert({
      where: { employeeId_workDate: { employeeId: employee.id, workDate: today } },
      update: { checkIn: new Date() },
      create: { employeeId: employee.id, workDate: today, checkIn: new Date() },
    });
  }

  async checkOut(userId: string) {
    const employee = await this.getEmployeeByUserId(userId);
    const today = startOfDay(new Date());

    const existing = await this.prisma.attendance.findUnique({
      where: { employeeId_workDate: { employeeId: employee.id, workDate: today } },
    });

    if (!existing || !existing.checkIn) {
      throw new BadRequestException('출근 기록이 없습니다. 먼저 출근 체크를 해주세요.');
    }
    if (existing.checkOut) {
      throw new BadRequestException('이미 오늘 퇴근 체크를 하셨습니다.');
    }

    return this.prisma.attendance.update({
      where: { id: existing.id },
      data: { checkOut: new Date() },
    });
  }

  async findMine(userId: string, month?: string) {
    const employee = await this.getEmployeeByUserId(userId);
    return this.findByEmployee(employee.id, month);
  }

  async findByEmployee(employeeId: string, month?: string) {
    return this.prisma.attendance.findMany({
      where: {
        employeeId,
        ...(month && {
          workDate: {
            gte: new Date(`${month}-01T00:00:00.000Z`),
            lt: new Date(
              new Date(`${month}-01T00:00:00.000Z`).setMonth(
                new Date(`${month}-01T00:00:00.000Z`).getMonth() + 1,
              ),
            ),
          },
        }),
      },
      orderBy: { workDate: 'desc' },
    });
  }

  async findAll(month?: string) {
    return this.prisma.attendance.findMany({
      where: month
        ? {
            workDate: {
              gte: new Date(`${month}-01T00:00:00.000Z`),
              lt: new Date(
                new Date(`${month}-01T00:00:00.000Z`).setMonth(
                  new Date(`${month}-01T00:00:00.000Z`).getMonth() + 1,
                ),
              ),
            },
          }
        : undefined,
      include: { employee: { include: { user: true, department: true } } },
      orderBy: { workDate: 'desc' },
    });
  }
}
