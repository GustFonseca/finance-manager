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

export type SubscriptionChoice = 'KEEP' | 'CANCEL';

export type SubscriptionAuditDto = {
  key: string;
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
  choice: SubscriptionChoice | null;
  decidedAt: string | null;
  chargedAfterCancel: boolean;
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
  thresholdCents: number;
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
  fees: FeesDto;
  hourValueCents: number;
  duplicates: DuplicateChargeDto[];
  billIncreases: BillIncreaseDto[];
  inflationPercent: number;
};

export type DuplicateChargeDto = {
  key: string;
  transactionId: string;
  merchantId: string | null;
  name: string;
  amountCents: number;
  firstDate: string;
  secondDate: string;
};

export type BillIncreaseDto = {
  key: string;
  merchantId: string | null;
  name: string;
  previousCents: number;
  currentCents: number;
  increasePercent: number;
  yearlyImpactCents: number;
};

export type SubscriptionChoiceInput = {
  key: string;
  name: string;
  choice: SubscriptionChoice | null;
};

export type FeeItemDto = {
  label: string;
  monthCents: number;
  yearCents: number;
  count: number;
  lastDate: string;
};

export type FeesDto = {
  monthCents: number;
  yearCents: number;
  items: FeeItemDto[];
};
