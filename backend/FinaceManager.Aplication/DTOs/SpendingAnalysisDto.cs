using FinanceManager.Domain.Enuns;

namespace FinanceManager.Aplication.DTOs;

public class SpendingAnalysisDto
{
    public long MonthExpenseCents { get; set; }
    public long AverageExpenseCents { get; set; }
    public List<SpendingClassTotalDto> ByClass { get; set; } = [];
    public List<CategorySpendingDto> ByCategory { get; set; } = [];
    public List<MonthSpendingDto> Months { get; set; } = [];
    public List<MerchantSpendingDto> TopMerchants { get; set; } = [];
    public List<ReducibleExpenseDto> Reducible { get; set; } = [];
    public long ReduciblePotentialCents { get; set; }
}

public class SpendingClassTotalDto
{
    public SpendingClass Class { get; set; }
    public long Cents { get; set; }
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
    public SpendingClass Class { get; set; }
}

public class MonthSpendingDto
{
    public DateTime MonthStart { get; set; }
    public long EssentialCents { get; set; }
    public long VariableCents { get; set; }
    public long SuperfluousCents { get; set; }
}

public class MerchantSpendingDto
{
    public Guid? MerchantId { get; set; }
    public string Name { get; set; } = string.Empty;
    public MerchantKind Kind { get; set; }
    public string CategoryName { get; set; } = string.Empty;
    public string Color { get; set; } = string.Empty;
    public int Count { get; set; }
    public long Cents { get; set; }
    public double Share { get; set; }
    public long AverageTicketCents { get; set; }
    public DateTime LastDate { get; set; }
    public SpendingClass Class { get; set; }
}

public class ReducibleExpenseDto
{
    public Guid? MerchantId { get; set; }
    public string Name { get; set; } = string.Empty;
    public Guid CategoryId { get; set; }
    public bool Subscription { get; set; }
    public SpendingClass Class { get; set; }
    public double TimesPerMonth { get; set; }
    public long MonthlyCents { get; set; }
    public long PotentialCents { get; set; }
    public string Detail { get; set; } = string.Empty;
}
