import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';
import { PeriodFilter } from '@/features/transactions/types';
import { avoidableApi } from './api';

export function useAvoidableSpending(filter: PeriodFilter) {
  return useQuery({
    queryKey: [...queryKeys.avoidable, filter],
    queryFn: () => avoidableApi.get(filter),
  });
}
