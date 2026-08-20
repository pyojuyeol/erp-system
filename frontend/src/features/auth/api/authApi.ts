import { apiClient } from '../../../api/client';

export interface LoginPayload {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  user: { id: string; email: string; name: string; role: string };
}

export const authApi = {
  login: (payload: LoginPayload) =>
    apiClient.post<LoginResponse>('/auth/login', payload).then((res) => res.data),
  logout: () => apiClient.post('/auth/logout').then((res) => res.data),
};
