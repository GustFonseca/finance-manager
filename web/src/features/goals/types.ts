export type GoalStatus = 'ACTIVE' | 'COMPLETED' | 'CANCELLED';

export type GoalDto = {
  id: string;
  name: string;
  targetCents: number;
  currentCents: number;
  deadline: string | null;
  status: GoalStatus;
  progressPercent: number;
};

export type CreateGoalInput = {
  name: string;
  targetCents: number;
  deadline?: string;
};
