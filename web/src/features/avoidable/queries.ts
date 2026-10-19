import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { invalidateInsights } from '@/lib/invalidation';
import { queryKeys } from '@/lib/queryKeys';
import { PeriodFilter } from '@/features/transactions/types';
import { avoidableApi } from './api';
import { SubscriptionChoiceInput } from './types';

export function useAvoidableSpending(filter: PeriodFilter) {
  return useQuery({
    queryKey: [...queryKeys.avoidable, filter],
    queryFn: () => avoidableApi.get(filter),
  });
}

export function useDismissInsight() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (key: string) => avoidableApi.dismiss(key),
    onSuccess: () => invalidateInsights(qc),
  });
}

export function useSetSubscriptionChoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: SubscriptionChoiceInput) => avoidableApi.setSubscriptionChoice(data),
    onSuccess: () => invalidateInsights(qc),
  });
}
