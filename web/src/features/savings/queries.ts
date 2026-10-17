import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';
import { DateRange } from '@/features/transactions/types';
import { savingsApi } from './api';

/** The current month, from the user's local first day until now. */
export function currentMonth(): Required<DateRange> {
  const now = new Date();
  return {
    start: new Date(now.getFullYear(), now.getMonth(), 1).toISOString(),
    end: now.toISOString(),
  };
}

export function useSavingsPlan(month: DateRange) {
  return useQuery({
    queryKey: [...queryKeys.savings, month],
    queryFn: () => savingsApi.get(month),
  });
}

function useSavingsMutation<TInput, TResult>(mutationFn: (input: TInput) => Promise<TResult>) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.savings }),
  });
}

export const useSetSavingsGoal = () => useSavingsMutation((cents: number) => savingsApi.setGoal(cents));

export const useSetBudget = () =>
  useSavingsMutation((input: { categoryId: string; limitCents: number | null }) =>
    savingsApi.setBudget(input.categoryId, input.limitCents)
  );

export const useApplySuggestedBudgets = () =>
  useSavingsMutation((month: DateRange) => savingsApi.applySuggested(month));
