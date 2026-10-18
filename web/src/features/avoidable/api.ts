import { http } from '@/lib/http';
import { PeriodFilter } from '@/features/transactions/types';
import { AvoidableSpendingDto } from './types';

export const avoidableApi = {
  get: ({ start, end, accountId }: PeriodFilter) =>
    http.get<AvoidableSpendingDto>('/summary/avoidable', { params: { start, end, accountId } }).then((r) => r.data),
};
