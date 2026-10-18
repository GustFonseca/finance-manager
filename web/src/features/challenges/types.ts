export type ChallengeScope = 'SUPERFLUOUS' | 'CATEGORY' | 'MERCHANT';
export type ChallengeStatus = 'ACTIVE' | 'WON' | 'LOST';

export type ChallengeDto = {
  id: string;
  name: string;
  scope: ChallengeScope;
  targetId: string | null;
  targetName: string;
  limitCents: number;
  startsOn: string;
  endsOn: string;
  days: number;
  daysElapsed: number;
  spentCents: number;
  baselineCents: number;
  savedCents: number;
  status: ChallengeStatus;
};

export type CreateChallengeInput = {
  name: string;
  scope: ChallengeScope;
  targetId: string | null;
  limitCents: number;
  startsOn: string;
  days: number;
};
