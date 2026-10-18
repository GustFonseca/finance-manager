namespace FinanceManager.Aplication.DTOs;

public class EmergencyFundDto
{
    public int Months { get; set; }
    public long MonthlyEssentialCents { get; set; }
    public long TargetCents { get; set; }
    public Guid? GoalId { get; set; }
    public string? GoalName { get; set; }
    public long SavedCents { get; set; }
    public double Percent { get; set; }
    public long AverageSavedCents { get; set; }
    public int? MonthsToReach { get; set; }
}

public class EmergencyFundRequest
{
    public int Months { get; set; }
    public Guid? GoalId { get; set; }
}

public class SeasonalExpensesDto
{
    public long MonthlyReserveCents { get; set; }
    public List<SeasonalExpenseDto> Items { get; set; } = [];
}

public class SeasonalExpenseDto
{
    public string Label { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public DateTime LastDate { get; set; }
    public long LastCents { get; set; }
    public DateTime NextDate { get; set; }
    public int MonthsLeft { get; set; }
    public long MonthlyReserveCents { get; set; }
}

public class NetWorthDto
{
    public long AssetsCents { get; set; }
    public long DebtsCents { get; set; }
    public long NetCents { get; set; }
    public List<NetWorthAccountDto> Accounts { get; set; } = [];
    public List<NetWorthPointDto> History { get; set; } = [];
}

public class NetWorthAccountDto
{
    public string Name { get; set; } = string.Empty;
    public long BalanceCents { get; set; }
}

public class NetWorthPointDto
{
    public DateTime Month { get; set; }
    public long AssetsCents { get; set; }
}
