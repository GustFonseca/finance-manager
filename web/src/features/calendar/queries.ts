import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';
import { DateRange } from '@/features/transactions/types';
import { calendarApi } from './api';

export function useCalendar(range: DateRange) {
  return useQuery({
    queryKey: [...queryKeys.calendar, range],
    queryFn: () => calendarApi.get(range),
  });
}
