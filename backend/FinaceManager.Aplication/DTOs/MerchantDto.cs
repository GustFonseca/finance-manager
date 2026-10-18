using FinanceManager.Domain.Enuns;

namespace FinanceManager.Aplication.DTOs;

public class MerchantDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public MerchantKind Kind { get; set; }
    public string? Document { get; set; }
    public Guid? CategoryId { get; set; }
    public string CategoryName { get; set; } = string.Empty;
}

/// <summary>The merchant read from an imported line, and what the app already knows about it.</summary>
public class MerchantMatchDto
{
    public string Description { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public MerchantKind Kind { get; set; }
    /// <summary>Null when the merchant is new.</summary>
    public Guid? MerchantId { get; set; }
    /// <summary>The category the user filed it under before.</summary>
    public Guid? CategoryId { get; set; }
}

/// <summary>Spending per merchant over a period (a month or a year).</summary>
public class MerchantSpendingReportDto
{
    public long TotalCents { get; set; }
    public int Count { get; set; }
    public List<MerchantSpendingDto> Merchants { get; set; } = [];
}

/// <summary>One merchant over time: month by month, and in total.</summary>
public class MerchantHistoryDto
{
    public MerchantDto Merchant { get; set; } = new();
    public List<MerchantMonthDto> Months { get; set; } = [];
    public long ExpenseCents { get; set; }
    public long IncomeCents { get; set; }
    public int Count { get; set; }
    /// <summary>Average spent per month, over the months with any spending.</summary>
    public long AverageMonthlyCents { get; set; }
    public long AverageTicketCents { get; set; }
}

public class MerchantMonthDto
{
    /// <summary>First day of the month (the user's local midnight).</summary>
    public DateTime MonthStart { get; set; }
    public long ExpenseCents { get; set; }
    public long IncomeCents { get; set; }
    public int Count { get; set; }
}

public class UpdateMerchantResultDto
{
    public MerchantDto Merchant { get; set; } = new();
    /// <summary>Transactions moved to the merchant's category.</summary>
    public int UpdatedTransactions { get; set; }
}

public class ResolveMerchantsRequest
{
    public List<string> Descriptions { get; set; } = [];
}

public class UpdateMerchantRequest
{
    public string Name { get; set; } = string.Empty;
    public MerchantKind Kind { get; set; }
    public Guid? CategoryId { get; set; }
    /// <summary>Also move the merchant's existing transactions to the category.</summary>
    public bool ApplyToTransactions { get; set; }
}
