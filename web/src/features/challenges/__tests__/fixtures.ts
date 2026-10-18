import { ChallengeDto } from '../types';

export const challenge = (overrides: Partial<ChallengeDto> = {}): ChallengeDto => ({
  id: 'ch1',
  name: '30 dias sem delivery',
  scope: 'CATEGORY',
  targetId: 'c1',
  targetName: 'Delivery',
  limitCents: 10000,
  startsOn: '2026-10-10T03:00:00Z',
  endsOn: '2026-11-09T03:00:00Z',
  days: 30,
  daysElapsed: 9,
  spentCents: 4000,
  baselineCents: 24000,
  savedCents: 20000,
  status: 'ACTIVE',
  ...overrides,
});
