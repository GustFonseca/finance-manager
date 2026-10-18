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
