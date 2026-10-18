import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';
import { PeriodFilter } from '@/features/transactions/types';
import { spendingApi } from './api';

export function useSpendingAnalysis(filter: PeriodFilter) {
  return useQuery({
    queryKey: [...queryKeys.summary, 'spending', filter],
    queryFn: () => spendingApi.get(filter),
  });
}
