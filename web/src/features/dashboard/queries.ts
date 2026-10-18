import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';
import { PeriodFilter } from '@/features/transactions/types';
import { summaryApi } from './api';

export function useSummary(filter: PeriodFilter = {}) {
  return useQuery({
    queryKey: [...queryKeys.summary, filter],
    queryFn: () => summaryApi.get(filter),
  });
}

export function useRecurringExpenses(filter: PeriodFilter = {}) {
  return useQuery({
    queryKey: [...queryKeys.summary, 'recurring', filter],
    queryFn: () => summaryApi.recurring(filter),
  });
}
