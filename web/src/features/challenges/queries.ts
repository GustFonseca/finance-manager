import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
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
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.challenges }),
  });
}

export function useDeleteChallenge() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => challengesApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.challenges }),
  });
}
