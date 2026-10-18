namespace FinanceManager.Aplication.DTOs;

public enum BudgetLevel
{
    OK,
    WARNING,
    EXCEEDED,
}

public class DailyBudgetDto
{
    public bool IsCurrentMonth { get; set; }
    public int DaysLeft { get; set; }
    public long MonthlyGoalCents { get; set; }
    public long FreeToSpendCents { get; set; }
    public long TodayAllowanceCents { get; set; }
    public long SpentTodayCents { get; set; }
    public long LeftTodayCents { get; set; }
    public long HourValueCents { get; set; }
    public int WorkHoursPerMonth { get; set; }
    public List<BudgetStatusDto> Budgets { get; set; } = [];
}

public class BudgetStatusDto
{
    public Guid CategoryId { get; set; }
    public string CategoryName { get; set; } = string.Empty;
    public string Color { get; set; } = string.Empty;
    public long LimitCents { get; set; }
    public long SpentCents { get; set; }
    public double Percent { get; set; }
    public BudgetLevel Level { get; set; }
    public long PerDayLeftCents { get; set; }
}
