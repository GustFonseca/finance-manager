import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';
import { invalidateMoney } from '@/features/transactions/queries';
import { DateRange, PeriodFilter } from '@/features/transactions/types';
import { merchantsApi } from './api';
import { UpdateMerchantInput } from './types';

export function useMerchants() {
  return useQuery({ queryKey: queryKeys.merchants, queryFn: merchantsApi.getAll });
}

export function useMerchantSpending(filter: PeriodFilter) {
  return useQuery({
    queryKey: [...queryKeys.merchants, 'spending', filter],
    queryFn: () => merchantsApi.spending(filter),
  });
}

export function useUnsortedMerchants(range: DateRange, enabled = true) {
  return useQuery({
    queryKey: [...queryKeys.merchants, 'unsorted', range],
    queryFn: () => merchantsApi.unsorted(range),
    enabled,
  });
}

export function useMerchantHistory(id: string | null, range: DateRange) {
  return useQuery({
    queryKey: [...queryKeys.merchants, 'history', id, range],
    queryFn: () => merchantsApi.history(id!, range),
    enabled: !!id,
  });
}

export function useUpdateMerchant() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateMerchantInput }) => merchantsApi.update(id, data),
    onSuccess: () => invalidateMoney(qc),
  });
}
