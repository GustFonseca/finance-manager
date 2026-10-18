import { DebtDto, DebtPlanDto, DebtStrategy } from '../types';

export const debt = (overrides: Partial<DebtDto> = {}): DebtDto => ({
  id: 'd1',
  name: 'Cartão',
  balanceCents: 350000,
  monthlyRatePercent: 12.5,
  minimumPaymentCents: 20000,
  ...overrides,
});

export const strategy = (overrides: Partial<DebtStrategy> = {}): DebtStrategy => ({
  feasible: true,
  months: 14,
  totalInterestCents: 80000,
  order: [
    { debtId: 'd1', name: 'Cartão', paidOffInMonth: 9 },
    { debtId: 'd2', name: 'Empréstimo', paidOffInMonth: 14 },
  ],
  ...overrides,
});

export const plan = (overrides: Partial<DebtPlanDto> = {}): DebtPlanDto => ({
  monthlyBudgetCents: 50000,
  extraCents: 0,
  avalanche: strategy(),
  snowball: strategy({
    months: 15,
    totalInterestCents: 95000,
    order: [
      { debtId: 'd2', name: 'Empréstimo', paidOffInMonth: 1 },
      { debtId: 'd1', name: 'Cartão', paidOffInMonth: 15 },
    ],
  }),
  interestSavedWithAvalancheCents: 15000,
  ...overrides,
});
