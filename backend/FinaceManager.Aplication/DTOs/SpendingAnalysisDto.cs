using FinanceManager.Domain.Enuns;

namespace FinanceManager.Aplication.DTOs;

/// <summary>Where the money went this month, how necessary it was, and what could be reduced.</summary>
public class SpendingAnalysisDto
{
    public long MonthExpenseCents { get; set; }
    /// <summary>Average monthly spending over the previous three months.</summary>
    public long AverageExpenseCents { get; set; }
    public List<SpendingClassTotalDto> ByClass { get; set; } = [];
    public List<CategorySpendingDto> ByCategory { get; set; } = [];
    /// <summary>The last months, oldest first, ending with the current one.</summary>
    public List<MonthSpendingDto> Months { get; set; } = [];
    public List<MerchantSpendingDto> TopMerchants { get; set; } = [];
    public List<ReducibleExpenseDto> Reducible { get; set; } = [];
    public long ReduciblePotentialCents { get; set; }
}

public class SpendingClassTotalDto
{
    public SpendingClass Class { get; set; }
    public long Cents { get; set; }
    /// <summary>Share of the month's spending, 0 to 1.</summary>
    public double Share { get; set; }
}

public class CategorySpendingDto
{
    public Guid CategoryId { get; set; }
    public string CategoryName { get; set; } = string.Empty;
    public string Color { get; set; } = string.Empty;
    public long Cents { get; set; }
    public double Share { get; set; }
    public long AverageCents { get; set; }
    /// <summary>The class most of this category's money went to.</summary>
    public SpendingClass Class { get; set; }
}

public class MonthSpendingDto
{
    /// <summary>First day of the month (the user's local midnight).</summary>
    public DateTime MonthStart { get; set; }
    public long EssentialCents { get; set; }
    public long VariableCents { get; set; }
    public long SuperfluousCents { get; set; }
}

public class MerchantSpendingDto
{
    public string Name { get; set; } = string.Empty;
    public string CategoryName { get; set; } = string.Empty;
    public int Count { get; set; }
    public long Cents { get; set; }
    public SpendingClass Class { get; set; }
}

public class ReducibleExpenseDto
{
    public string Name { get; set; } = string.Empty;
    public SpendingClass Class { get; set; }
    /// <summary>Average purchases per month.</summary>
    public double TimesPerMonth { get; set; }
    public long MonthlyCents { get; set; }
    public long PotentialCents { get; set; }
    public string Detail { get; set; } = string.Empty;
}
