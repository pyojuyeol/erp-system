import { apiClient } from '../../../api/client';

export interface Employee {
  id: string;
  position: string;
  hireDate: string;
  user: { name: string; email: string };
  department: { id: string; name: string };
}

export interface CreateEmployeePayload {
  name: string;
  email: string;
  password: string;
  departmentId: string;
  position: string;
  hireDate: string;
}

export interface UpdateEmployeePayload {
  name?: string;
  departmentId?: string;
  position?: string;
  hireDate?: string;
}

export const employeesApi = {
  list: () => apiClient.get<Employee[]>('/employees').then((res) => res.data),
  get: (id: string) => apiClient.get<Employee>(`/employees/${id}`).then((res) => res.data),
  create: (payload: CreateEmployeePayload) =>
    apiClient.post<Employee>('/employees', payload).then((res) => res.data),
  update: (id: string, payload: UpdateEmployeePayload) =>
    apiClient.patch<Employee>(`/employees/${id}`, payload).then((res) => res.data),
  remove: (id: string) => apiClient.delete(`/employees/${id}`).then((res) => res.data),
};
