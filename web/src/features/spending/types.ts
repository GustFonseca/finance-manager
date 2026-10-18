export type SpendingClass = 'ESSENTIAL' | 'VARIABLE' | 'SUPERFLUOUS';

export type SpendingClassTotalDto = {
  class: SpendingClass;
  cents: number;
  /** Share of the month's spending, 0 to 1. */
  share: number;
};

export type CategorySpendingDto = {
  categoryId: string;
  categoryName: string;
  color: string;
  cents: number;
  share: number;
  averageCents: number;
  /** The class most of this category's money went to. */
  class: SpendingClass;
};

export type MonthSpendingDto = {
  monthStart: string;
  essentialCents: number;
  variableCents: number;
  superfluousCents: number;
};

export type { MerchantSpendingDto } from '@/features/merchants/types';
import type { MerchantSpendingDto } from '@/features/merchants/types';

export type ReducibleExpenseDto = {
  merchantId: string | null;
  name: string;
  categoryId: string;
  subscription: boolean;
  class: SpendingClass;
  timesPerMonth: number;
  monthlyCents: number;
  potentialCents: number;
  detail: string;
};

export type SpendingAnalysisDto = {
  monthExpenseCents: number;
  /** Average over the previous three months. */
  averageExpenseCents: number;
  byClass: SpendingClassTotalDto[];
  byCategory: CategorySpendingDto[];
  /** Oldest first, ending with the current month. */
  months: MonthSpendingDto[];
  topMerchants: MerchantSpendingDto[];
  reducible: ReducibleExpenseDto[];
  reduciblePotentialCents: number;
};
