import { apiClient } from '../../../api/client';
import type { Item } from './itemsApi';

export interface InventoryTransaction {
  id: string;
  itemId: string;
  type: 'IN' | 'OUT';
  quantity: number;
  memo?: string;
  createdAt: string;
  item: Item;
}

export interface CreateTransactionPayload {
  itemId: string;
  type: 'IN' | 'OUT';
  quantity: number;
  memo?: string;
}

export const inventoryApi = {
  list: () =>
    apiClient.get<InventoryTransaction[]>('/inventory-transactions').then((res) => res.data),
  create: (payload: CreateTransactionPayload) =>
    apiClient
      .post<InventoryTransaction>('/inventory-transactions', payload)
      .then((res) => res.data),
};
