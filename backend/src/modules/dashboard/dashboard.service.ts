import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

function startOfDay(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async summary() {
    const now = new Date();
    const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const monthStart = new Date(`${month}-01T00:00:00.000Z`);
    const monthEnd = new Date(monthStart);
    monthEnd.setMonth(monthEnd.getMonth() + 1);
    const today = startOfDay(now);

    const [
      employeeCount,
      departmentCount,
      itemCount,
      lowStockCount,
      pendingLeaves,
      todayAttendanceCount,
      salaries,
      entries,
    ] = await Promise.all([
      this.prisma.employee.count(),
      this.prisma.department.count(),
      this.prisma.item.count(),
      this.prisma.item.count({ where: { quantity: { lt: 10 } } }),
      this.prisma.leave.count({ where: { status: 'PENDING' } }),
      this.prisma.attendance.count({ where: { workDate: today, checkIn: { not: null } } }),
      this.prisma.salary.findMany({ where: { payMonth: month } }),
      this.prisma.accountingEntry.findMany({
        where: { entryDate: { gte: monthStart, lt: monthEnd } },
      }),
    ]);

    const monthlySalaryTotal = salaries.reduce((sum, s) => sum + s.netPay, 0);
    const monthlyIncome = entries
      .filter((e) => e.type === 'INCOME')
      .reduce((sum, e) => sum + e.amount, 0);
    const monthlyExpense = entries
      .filter((e) => e.type === 'EXPENSE')
      .reduce((sum, e) => sum + e.amount, 0);

    return {
      month,
      employeeCount,
      departmentCount,
      itemCount,
      lowStockCount,
      pendingLeaves,
      todayAttendanceCount,
      monthlySalaryTotal,
      monthlyIncome,
      monthlyExpense,
      monthlyBalance: monthlyIncome - monthlyExpense,
    };
  }
}
