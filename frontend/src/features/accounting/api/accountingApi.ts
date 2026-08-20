import { apiClient } from '../../../api/client';

export interface AccountingEntry {
  id: string;
  type: 'INCOME' | 'EXPENSE';
  category: string;
  amount: number;
  entryDate: string;
  memo?: string;
}

export interface AccountingSummary {
  income: number;
  expense: number;
  balance: number;
}

export interface CreateEntryPayload {
  type: 'INCOME' | 'EXPENSE';
  category: string;
  amount: number;
  entryDate: string;
  memo?: string;
}

export interface UpdateEntryPayload {
  category?: string;
  amount?: number;
  memo?: string;
}

export const accountingApi = {
  list: (month?: string) =>
    apiClient
      .get<AccountingEntry[]>('/accounting-entries', { params: month ? { month } : undefined })
      .then((res) => res.data),
  summary: (month: string) =>
    apiClient
      .get<AccountingSummary>('/accounting-entries/summary', { params: { month } })
      .then((res) => res.data),
  create: (payload: CreateEntryPayload) =>
    apiClient.post<AccountingEntry>('/accounting-entries', payload).then((res) => res.data),
  update: (id: string, payload: UpdateEntryPayload) =>
    apiClient.patch<AccountingEntry>(`/accounting-entries/${id}`, payload).then((res) => res.data),
  remove: (id: string) => apiClient.delete(`/accounting-entries/${id}`).then((res) => res.data),
};
