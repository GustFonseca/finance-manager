import { http } from '@/lib/http';
import { DateRange } from '@/features/transactions/types';
import { SavingsPlanDto } from './types';

/** `start` is the user's local first day of the month, `end` is now. */
export const savingsApi = {
  get: ({ start, end }: DateRange) =>
    http.get<SavingsPlanDto>('/savings', { params: { start, end } }).then((r) => r.data),
  setGoal: (monthlyGoalCents: number) =>
    http.put('/savings/goal', { monthlyGoalCents }).then(() => undefined),
  /** `null` removes the category's limit. */
  setBudget: (categoryId: string, limitCents: number | null) =>
    http.put(`/savings/budgets/${categoryId}`, { limitCents }).then(() => undefined),
  /** Returns how many limits were set. */
  applySuggested: ({ start, end }: DateRange) =>
    http
      .post<number>('/savings/budgets/apply-suggested', null, { params: { start, end } })
      .then((r) => r.data),
};
