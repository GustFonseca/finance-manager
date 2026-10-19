import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { invalidateGoals } from '@/lib/invalidation';
import { queryKeys } from '@/lib/queryKeys';
import { goalsApi } from './api';
import { CreateGoalInput } from './types';

export function useGoals() {
  return useQuery({ queryKey: queryKeys.goals, queryFn: goalsApi.getAll });
}

export function useCreateGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateGoalInput) => goalsApi.create(data),
    onSuccess: () => invalidateGoals(qc),
  });
}

export function useAddGoalProgress() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { id: string; amountCents: number }) =>
      goalsApi.addProgress(input.id, input.amountCents),
    onSuccess: () => invalidateGoals(qc),
  });
}

export function useCompleteGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => goalsApi.complete(id),
    onSuccess: () => invalidateGoals(qc),
  });
}

export function useDeleteGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => goalsApi.remove(id),
    onSuccess: () => invalidateGoals(qc),
  });
}
