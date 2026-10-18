import type { SpendingClass } from '@/features/spending/types';

/** Who is on the other side: a company, a person, or the user's own money moving. */
export type MerchantKind = 'BUSINESS' | 'PERSON' | 'OWN';

export const MERCHANT_KINDS: { value: MerchantKind; label: string }[] = [
  { value: 'BUSINESS', label: 'Empresa' },
  { value: 'PERSON', label: 'Pessoa' },
  { value: 'OWN', label: 'Suas contas' },
];

export const kindLabel = (kind: MerchantKind) => MERCHANT_KINDS.find((k) => k.value === kind)!.label;

export type MerchantDto = {
  id: string;
  name: string;
  kind: MerchantKind;
  document: string | null;
  categoryId: string | null;
  categoryName: string;
};

/** The merchant of an imported line and what the app already knows about it. */
export type MerchantMatchDto = {
  description: string;
  name: string;
  kind: MerchantKind;
  merchantId: string | null;
  categoryId: string | null;
};

export type MerchantSpendingDto = {
  merchantId: string | null;
  name: string;
  kind: MerchantKind;
  categoryName: string;
  color: string;
  count: number;
  cents: number;
  /** Share of the period's spending, 0 to 1. */
  share: number;
  averageTicketCents: number;
  lastDate: string;
  class: SpendingClass;
};

export type MerchantSpendingReportDto = {
  totalCents: number;
  count: number;
  merchants: MerchantSpendingDto[];
};

export type MerchantMonthDto = {
  monthStart: string;
  expenseCents: number;
  incomeCents: number;
  count: number;
};

export type MerchantHistoryDto = {
  merchant: MerchantDto;
  months: MerchantMonthDto[];
  expenseCents: number;
  incomeCents: number;
  count: number;
  /** Over the months with any spending. */
  averageMonthlyCents: number;
  averageTicketCents: number;
};

export type UpdateMerchantInput = {
  name: string;
  kind: MerchantKind;
  categoryId: string | null;
  /** Also move the existing transactions to the category. */
  applyToTransactions: boolean;
};

export type UpdateMerchantResultDto = {
  merchant: MerchantDto;
  updatedTransactions: number;
};
