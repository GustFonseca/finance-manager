import { http } from '@/lib/http';
import { DateRange } from '@/features/transactions/types';
import { SavingsPlanDto } from './types';

export const savingsApi = {
  get: ({ start, end }: DateRange) =>
    http.get<SavingsPlanDto>('/savings', { params: { start, end } }).then((r) => r.data),
  setGoal: (monthlyGoalCents: number) =>
    http.put('/savings/goal', { monthlyGoalCents }).then(() => undefined),
  setWorkHours: (hours: number) =>
    http.put('/savings/work-hours', { hours }).then(() => undefined),
  setBudget: (categoryId: string, limitCents: number | null) =>
    http.put(`/savings/budgets/${categoryId}`, { limitCents }).then(() => undefined),
  applySuggested: ({ start, end }: DateRange) =>
    http
      .post<number>('/savings/budgets/apply-suggested', null, { params: { start, end } })
      .then((r) => r.data),
};
