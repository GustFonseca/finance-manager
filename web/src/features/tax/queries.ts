import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';
import { taxApi } from './api';

export function useTaxReport(year: number) {
  return useQuery({
    queryKey: [...queryKeys.planning, 'tax', year],
    queryFn: () => taxApi.report(year),
  });
}
