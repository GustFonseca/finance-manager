export type TransactionType = 'INCOME' | 'EXPENSE';

export type TransactionDto = {
  id: string;
  accountId: string;
  accountName: string;
  categoryId: string;
  categoryName: string;
  type: TransactionType;
  amountCents: number;
  description: string;
  date: string;
  recurrence: string;
};

export type CreateTransactionRequest = {
  accountId: string;
  categoryId: string;
  type: TransactionType;
  amountCents: number;
  description: string;
  date: string;
  recurrence?: string;
};

export type DateRange = { start?: string; end?: string };

/** A period, optionally narrowed to one account. */
export type PeriodFilter = DateRange & { accountId?: string };
