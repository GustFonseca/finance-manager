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

public class MerchantMatchDto
{
    public string Description { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public MerchantKind? Kind { get; set; }
    public Guid? MerchantId { get; set; }
    public Guid? CategoryId { get; set; }
    public string? SkipReason { get; set; }
}

public class MerchantSpendingReportDto
{
    public long TotalCents { get; set; }
    public int Count { get; set; }
    public List<MerchantSpendingDto> Merchants { get; set; } = [];
}

public class MerchantHistoryDto
{
    public MerchantDto Merchant { get; set; } = new();
    public List<MerchantMonthDto> Months { get; set; } = [];
    public long ExpenseCents { get; set; }
    public long IncomeCents { get; set; }
    public int Count { get; set; }
    public long AverageMonthlyCents { get; set; }
    public long AverageTicketCents { get; set; }
}

public class MerchantMonthDto
{
    public DateTime MonthStart { get; set; }
    public long ExpenseCents { get; set; }
    public long IncomeCents { get; set; }
    public int Count { get; set; }
}

public class UpdateMerchantResultDto
{
    public MerchantDto Merchant { get; set; } = new();
    public int UpdatedTransactions { get; set; }
}

public class ImportLineRequest
{
    public string Description { get; set; } = string.Empty;
    public TransactionType Type { get; set; }
}

public class ResolveMerchantsRequest
{
    public List<ImportLineRequest> Lines { get; set; } = [];
}

public class UpdateMerchantRequest
{
    public string Name { get; set; } = string.Empty;
    public MerchantKind Kind { get; set; }
    public Guid? CategoryId { get; set; }
    public bool ApplyToTransactions { get; set; }
}
