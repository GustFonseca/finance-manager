export type WishStatus = 'WAITING' | 'BOUGHT' | 'GAVE_UP';

export type WishDto = {
  id: string;
  name: string;
  priceCents: number;
  link: string | null;
  createdAt: string;
  decideAfter: string;
  status: WishStatus;
  decidedAt: string | null;
  readyToDecide: boolean;
};

export type WishlistDto = {
  items: WishDto[];
  savedCents: number;
  waitingCents: number;
  hourValueCents: number;
  waitHours: number;
};

export type CreateWishInput = {
  name: string;
  priceCents: number;
  link: string | null;
};
