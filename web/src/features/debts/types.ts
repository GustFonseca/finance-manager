export type DebtDto = {
  id: string;
  name: string;
  balanceCents: number;
  monthlyRatePercent: number;
  minimumPaymentCents: number;
};

export type DebtInput = Omit<DebtDto, 'id'>;

export type DebtPayoff = {
  debtId: string;
  name: string;
  paidOffInMonth: number;
};

export type DebtStrategy = {
  feasible: boolean;
  months: number;
  totalInterestCents: number;
  order: DebtPayoff[];
};

export type DebtPlanDto = {
  monthlyBudgetCents: number;
  extraCents: number;
  avalanche: DebtStrategy;
  snowball: DebtStrategy;
  interestSavedWithAvalancheCents: number;
};
