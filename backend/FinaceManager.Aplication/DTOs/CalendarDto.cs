namespace FinanceManager.Aplication.DTOs;

public enum CalendarItemKind
{
    INCOME,
    EXPENSE,
    EXPECTED_INCOME,
    EXPECTED_BILL,
    EXPECTED_INSTALLMENT,
    SEASONAL,
}

public class CalendarDto
{
    public DateTime MonthStart { get; set; }
    public List<CalendarDayDto> Days { get; set; } = [];
}

public class CalendarDayDto
{
    public DateTime Date { get; set; }
    public long IncomeCents { get; set; }
    public long ExpenseCents { get; set; }
    public long ExpectedInCents { get; set; }
    public long ExpectedOutCents { get; set; }
    public List<CalendarItemDto> Items { get; set; } = [];
}

public class CalendarItemDto
{
    public CalendarItemKind Kind { get; set; }
    public string Name { get; set; } = string.Empty;
    public long AmountCents { get; set; }
}
