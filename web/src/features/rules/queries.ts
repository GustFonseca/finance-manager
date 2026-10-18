import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';
import { rulesApi } from './api';
import { RuleInput } from './types';

export function useRules() {
  return useQuery({ queryKey: queryKeys.rules, queryFn: rulesApi.getAll });
}

export function useSaveRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id?: string; data: RuleInput }) =>
      id ? rulesApi.update(id, data) : rulesApi.create(data),
    onSuccess: () => qc.invalidateQueries(),
  });
}

export function useSetRuleActive() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => rulesApi.setActive(id, isActive),
    onSuccess: () => qc.invalidateQueries(),
  });
}

export function useTestRule() {
  return useMutation({ mutationFn: (pattern: string) => rulesApi.test(pattern) });
}
