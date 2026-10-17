using FinanceManager.Domain.Enuns;

namespace FinanceManager.Aplication.DTOs;

/// <summary>A charge that repeats every month: marked as recurring or detected from history.</summary>
public class RecurringExpenseDto
{
    public string Name { get; set; } = string.Empty;
    public string CategoryName { get; set; } = string.Empty;
    public Guid AccountId { get; set; }
    public string AccountName { get; set; } = string.Empty;
    /// <summary>Cost per month (yearly charges divided by 12, and so on).</summary>
    public long MonthlyCents { get; set; }
    public DateTime LastDate { get; set; }
    public RecurringKind Kind { get; set; }
    /// <summary>True when found by the app; false when the transaction was marked as recurring.</summary>
    public bool Detected { get; set; }
}

public class SavingsPlanDto
{
    public long MonthlyGoalCents { get; set; }
    public long MonthIncomeCents { get; set; }
    public long MonthExpenseCents { get; set; }
    /// <summary>Income minus expenses so far this month.</summary>
    public long MonthSavedCents { get; set; }
    /// <summary>Average saved per month over the previous months.</summary>
    public long AverageSavedCents { get; set; }
    /// <summary>Share of the month already elapsed, 0 to 1.</summary>
    public double MonthProgress { get; set; }
    public List<CategoryBudgetDto> Budgets { get; set; } = [];
    public List<SavingsSuggestionDto> Suggestions { get; set; } = [];
    /// <summary>What the subscription and category suggestions could save per month.</summary>
    public long PotentialSavingsCents { get; set; }
}

public class CategoryBudgetDto
{
    public Guid CategoryId { get; set; }
    public string CategoryName { get; set; } = string.Empty;
    public string Color { get; set; } = string.Empty;
    /// <summary>The limit the user set; null when there is none.</summary>
    public long? LimitCents { get; set; }
    public long SpentCents { get; set; }
    public long AverageCents { get; set; }
    public long SuggestedLimitCents { get; set; }
    /// <summary>Housing, health, education: kept at their average instead of cut.</summary>
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

public class CategoryBudgetRequest
{
    /// <summary>Null or zero removes the limit.</summary>
    public long? LimitCents { get; set; }
}
