import { http } from '@/lib/http';
import { CreateTransactionRequest, ImportTransactionsRequest, PeriodFilter, TransactionDto } from './types';

export const transactionsApi = {
  getAll: ({ start, end, accountId, merchantId }: PeriodFilter = {}) =>
    http
      .get<TransactionDto[]>('/transactions', { params: { start, end, accountId, merchantId } })
      .then((r) => r.data),
  create: (data: CreateTransactionRequest) =>
    http.post<TransactionDto>('/transactions', data).then((r) => r.data),
  importMany: (data: ImportTransactionsRequest) =>
    http.post<{ imported: number }>('/transactions/import', data).then((r) => r.data.imported),
  remove: (id: string) => http.delete(`/transactions/${id}`).then(() => undefined),
  removeAll: () => http.delete<{ deleted: number }>('/transactions').then((r) => r.data.deleted),
};
