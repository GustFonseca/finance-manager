import { http } from '@/lib/http';
import { PeriodFilter } from '@/features/transactions/types';
import { SpendingAnalysisDto } from './types';

export const spendingApi = {
  get: ({ start, end, accountId }: PeriodFilter) =>
    http
      .get<SpendingAnalysisDto>('/summary/spending', { params: { start, end, accountId } })
      .then((r) => r.data),
};
