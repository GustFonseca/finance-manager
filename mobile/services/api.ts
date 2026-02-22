import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

const API_BASE_URL = 'https://finance-manager-api-gufds.azurewebsites.net/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('jwt_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth
export const authApi = {
  googleLogin: (idToken: string) =>
    api.post<{ token: string; email: string; name: string }>('/auth/google', { idToken }),
};

// Accounts
export type AccountDto = {
  id: string;
  name: string;
  balanceCents: number;
  createdAt: string;
};

export const accountsApi = {
  getAll: () => api.get<AccountDto[]>('/accounts'),
  create: (name: string) => api.post<AccountDto>('/accounts', { name }),
  update: (id: string, name: string) => api.put<AccountDto>(`/accounts/${id}`, { name }),
};

// Categories
export type CategoryDto = {
  id: string;
  name: string;
  type: 'INCOME' | 'EXPENSE';
  color: string;
};

export const categoriesApi = {
  getAll: (type?: 'INCOME' | 'EXPENSE') =>
    api.get<CategoryDto[]>('/categories', { params: type ? { type } : {} }),
  create: (data: { name: string; type: string; color: string }) =>
    api.post<CategoryDto>('/categories', data),
  update: (id: string, data: { name: string; type: string; color: string }) =>
    api.put<CategoryDto>(`/categories/${id}`, data),
  delete: (id: string) => api.delete(`/categories/${id}`),
};

// Transactions
export type TransactionDto = {
  id: string;
  accountId: string;
  accountName: string;
  categoryId: string;
  categoryName: string;
  type: 'INCOME' | 'EXPENSE';
  amountCents: number;
  description: string;
  date: string;
  recurrence: string;
};

export type CreateTransactionRequest = {
  accountId: string;
  categoryId: string;
  type: 'INCOME' | 'EXPENSE';
  amountCents: number;
  description: string;
  date: string;
  recurrence?: string;
};

export const transactionsApi = {
  getAll: (start?: string, end?: string) =>
    api.get<TransactionDto[]>('/transactions', { params: { start, end } }),
  create: (data: CreateTransactionRequest) => api.post<TransactionDto>('/transactions', data),
  delete: (id: string) => api.delete(`/transactions/${id}`),
};

// Goals
export type GoalDto = {
  id: string;
  name: string;
  targetCents: number;
  currentCents: number;
  deadline: string | null;
  status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  progressPercent: number;
};

export const goalsApi = {
  getAll: () => api.get<GoalDto[]>('/goals'),
  create: (data: { name: string; targetCents: number; deadline?: string }) =>
    api.post<GoalDto>('/goals', data),
  updateProgress: (id: string, amountCents: number) =>
    api.put<GoalDto>(`/goals/${id}/progress`, { amountCents }),
  complete: (id: string) => api.put<GoalDto>(`/goals/${id}/complete`),
};

// Summary
export type FinancialSummaryDto = {
  totalIncomeCents: number;
  totalExpenseCents: number;
  balanceCents: number;
  byCategory: { categoryId: string; categoryName: string; color: string; totalCents: number }[];
};

export const summaryApi = {
  get: (start?: string, end?: string) =>
    api.get<FinancialSummaryDto>('/summary', { params: { start, end } }),
};

export default api;
