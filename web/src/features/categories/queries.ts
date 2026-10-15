import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';
import { categoriesApi } from './api';
import { CategoryInput, CategoryType } from './types';

export function useCategories(type?: CategoryType) {
  return useQuery({
    queryKey: type ? [...queryKeys.categories, type] : queryKeys.categories,
    queryFn: () => categoriesApi.getAll(type),
  });
}

export function useSaveCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { id?: string; data: CategoryInput }) =>
      input.id ? categoriesApi.update(input.id, input.data) : categoriesApi.create(input.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.categories }),
  });
}

export function useDeleteCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => categoriesApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.categories }),
  });
}
