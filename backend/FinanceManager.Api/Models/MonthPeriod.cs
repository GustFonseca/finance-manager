using FinanceManager.Aplication.Analysis;

namespace FinanceManager.Api.Models;

public static class MonthPeriod
{
    private const int MaxYears = 5;

    public static (DateTime MonthStart, DateTime Now) Resolve(DateTime? start, DateTime? end) =>
        Resolve(start, end, DateTime.UtcNow);

    public static (DateTime MonthStart, DateTime Now) Resolve(DateTime? start, DateTime? end, DateTime utcNow)
    {
        var requested = end?.ToUniversalTime();
        var reference = requested < utcNow ? requested.Value : utcNow;
        var monthStart = start?.ToUniversalTime() ?? new DateTime(reference.Year, reference.Month, 1, 0, 0, 0, DateTimeKind.Utc);
        var cutoff = LocalDay.EndOfDay(monthStart, utcNow);
        var now = requested < cutoff ? requested.Value : cutoff;
        if (monthStart < now.AddYears(-MaxYears)) monthStart = now.AddYears(-MaxYears);
        return (monthStart, now);
    }

    public static DateTime DayStart(DateTime monthStart, DateTime now, DateTime? dayStart)
    {
        var day = dayStart?.ToUniversalTime() ?? LocalDay.Start(monthStart, now);
        return day > now ? now : day;
    }
}
