import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';
import { accountsApi } from './api';

export function useAccounts() {
  return useQuery({ queryKey: queryKeys.accounts, queryFn: accountsApi.getAll });
}

export function useSaveAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { id?: string; name: string }) =>
      input.id ? accountsApi.update(input.id, input.name) : accountsApi.create(input.name),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.accounts });
      qc.invalidateQueries({ queryKey: queryKeys.summary });
    },
  });
}

export function useDeleteAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => accountsApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.accounts });
      qc.invalidateQueries({ queryKey: queryKeys.summary });
    },
  });
}
