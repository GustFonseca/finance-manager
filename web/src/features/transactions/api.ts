import { http } from '@/lib/http';
import { CreateTransactionRequest, DateRange, TransactionDto } from './types';

export const transactionsApi = {
  getAll: ({ start, end }: DateRange = {}) =>
    http.get<TransactionDto[]>('/transactions', { params: { start, end } }).then((r) => r.data),
  create: (data: CreateTransactionRequest) =>
    http.post<TransactionDto>('/transactions', data).then((r) => r.data),
  remove: (id: string) => http.delete(`/transactions/${id}`).then(() => undefined),
};
