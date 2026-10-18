namespace FinanceManager.Aplication.DTOs;

public enum ForecastItemKind
{
    INCOME,
    BILL,
    INSTALLMENT,
}

public class CashFlowForecastDto
{
    public bool IsCurrentMonth { get; set; }
    public int RemainingDays { get; set; }
    public long IncomeSoFarCents { get; set; }
    public long ExpenseSoFarCents { get; set; }
    public long PendingIncomeCents { get; set; }
    public long PendingBillsCents { get; set; }
    public long VariableEstimateCents { get; set; }
    public long ProjectedIncomeCents { get; set; }
    public long ProjectedExpenseCents { get; set; }
    public long ProjectedBalanceCents { get; set; }
    public List<ForecastItemDto> Upcoming { get; set; } = [];
    public ForecastItemDto? NextIncome { get; set; }
    public InstallmentsDto Installments { get; set; } = new();
}

public class ForecastItemDto
{
    public ForecastItemKind Kind { get; set; }
    public string Name { get; set; } = string.Empty;
    public long AmountCents { get; set; }
    public DateTime ExpectedDate { get; set; }
}

public class InstallmentsDto
{
    public long MonthlyCents { get; set; }
    public long RemainingCents { get; set; }
    public List<InstallmentDto> Items { get; set; } = [];
}

public class InstallmentDto
{
    public Guid? MerchantId { get; set; }
    public string Key { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public long AmountCents { get; set; }
    public int Paid { get; set; }
    public int Total { get; set; }
    public long RemainingCents { get; set; }
    public DateTime LastDate { get; set; }
    public DateTime EndsOn { get; set; }
}
