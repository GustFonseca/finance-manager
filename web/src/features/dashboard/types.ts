export type CategoryBreakdown = {
  categoryId: string;
  categoryName: string;
  color: string;
  totalCents: number;
};

export type RecurringKind = 'SUBSCRIPTION' | 'FIXED';

/** A charge that repeats every month: marked as recurring or detected from history. */
export type RecurringExpenseDto = {
  name: string;
  categoryName: string;
  accountId: string;
  accountName: string;
  /** Cost per month (yearly charges divided by 12…). */
  monthlyCents: number;
  lastDate: string;
  kind: RecurringKind;
  /** True when found by the app; false when marked as recurring. */
  detected: boolean;
};

export type FinancialSummaryDto = {
  totalIncomeCents: number;
  totalExpenseCents: number;
  balanceCents: number;
  byCategory: CategoryBreakdown[];
};
