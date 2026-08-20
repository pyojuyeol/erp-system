import { apiClient } from '../../../api/client';

export interface Salary {
  id: string;
  employeeId: string;
  payMonth: string;
  baseSalary: number;
  allowance: number;
  deduction: number;
  netPay: number;
  memo?: string;
  employee: {
    id: string;
    position: string;
    user: { name: string; email: string };
    department: { name: string };
  };
}

export interface CreateSalaryPayload {
  employeeId: string;
  payMonth: string;
  baseSalary: number;
  allowance?: number;
  deduction?: number;
  memo?: string;
}

export interface UpdateSalaryPayload {
  baseSalary?: number;
  allowance?: number;
  deduction?: number;
  memo?: string;
}

export const salariesApi = {
  list: (payMonth?: string) =>
    apiClient
      .get<Salary[]>('/salaries', { params: payMonth ? { payMonth } : undefined })
      .then((res) => res.data),
  create: (payload: CreateSalaryPayload) =>
    apiClient.post<Salary>('/salaries', payload).then((res) => res.data),
  update: (id: string, payload: UpdateSalaryPayload) =>
    apiClient.patch<Salary>(`/salaries/${id}`, payload).then((res) => res.data),
  remove: (id: string) => apiClient.delete(`/salaries/${id}`).then((res) => res.data),
};
