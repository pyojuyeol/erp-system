import { apiClient } from '../../../api/client';

export interface Department {
  id: string;
  name: string;
  _count?: { employees: number };
}

export interface DepartmentPayload {
  name: string;
}

export const departmentsApi = {
  list: () => apiClient.get<Department[]>('/departments').then((res) => res.data),
  create: (payload: DepartmentPayload) =>
    apiClient.post<Department>('/departments', payload).then((res) => res.data),
  update: (id: string, payload: DepartmentPayload) =>
    apiClient.patch<Department>(`/departments/${id}`, payload).then((res) => res.data),
  remove: (id: string) => apiClient.delete(`/departments/${id}`).then((res) => res.data),
};
