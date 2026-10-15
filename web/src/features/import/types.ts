import type { TransactionType } from '@/features/transactions/types';

export type StatementSource = 'nubank-card' | 'nubank-account' | 'ofx';

export const SOURCE_LABELS: Record<StatementSource, string> = {
  'nubank-card': 'Fatura do cartão Nubank (CSV)',
  'nubank-account': 'Extrato da conta Nubank (CSV)',
  ofx: 'Extrato bancário (OFX)',
};

/** One line of a bank statement, normalized for import. */
export type ImportRow = {
  /** Unique within the file (the bank's id when it has one). */
  key: string;
  /** Local calendar day, `yyyy-mm-dd`. */
  date: string;
  description: string;
  /** Always positive; the direction is in `type`. */
  amountCents: number;
  type: TransactionType;
  /** Why the row starts unchecked (e.g. a card bill payment), if it does. */
  skipReason?: string;
};

export type ParsedStatement = {
  source: StatementSource;
  rows: ImportRow[];
};
