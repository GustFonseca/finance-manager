using FinanceManager.Domain.Enuns;

namespace FinanceManager.Aplication.DTOs;

public class RecurringExpenseDto
{
    public string Name { get; set; } = string.Empty;
    public string CategoryName { get; set; } = string.Empty;
    public Guid AccountId { get; set; }
    public string AccountName { get; set; } = string.Empty;
    public long MonthlyCents { get; set; }
    public DateTime LastDate { get; set; }
    public RecurringKind Kind { get; set; }
    public string Key { get; set; } = string.Empty;
    public bool Detected { get; set; }
    public Recurrence Period { get; set; } = Recurrence.MONTHLY;
}

public class SavingsPlanDto
{
    public long MonthlyGoalCents { get; set; }
    public int WorkHoursPerMonth { get; set; }
    public long HourValueCents { get; set; }
    public long MonthIncomeCents { get; set; }
    public long MonthExpenseCents { get; set; }
    public long MonthSavedCents { get; set; }
    public long AverageSavedCents { get; set; }
    public int HistoryMonths { get; set; }
    public double MonthProgress { get; set; }
    public List<CategoryBudgetDto> Budgets { get; set; } = [];
    public List<SavingsSuggestionDto> Suggestions { get; set; } = [];
    public long PotentialSavingsCents { get; set; }
}

public class CategoryBudgetDto
{
    public Guid CategoryId { get; set; }
    public string CategoryName { get; set; } = string.Empty;
    public string Color { get; set; } = string.Empty;
    public long? LimitCents { get; set; }
    public long SpentCents { get; set; }
    public long AverageCents { get; set; }
    public long SuggestedLimitCents { get; set; }
    public bool Essential { get; set; }
}

public class SavingsSuggestionDto
{
    public SuggestionKind Kind { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Detail { get; set; } = string.Empty;
    public long PotentialCents { get; set; }
}

public class SavingsGoalRequest
{
    public long MonthlyGoalCents { get; set; }
}

public class WorkHoursRequest
{
    public int Hours { get; set; }
}

public class CategoryBudgetRequest
{
    public long? LimitCents { get; set; }
}
