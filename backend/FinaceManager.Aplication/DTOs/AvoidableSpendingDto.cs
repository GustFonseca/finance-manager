using FinanceManager.Domain.Enuns;

namespace FinanceManager.Aplication.DTOs;

public class AvoidableSpendingDto
{
    public long MonthCents { get; set; }
    public long MonthlyAverageCents { get; set; }
    public long YearProjectionCents { get; set; }
    public long InvestedIn12MonthsCents { get; set; }
    public decimal CdiAnnualPercent { get; set; }
    public int HistoryMonths { get; set; }
    public List<AvoidableMerchantDto> Superfluous { get; set; } = [];
    public List<SubscriptionAuditDto> Subscriptions { get; set; } = [];
    public List<SimilarSubscriptionsDto> SimilarSubscriptions { get; set; } = [];
    public SmallPurchasesDto SmallPurchases { get; set; } = new();
    public List<SpendingSpikeDto> Spikes { get; set; } = [];
    public List<FirstTimePurchaseDto> FirstTimePurchases { get; set; } = [];
}

public class AvoidableMerchantDto
{
    public Guid? MerchantId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string CategoryName { get; set; } = string.Empty;
    public int Count { get; set; }
    public long MonthCents { get; set; }
    public long MonthlyAverageCents { get; set; }
    public long CutCents { get; set; }
    public long CutInvestedIn12MonthsCents { get; set; }
}

public class SubscriptionAuditDto
{
    public Guid? MerchantId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Group { get; set; }
    public long MonthlyCents { get; set; }
    public long YearlyCents { get; set; }
    public long? PreviousCents { get; set; }
    public bool PriceIncreased { get; set; }
    public DateTime LastDate { get; set; }
    public DateTime? ResumedAfter { get; set; }
    public long InvestedIn12MonthsCents { get; set; }
}

public class SimilarSubscriptionsDto
{
    public string Group { get; set; } = string.Empty;
    public List<string> Names { get; set; } = [];
    public long MonthlyCents { get; set; }
}

public class SmallPurchasesDto
{
    public long LimitCents { get; set; }
    public long MonthlyCents { get; set; }
    public double TimesPerMonth { get; set; }
    public List<SmallPurchaseMerchantDto> Merchants { get; set; } = [];
}

public class SmallPurchaseMerchantDto
{
    public Guid? MerchantId { get; set; }
    public string Name { get; set; } = string.Empty;
    public long MonthlyCents { get; set; }
    public double TimesPerMonth { get; set; }
    public long AverageTicketCents { get; set; }
}

public enum SpikeKind
{
    MERCHANT,
    CATEGORY
}

public class SpendingSpikeDto
{
    public SpikeKind Kind { get; set; }
    public Guid? Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public long MonthCents { get; set; }
    public long AverageCents { get; set; }
    public double Ratio { get; set; }
}

public class FirstTimePurchaseDto
{
    public Guid TransactionId { get; set; }
    public Guid? MerchantId { get; set; }
    public string Name { get; set; } = string.Empty;
    public long Cents { get; set; }
    public DateTime Date { get; set; }
    public SpendingClass Class { get; set; }
}
