export type CategoryBreakdown = {
  categoryId: string;
  categoryName: string;
  color: string;
  totalCents: number;
};

export type FinancialSummaryDto = {
  totalIncomeCents: number;
  totalExpenseCents: number;
  balanceCents: number;
  byCategory: CategoryBreakdown[];
};
