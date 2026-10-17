import { http } from '@/lib/http';
import { CreateTransactionRequest, PeriodFilter, TransactionDto } from './types';

export const transactionsApi = {
  getAll: ({ start, end, accountId }: PeriodFilter = {}) =>
    http
      .get<TransactionDto[]>('/transactions', { params: { start, end, accountId } })
      .then((r) => r.data),
  create: (data: CreateTransactionRequest) =>
    http.post<TransactionDto>('/transactions', data).then((r) => r.data),
  remove: (id: string) => http.delete(`/transactions/${id}`).then(() => undefined),
  /** Deletes every transaction of the user; resolves with how many were deleted. */
  removeAll: () => http.delete<{ deleted: number }>('/transactions').then((r) => r.data.deleted),
};
