using FinanceManager.Api.Models;

namespace FinanceManager.Tests.Api;

public class MonthPeriodTests
{
    [Fact]
    public void Without_dates_it_is_the_current_month_until_now()
    {
        var before = DateTime.UtcNow;

        var (monthStart, now) = MonthPeriod.Resolve(null, null);

        Assert.InRange(now, before, DateTime.UtcNow);
        Assert.Equal(new DateTime(now.Year, now.Month, 1, 0, 0, 0, DateTimeKind.Utc), monthStart);
        Assert.Equal(DateTimeKind.Utc, monthStart.Kind);
    }

    [Fact]
    public void A_past_period_is_kept_as_requested()
    {
        var start = new DateTime(2025, 3, 1, 3, 0, 0, DateTimeKind.Utc);
        var end = new DateTime(2025, 3, 31, 23, 0, 0, DateTimeKind.Utc);

        Assert.Equal((start, end), MonthPeriod.Resolve(start, end));
    }

    [Fact]
    public void An_end_in_the_future_is_capped_at_now()
    {
        var before = DateTime.UtcNow;

        var (_, now) = MonthPeriod.Resolve(null, DateTime.UtcNow.AddYears(1));

        Assert.InRange(now, before, DateTime.UtcNow);
    }

    [Fact]
    public void The_month_start_of_a_past_end_is_derived_from_it()
    {
        var end = new DateTime(2025, 7, 20, 12, 0, 0, DateTimeKind.Utc);

        var (monthStart, _) = MonthPeriod.Resolve(null, end);

        Assert.Equal(new DateTime(2025, 7, 1, 0, 0, 0, DateTimeKind.Utc), monthStart);
    }

    [Fact]
    public void A_start_more_than_five_years_back_is_clamped()
    {
        var end = new DateTime(2025, 7, 20, 12, 0, 0, DateTimeKind.Utc);

        var (monthStart, _) = MonthPeriod.Resolve(new DateTime(2000, 1, 1, 0, 0, 0, DateTimeKind.Utc), end);

        Assert.Equal(end.AddYears(-5), monthStart);
    }

    [Fact]
    public void Local_dates_are_converted_to_utc()
    {
        var start = new DateTime(2025, 3, 1, 0, 0, 0, DateTimeKind.Local);
        var end = new DateTime(2025, 3, 31, 23, 0, 0, DateTimeKind.Local);

        var (monthStart, now) = MonthPeriod.Resolve(start, end);

        Assert.Equal((start.ToUniversalTime(), end.ToUniversalTime()), (monthStart, now));
    }
}
