import { apiClient } from '../../../api/client';

export interface Attendance {
  id: string;
  employeeId: string;
  workDate: string;
  checkIn: string | null;
  checkOut: string | null;
  employee?: {
    user: { name: string };
    department: { name: string };
  };
}

export const attendanceApi = {
  checkIn: () => apiClient.post<Attendance>('/attendance/check-in').then((res) => res.data),
  checkOut: () => apiClient.post<Attendance>('/attendance/check-out').then((res) => res.data),
  me: (month?: string) =>
    apiClient
      .get<Attendance[]>('/attendance/me', { params: month ? { month } : undefined })
      .then((res) => res.data),
  all: (month?: string) =>
    apiClient
      .get<Attendance[]>('/attendance', { params: month ? { month } : undefined })
      .then((res) => res.data),
};
