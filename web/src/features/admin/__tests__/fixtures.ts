import { UserOverviewDto } from '../types';

export function userOverview(overrides: Partial<UserOverviewDto> = {}): UserOverviewDto {
  return {
    id: 'u1',
    name: 'Ana',
    email: 'ana@x.com',
    createdAt: new Date(2026, 8, 1, 10, 0).toISOString(),
    lastLoginAt: new Date(2026, 9, 18, 20, 15).toISOString(),
    lastSeenAt: new Date(2026, 9, 19, 8, 0).toISOString(),
    loginCount: 5,
    transactionCount: 42,
    activeLast7Days: true,
    ...overrides,
  };
}

export const users = [
  userOverview(),
  userOverview({
    id: 'u2',
    name: 'Bruno',
    email: 'bruno@x.com',
    lastLoginAt: null,
    lastSeenAt: null,
    loginCount: 2,
    transactionCount: 0,
    activeLast7Days: false,
  }),
];
