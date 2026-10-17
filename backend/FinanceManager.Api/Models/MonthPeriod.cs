namespace FinanceManager.Api.Models;

/// <summary>
/// The month of a request. The web app sends the local first day of the chosen
/// month as <c>start</c> and, as <c>end</c>, the current instant (or the month's
/// end for a past month), so months follow the user's time zone; without them,
/// the current UTC month is used.
/// </summary>
public static class MonthPeriod
{
    public static (DateTime MonthStart, DateTime Now) Resolve(DateTime? start, DateTime? end)
    {
        var now = (end ?? DateTime.UtcNow).ToUniversalTime();
        var monthStart = start?.ToUniversalTime() ?? new DateTime(now.Year, now.Month, 1, 0, 0, 0, DateTimeKind.Utc);
        return (monthStart, now);
    }
}
