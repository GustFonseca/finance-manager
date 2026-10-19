import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { invalidateChallenges } from '@/lib/invalidation';
import { queryKeys } from '@/lib/queryKeys';
import { challengesApi } from './api';
import { CreateChallengeInput } from './types';

export function useChallenges() {
  return useQuery({ queryKey: queryKeys.challenges, queryFn: challengesApi.getAll });
}

export function useCreateChallenge() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateChallengeInput) => challengesApi.create(data),
    onSuccess: () => invalidateChallenges(qc),
  });
}

export function useDeleteChallenge() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => challengesApi.remove(id),
    onSuccess: () => invalidateChallenges(qc),
  });
}
