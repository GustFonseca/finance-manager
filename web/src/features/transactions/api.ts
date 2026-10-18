import { http } from '@/lib/http';
import { CreateTransactionRequest, ImportTransactionsRequest, TransactionDto, TransactionFilter } from './types';

export const transactionsApi = {
  getAll: ({ start, end, accountId, merchantId, categoryId, type, search, limit }: TransactionFilter = {}) =>
    http
      .get<TransactionDto[]>('/transactions', {
        params: { start, end, accountId, merchantId, categoryId, type, search: search || undefined, limit },
      })
      .then((r) => r.data),
  create: (data: CreateTransactionRequest) =>
    http.post<TransactionDto>('/transactions', data).then((r) => r.data),
  update: (id: string, data: CreateTransactionRequest) =>
    http.put<TransactionDto>(`/transactions/${id}`, data).then((r) => r.data),
  importMany: (data: ImportTransactionsRequest) =>
    http.post<{ imported: number }>('/transactions/import', data).then((r) => r.data.imported),
  setReceipt: (id: string, fileId: string | null) =>
    http.put<TransactionDto>(`/transactions/${id}/receipt`, { fileId }).then((r) => r.data),
  remove: (id: string) => http.delete(`/transactions/${id}`).then(() => undefined),
  removeAll: () => http.delete<{ deleted: number }>('/transactions').then((r) => r.data.deleted),
};
