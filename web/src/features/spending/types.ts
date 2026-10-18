export type SpendingClass = 'ESSENTIAL' | 'VARIABLE' | 'SUPERFLUOUS';

export type SpendingClassTotalDto = {
  class: SpendingClass;
  cents: number;
  share: number;
};

export type CategorySpendingDto = {
  categoryId: string;
  categoryName: string;
  color: string;
  cents: number;
  share: number;
  averageCents: number;
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
  averageExpenseCents: number;
  byClass: SpendingClassTotalDto[];
  byCategory: CategorySpendingDto[];
  months: MonthSpendingDto[];
  topMerchants: MerchantSpendingDto[];
  reducible: ReducibleExpenseDto[];
  reduciblePotentialCents: number;
};
