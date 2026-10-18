export type EmergencyFundDto = {
  months: number;
  monthlyEssentialCents: number;
  targetCents: number;
  goalId: string | null;
  goalName: string | null;
  savedCents: number;
  percent: number;
  averageSavedCents: number;
  monthsToReach: number | null;
};

export type EmergencyFundInput = {
  months: number;
  goalId: string | null;
};

export type SeasonalExpenseDto = {
  label: string;
  name: string;
  lastDate: string;
  lastCents: number;
  nextDate: string;
  monthsLeft: number;
  monthlyReserveCents: number;
};

export type SeasonalExpensesDto = {
  monthlyReserveCents: number;
  items: SeasonalExpenseDto[];
};

export type NetWorthDto = {
  assetsCents: number;
  debtsCents: number;
  netCents: number;
  accounts: { name: string; balanceCents: number }[];
  history: { month: string; assetsCents: number }[];
};
