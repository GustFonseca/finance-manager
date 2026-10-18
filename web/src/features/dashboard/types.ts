export type CategoryBreakdown = {
  categoryId: string;
  categoryName: string;
  color: string;
  totalCents: number;
};

export type RecurringKind = 'SUBSCRIPTION' | 'FIXED';

export type RecurringExpenseDto = {
  name: string;
  categoryName: string;
  accountId: string;
  accountName: string;
  monthlyCents: number;
  lastDate: string;
  kind: RecurringKind;
  detected: boolean;
};

export type FinancialSummaryDto = {
  totalIncomeCents: number;
  totalExpenseCents: number;
  balanceCents: number;
  byCategory: CategoryBreakdown[];
};

export type ForecastItemKind = 'INCOME' | 'BILL' | 'INSTALLMENT';

export type ForecastItemDto = {
  kind: ForecastItemKind;
  name: string;
  amountCents: number;
  expectedDate: string;
};

export type InstallmentDto = {
  merchantId: string | null;
  key: string;
  name: string;
  amountCents: number;
  paid: number;
  total: number;
  remainingCents: number;
  lastDate: string;
  endsOn: string;
};

export type InstallmentsDto = {
  monthlyCents: number;
  remainingCents: number;
  items: InstallmentDto[];
};

export type CashFlowForecastDto = {
  isCurrentMonth: boolean;
  remainingDays: number;
  incomeSoFarCents: number;
  expenseSoFarCents: number;
  pendingIncomeCents: number;
  pendingBillsCents: number;
  variableEstimateCents: number;
  projectedIncomeCents: number;
  projectedExpenseCents: number;
  projectedBalanceCents: number;
  upcoming: ForecastItemDto[];
  nextIncome: ForecastItemDto | null;
  installments: InstallmentsDto;
};

export type BudgetLevel = 'OK' | 'WARNING' | 'EXCEEDED';

export type BudgetStatusDto = {
  categoryId: string;
  categoryName: string;
  color: string;
  limitCents: number;
  spentCents: number;
  percent: number;
  level: BudgetLevel;
  perDayLeftCents: number;
};

export type DailyBudgetDto = {
  isCurrentMonth: boolean;
  daysLeft: number;
  monthlyGoalCents: number;
  freeToSpendCents: number;
  todayAllowanceCents: number;
  spentTodayCents: number;
  leftTodayCents: number;
  hourValueCents: number;
  workHoursPerMonth: number;
  budgets: BudgetStatusDto[];
};
