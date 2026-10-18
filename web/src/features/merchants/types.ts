import type { SpendingClass } from '@/features/spending/types';

export type MerchantKind = 'BUSINESS' | 'PERSON' | 'OWN';

export const MERCHANT_KINDS: { value: MerchantKind; label: string }[] = [
  { value: 'BUSINESS', label: 'Empresa' },
  { value: 'PERSON', label: 'Pessoa' },
  { value: 'OWN', label: 'Suas contas' },
];

export const kindLabel = (kind: MerchantKind) => MERCHANT_KINDS.find((k) => k.value === kind)?.label ?? kind;

export type MerchantDto = {
  id: string;
  name: string;
  kind: MerchantKind;
  document: string | null;
  categoryId: string | null;
  categoryName: string;
  class: SpendingClass | null;
  activity: string | null;
};

export type MerchantMatchDto = {
  description: string;
  name: string;
  kind: MerchantKind | null;
  merchantId: string | null;
  categoryId: string | null;
  skipReason: string | null;
};

export type MerchantSpendingDto = {
  merchantId: string | null;
  name: string;
  kind: MerchantKind;
  categoryName: string;
  color: string;
  count: number;
  cents: number;
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
  averageMonthlyCents: number;
  averageTicketCents: number;
};

export type UpdateMerchantInput = {
  name: string;
  kind: MerchantKind;
  categoryId: string | null;
  applyToTransactions: boolean;
  class?: SpendingClass | null;
};

export type UpdateMerchantResultDto = {
  merchant: MerchantDto;
  updatedTransactions: number;
};
