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
  merchantId: string | null;
  merchantName: string;
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

export type ImportTransactionsRequest = {
  accountId: string;
  lines: { date: string; description: string; amountCents: number; type: TransactionType; categoryId: string }[];
};

export type DateRange = { start?: string; end?: string };

export type PeriodFilter = DateRange & { accountId?: string; merchantId?: string };

export type TransactionFilter = PeriodFilter & { categoryId?: string; type?: TransactionType; search?: string };
