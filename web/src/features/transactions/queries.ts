import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';
import { transactionsApi } from './api';
import { CreateTransactionRequest, TransactionFilter } from './types';

export function useTransactions(range: TransactionFilter = {}, enabled = true) {
  return useQuery({
    queryKey: [...queryKeys.transactions, range],
    queryFn: () => transactionsApi.getAll(range),
    enabled,
  });
}

export function invalidateMoney(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: queryKeys.transactions });
  qc.invalidateQueries({ queryKey: queryKeys.accounts });
  qc.invalidateQueries({ queryKey: queryKeys.summary });
  qc.invalidateQueries({ queryKey: queryKeys.savings });
  qc.invalidateQueries({ queryKey: queryKeys.merchants });
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

export function useDeleteAllTransactions() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => transactionsApi.removeAll(),
    onSuccess: () => invalidateMoney(qc),
  });
}

export function useDeleteTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => transactionsApi.remove(id),
    onSuccess: () => invalidateMoney(qc),
  });
}
