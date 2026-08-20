import { apiClient } from '../../../api/client';

export interface DashboardSummary {
  month: string;
  employeeCount: number;
  departmentCount: number;
  itemCount: number;
  lowStockCount: number;
  pendingLeaves: number;
  todayAttendanceCount: number;
  monthlySalaryTotal: number;
  monthlyIncome: number;
  monthlyExpense: number;
  monthlyBalance: number;
}

export const dashboardApi = {
  summary: () => apiClient.get<DashboardSummary>('/dashboard/summary').then((res) => res.data),
};
