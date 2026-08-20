import { apiClient } from '../../../api/client';

export interface Item {
  id: string;
  sku: string;
  name: string;
  unit: string;
  quantity: number;
  price: number;
}

export interface CreateItemPayload {
  sku: string;
  name: string;
  unit: string;
  price?: number;
}

export interface UpdateItemPayload {
  name?: string;
  unit?: string;
  price?: number;
}

export const itemsApi = {
  list: () => apiClient.get<Item[]>('/items').then((res) => res.data),
  create: (payload: CreateItemPayload) =>
    apiClient.post<Item>('/items', payload).then((res) => res.data),
  update: (id: string, payload: UpdateItemPayload) =>
    apiClient.patch<Item>(`/items/${id}`, payload).then((res) => res.data),
  remove: (id: string) => apiClient.delete(`/items/${id}`).then((res) => res.data),
};
