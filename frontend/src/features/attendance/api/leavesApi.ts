import { apiClient } from '../../../api/client';

export type LeaveType = 'ANNUAL' | 'HALF_DAY' | 'SICK' | 'OTHER';
export type LeaveStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface Leave {
  id: string;
  employeeId: string;
  type: LeaveType;
  startDate: string;
  endDate: string;
  reason?: string;
  status: LeaveStatus;
  employee?: {
    user: { name: string };
    department: { name: string };
  };
}

export interface CreateLeavePayload {
  type: LeaveType;
  startDate: string;
  endDate: string;
  reason?: string;
}

export const leavesApi = {
  create: (payload: CreateLeavePayload) =>
    apiClient.post<Leave>('/leaves', payload).then((res) => res.data),
  mine: () => apiClient.get<Leave[]>('/leaves/me').then((res) => res.data),
  all: (status?: string) =>
    apiClient.get<Leave[]>('/leaves', { params: status ? { status } : undefined }).then((res) => res.data),
  approve: (id: string) => apiClient.patch<Leave>(`/leaves/${id}/approve`).then((res) => res.data),
  reject: (id: string) => apiClient.patch<Leave>(`/leaves/${id}/reject`).then((res) => res.data),
  remove: (id: string) => apiClient.delete(`/leaves/${id}`).then((res) => res.data),
};
