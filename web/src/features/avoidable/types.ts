import type { SpendingClass } from '@/features/spending/types';

export type AvoidableMerchantDto = {
  merchantId: string | null;
  name: string;
  categoryName: string;
  count: number;
  monthCents: number;
  monthlyAverageCents: number;
  cutCents: number;
  cutInvestedIn12MonthsCents: number;
};

export type SubscriptionAuditDto = {
  merchantId: string | null;
  name: string;
  group: string | null;
  monthlyCents: number;
  yearlyCents: number;
  previousCents: number | null;
  priceIncreased: boolean;
  lastDate: string;
  resumedAfter: string | null;
  investedIn12MonthsCents: number;
};

export type SimilarSubscriptionsDto = {
  group: string;
  names: string[];
  monthlyCents: number;
};

export type SmallPurchaseMerchantDto = {
  merchantId: string | null;
  name: string;
  monthlyCents: number;
  timesPerMonth: number;
  averageTicketCents: number;
};

export type SmallPurchasesDto = {
  limitCents: number;
  monthlyCents: number;
  timesPerMonth: number;
  merchants: SmallPurchaseMerchantDto[];
};

export type SpendingSpikeDto = {
  kind: 'MERCHANT' | 'CATEGORY';
  id: string | null;
  name: string;
  monthCents: number;
  averageCents: number;
  ratio: number;
};

export type FirstTimePurchaseDto = {
  transactionId: string;
  merchantId: string | null;
  name: string;
  cents: number;
  date: string;
  class: SpendingClass;
};

export type AvoidableSpendingDto = {
  monthCents: number;
  monthlyAverageCents: number;
  yearProjectionCents: number;
  investedIn12MonthsCents: number;
  cdiAnnualPercent: number;
  historyMonths: number;
  superfluous: AvoidableMerchantDto[];
  subscriptions: SubscriptionAuditDto[];
  similarSubscriptions: SimilarSubscriptionsDto[];
  smallPurchases: SmallPurchasesDto;
  spikes: SpendingSpikeDto[];
  firstTimePurchases: FirstTimePurchaseDto[];
};
