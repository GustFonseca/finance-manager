import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';
import { PeriodFilter } from '@/features/transactions/types';
import { todayStartIso } from '@/lib/periods';
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

export function useForecast(filter: PeriodFilter = {}) {
  return useQuery({
    queryKey: [...queryKeys.summary, 'forecast', filter],
    queryFn: () => summaryApi.forecast(filter),
  });
}

export function useDailyBudget(filter: PeriodFilter = {}) {
  const dayStart = todayStartIso();
  const month = { start: filter.start, end: filter.end };
  return useQuery({
    queryKey: [...queryKeys.summary, 'daily', month, dayStart],
    queryFn: () => summaryApi.daily(month, dayStart),
  });
}

export function useDigest(filter: PeriodFilter = {}) {
  const dayStart = todayStartIso();
  const month = { start: filter.start, end: filter.end };
  return useQuery({
    queryKey: [...queryKeys.summary, 'digest', month, dayStart],
    queryFn: () => summaryApi.digest(month, dayStart),
  });
}
