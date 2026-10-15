import { http } from '@/lib/http';
import { DateRange } from '@/features/transactions/types';
import { FinancialSummaryDto } from './types';

export const summaryApi = {
  get: ({ start, end }: DateRange = {}) =>
    http.get<FinancialSummaryDto>('/summary', { params: { start, end } }).then((r) => r.data),
};
