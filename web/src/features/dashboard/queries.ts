import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';
import { DateRange } from '@/features/transactions/types';
import { summaryApi } from './api';

export function useSummary(range: DateRange = {}) {
  return useQuery({
    queryKey: [...queryKeys.summary, range],
    queryFn: () => summaryApi.get(range),
  });
}
