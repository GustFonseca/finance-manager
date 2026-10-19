import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { invalidateFiles, invalidateMoney } from '@/lib/invalidation';
import { queryKeys } from '@/lib/queryKeys';
import { transactionsApi } from './api';
import { uploadReceipt } from './receipts';
import { CreateTransactionRequest, ImportTransactionsRequest, TransactionFilter } from './types';

export function useTransactions(range: TransactionFilter = {}, enabled = true) {
  return useQuery({
    queryKey: [...queryKeys.transactions, range],
    queryFn: () => transactionsApi.getAll(range),
    enabled,
  });
}

export function useCreateTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateTransactionRequest) => transactionsApi.create(data),
    onSuccess: () => invalidateMoney(qc),
  });
}

export function useUpdateTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: CreateTransactionRequest }) => transactionsApi.update(id, data),
    onSuccess: () => invalidateMoney(qc),
  });
}

export function useImportTransactions() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: ImportTransactionsRequest) => transactionsApi.importMany(data),
    onSuccess: () => invalidateMoney(qc),
  });
}

export function useDeleteAllTransactions() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => transactionsApi.removeAll(),
    onSuccess: () => invalidateMoney(qc),
  });
}

export function useSetReceipt() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, file }: { id: string; file: File | null }) =>
      transactionsApi.setReceipt(id, file ? await uploadReceipt(file) : null),
    onSuccess: () => invalidateMoney(qc),
    onSettled: () => invalidateFiles(qc),
  });
}

export function useDeleteTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => transactionsApi.remove(id),
    onSuccess: () => invalidateMoney(qc),
  });
}
