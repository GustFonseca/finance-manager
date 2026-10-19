import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { invalidateWishlist } from '@/lib/invalidation';
import { queryKeys } from '@/lib/queryKeys';
import { wishlistApi } from './api';
import { CreateWishInput, WishStatus } from './types';

export function useWishlist() {
  return useQuery({ queryKey: queryKeys.wishlist, queryFn: wishlistApi.get });
}

export function useCreateWish() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateWishInput) => wishlistApi.create(data),
    onSuccess: () => invalidateWishlist(qc),
  });
}

export function useDecideWish() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { id: string; status: WishStatus }) => wishlistApi.decide(input.id, input.status),
    onSuccess: () => invalidateWishlist(qc),
  });
}

export function useDeleteWish() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => wishlistApi.remove(id),
    onSuccess: () => invalidateWishlist(qc),
  });
}
