namespace FinanceManager.Aplication.DTOs;

public class DebtDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public long BalanceCents { get; set; }
    public decimal MonthlyRatePercent { get; set; }
    public long MinimumPaymentCents { get; set; }
}

public class SaveDebtRequest
{
    public string Name { get; set; } = string.Empty;
    public long BalanceCents { get; set; }
    public decimal MonthlyRatePercent { get; set; }
    public long MinimumPaymentCents { get; set; }
}

public class DebtPlanDto
{
    public long MonthlyBudgetCents { get; set; }
    public long ExtraCents { get; set; }
    public DebtStrategyDto Avalanche { get; set; } = new();
    public DebtStrategyDto Snowball { get; set; } = new();
    public long InterestSavedWithAvalancheCents { get; set; }
}

public class DebtStrategyDto
{
    public bool Feasible { get; set; }
    public int Months { get; set; }
    public long TotalInterestCents { get; set; }
    public List<DebtPayoffDto> Order { get; set; } = [];
}

public class DebtPayoffDto
{
    public Guid DebtId { get; set; }
    public string Name { get; set; } = string.Empty;
    public int PaidOffInMonth { get; set; }
}
