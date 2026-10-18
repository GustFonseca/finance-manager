export type SuggestionKind = 'GOAL' | 'BUDGET' | 'SUBSCRIPTION' | 'CATEGORY' | 'HABIT' | 'ORGANIZE';

export type CategoryBudgetDto = {
  categoryId: string;
  categoryName: string;
  color: string;
  limitCents: number | null;
  spentCents: number;
  averageCents: number;
  suggestedLimitCents: number;
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
  workHoursPerMonth: number;
  hourValueCents: number;
  monthIncomeCents: number;
  monthExpenseCents: number;
  monthSavedCents: number;
  averageSavedCents: number;
  historyMonths: number;
  monthProgress: number;
  budgets: CategoryBudgetDto[];
  suggestions: SavingsSuggestionDto[];
  potentialSavingsCents: number;
};
