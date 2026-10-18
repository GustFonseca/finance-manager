namespace FinanceManager.Api.Models;

public static class MonthPeriod
{
    private const int MaxYears = 5;

    public static (DateTime MonthStart, DateTime Now) Resolve(DateTime? start, DateTime? end)
    {
        var utcNow = DateTime.UtcNow;
        var requested = end?.ToUniversalTime() ?? utcNow;
        var now = requested < utcNow ? requested : utcNow;
        var monthStart = start?.ToUniversalTime() ?? new DateTime(now.Year, now.Month, 1, 0, 0, 0, DateTimeKind.Utc);
        if (monthStart < now.AddYears(-MaxYears)) monthStart = now.AddYears(-MaxYears);
        return (monthStart, now);
    }
}
