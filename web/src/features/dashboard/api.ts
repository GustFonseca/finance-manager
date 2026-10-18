import { http } from '@/lib/http';
import { PeriodFilter } from '@/features/transactions/types';
import { CashFlowForecastDto, DailyBudgetDto, FinancialSummaryDto, RecurringExpenseDto } from './types';

export const summaryApi = {
  get: ({ start, end, accountId }: PeriodFilter = {}) =>
    http
      .get<FinancialSummaryDto>('/summary', { params: { start, end, accountId } })
      .then((r) => r.data),
  recurring: ({ end, accountId }: PeriodFilter = {}) =>
    http
      .get<RecurringExpenseDto[]>('/summary/recurring', { params: { end, accountId } })
      .then((r) => r.data),
  daily: ({ start, end }: PeriodFilter, dayStart: string) =>
    http
      .get<DailyBudgetDto>('/summary/daily', { params: { start, end, dayStart } })
      .then((r) => r.data),
  forecast: ({ start, end, accountId }: PeriodFilter = {}) =>
    http
      .get<CashFlowForecastDto>('/summary/forecast', { params: { start, end, accountId } })
      .then((r) => r.data),
};
