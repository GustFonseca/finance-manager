import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';
import { debtsApi } from './api';
import { DebtInput } from './types';

function invalidateDebts(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: queryKeys.debts });
  qc.invalidateQueries({ queryKey: queryKeys.summary });
}

export function useDebts() {
  return useQuery({ queryKey: queryKeys.debts, queryFn: debtsApi.getAll });
}

export function useDebtPlan(extraCents: number, enabled = true) {
  return useQuery({
    queryKey: [...queryKeys.debts, 'plan', extraCents],
    queryFn: () => debtsApi.plan(extraCents),
    enabled,
  });
}

export function useSaveDebt() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string | null; data: DebtInput }) =>
      id ? debtsApi.update(id, data) : debtsApi.create(data),
    onSuccess: () => invalidateDebts(qc),
  });
}

export function useDeleteDebt() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => debtsApi.remove(id),
    onSuccess: () => invalidateDebts(qc),
  });
}
