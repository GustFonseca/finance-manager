import type { TransactionType } from '@/features/transactions/types';

export type StatementSource = 'nubank-card' | 'nubank-account' | 'ofx';

export const SOURCE_LABELS: Record<StatementSource, string> = {
  'nubank-card': 'Fatura do cartão Nubank (CSV)',
  'nubank-account': 'Extrato da conta Nubank (CSV)',
  ofx: 'Extrato bancário (OFX)',
};

export type ImportRow = {
  key: string;
  date: string;
  description: string;
  amountCents: number;
  type: TransactionType;
};

export type ParsedStatement = {
  source: StatementSource;
  rows: ImportRow[];
};
