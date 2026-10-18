import { http } from '@/lib/http';
import { PeriodFilter } from '@/features/transactions/types';
import { AvoidableSpendingDto, SubscriptionChoiceInput } from './types';

export const avoidableApi = {
  get: ({ start, end, accountId }: PeriodFilter) =>
    http.get<AvoidableSpendingDto>('/summary/avoidable', { params: { start, end, accountId } }).then((r) => r.data),
  dismiss: (key: string) => http.post('/summary/dismissals', { key }).then(() => undefined),
  setSubscriptionChoice: (data: SubscriptionChoiceInput) =>
    http.put('/summary/subscriptions/choice', data).then(() => undefined),
};
