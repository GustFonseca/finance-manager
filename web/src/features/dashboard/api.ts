import { http } from '@/lib/http';
import { PeriodFilter } from '@/features/transactions/types';
import { FinancialSummaryDto, RecurringExpenseDto } from './types';

export const summaryApi = {
  get: ({ start, end, accountId }: PeriodFilter = {}) =>
    http
      .get<FinancialSummaryDto>('/summary', { params: { start, end, accountId } })
      .then((r) => r.data),
  recurring: ({ end, accountId }: PeriodFilter = {}) =>
    http
      .get<RecurringExpenseDto[]>('/summary/recurring', { params: { end, accountId } })
      .then((r) => r.data),
};
