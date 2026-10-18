import { http } from '@/lib/http';
import { CreateWishInput, WishDto, WishlistDto, WishStatus } from './types';

export const wishlistApi = {
  get: () => http.get<WishlistDto>('/wishlist').then((r) => r.data),
  create: (data: CreateWishInput) => http.post<WishDto>('/wishlist', data).then((r) => r.data),
  decide: (id: string, status: WishStatus) =>
    http.put<WishDto>(`/wishlist/${id}/decision`, { status }).then((r) => r.data),
  remove: (id: string) => http.delete(`/wishlist/${id}`).then(() => undefined),
};
