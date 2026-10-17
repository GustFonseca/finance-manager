export type SuggestionKind = 'GOAL' | 'BUDGET' | 'SUBSCRIPTION' | 'CATEGORY';

export type CategoryBudgetDto = {
  categoryId: string;
  categoryName: string;
  color: string;
  /** The limit the user set; null when there is none. */
  limitCents: number | null;
  spentCents: number;
  averageCents: number;
  suggestedLimitCents: number;
  /** Housing, health, education: kept at their average instead of cut. */
  essential: boolean;
};

export type SavingsSuggestionDto = {
  kind: SuggestionKind;
  title: string;
  detail: string;
  potentialCents: number;
};

export type SavingsPlanDto = {
  monthlyGoalCents: number;
  monthIncomeCents: number;
  monthExpenseCents: number;
  /** Income minus expenses so far this month. */
  monthSavedCents: number;
  /** Average saved per month over the previous three months. */
  averageSavedCents: number;
  /** Share of the month already elapsed, 0 to 1. */
  monthProgress: number;
  budgets: CategoryBudgetDto[];
  suggestions: SavingsSuggestionDto[];
  potentialSavingsCents: number;
};
