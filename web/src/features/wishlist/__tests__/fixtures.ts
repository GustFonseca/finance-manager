import { WishDto, WishlistDto } from '../types';

export const wish = (overrides: Partial<WishDto> = {}): WishDto => ({
  id: 'w1',
  name: 'Fone de ouvido',
  priceCents: 35000,
  link: null,
  createdAt: new Date(2026, 9, 18, 15, 30).toISOString(),
  decideAfter: new Date(2026, 9, 20, 15, 30).toISOString(),
  status: 'WAITING',
  decidedAt: null,
  readyToDecide: false,
  ...overrides,
});

export const wishlist = (overrides: Partial<WishlistDto> = {}): WishlistDto => ({
  items: [wish()],
  savedCents: 0,
  waitingCents: 35000,
  hourValueCents: 5000,
  waitHours: 48,
  ...overrides,
});
