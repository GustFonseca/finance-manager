import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';
import { PeriodFilter } from '@/features/transactions/types';
import { spendingApi } from './api';

/** Under the summary key, so any transaction change refreshes it too. */
export function useSpendingAnalysis(filter: PeriodFilter) {
  return useQuery({
    queryKey: [...queryKeys.summary, 'spending', filter],
    queryFn: () => spendingApi.get(filter),
  });
}
