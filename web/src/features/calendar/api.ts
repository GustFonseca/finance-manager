import { http } from '@/lib/http';
import { DateRange } from '@/features/transactions/types';
import { CalendarDto } from './types';

export const calendarApi = {
  get: ({ start, end }: DateRange) =>
    http.get<CalendarDto>('/summary/calendar', { params: { start, end } }).then((r) => r.data),
};
