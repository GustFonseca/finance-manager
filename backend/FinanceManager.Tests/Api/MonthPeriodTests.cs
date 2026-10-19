using FinanceManager.Api.Models;
using FinanceManager.Aplication.Analysis;

namespace FinanceManager.Tests.Api;

public class MonthPeriodTests
{
    private static readonly DateTime LocalMonthStart = new(2026, 10, 1, 3, 0, 0, DateTimeKind.Utc);

    [Fact]
    public void Without_dates_it_is_the_current_month_until_the_end_of_today()
    {
        var before = DateTime.UtcNow;

        var (monthStart, now) = MonthPeriod.Resolve(null, null);

        Assert.Equal(new DateTime(now.Year, now.Month, 1, 0, 0, 0, DateTimeKind.Utc), monthStart);
        Assert.Equal(before.Date.AddDays(1).AddMilliseconds(-1), now);
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
    public void Todays_transactions_saved_at_local_noon_are_inside_the_period_in_the_morning()
    {
        var morning = new DateTime(2026, 10, 19, 11, 0, 0, DateTimeKind.Utc);
        var monthEnd = new DateTime(2026, 11, 1, 2, 59, 59, DateTimeKind.Utc);

        var (_, now) = MonthPeriod.Resolve(LocalMonthStart, monthEnd, morning);

        Assert.Equal(new DateTime(2026, 10, 20, 2, 59, 59, 999, DateTimeKind.Utc), now);
        Assert.True(new DateTime(2026, 10, 19, 15, 0, 0, DateTimeKind.Utc) <= now);
        Assert.False(new DateTime(2026, 10, 20, 15, 0, 0, DateTimeKind.Utc) <= now);
    }

    [Fact]
    public void Late_at_night_tomorrows_transactions_stay_outside()
    {
        var night = new DateTime(2026, 10, 20, 1, 30, 0, DateTimeKind.Utc);

        var (_, now) = MonthPeriod.Resolve(LocalMonthStart, null, night);

        Assert.Equal(new DateTime(2026, 10, 20, 2, 59, 59, 999, DateTimeKind.Utc), now);
    }

    [Fact]
    public void An_end_in_the_future_is_capped_at_the_end_of_today()
    {
        var utcNow = new DateTime(2026, 10, 19, 11, 0, 0, DateTimeKind.Utc);

        var (_, now) = MonthPeriod.Resolve(null, utcNow.AddYears(1), utcNow);

        Assert.Equal(new DateTime(2026, 10, 19, 23, 59, 59, 999, DateTimeKind.Utc), now);
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

    [Fact]
    public void The_day_start_defaults_to_the_local_midnight_and_never_passes_now()
    {
        var now = new DateTime(2026, 10, 20, 2, 59, 59, DateTimeKind.Utc);

        Assert.Equal(new DateTime(2026, 10, 19, 3, 0, 0, DateTimeKind.Utc), MonthPeriod.DayStart(LocalMonthStart, now, null));
        Assert.Equal(now, MonthPeriod.DayStart(LocalMonthStart, now, now.AddDays(2)));
        Assert.Equal(LocalMonthStart, MonthPeriod.DayStart(LocalMonthStart, now, LocalMonthStart));
    }
}

public class LocalDayTests
{
    [Theory]
    [InlineData("2026-10-01T03:00:00Z", "-03:00")]
    [InlineData("2026-09-30T22:00:00Z", "02:00")]
    [InlineData("2026-09-30T10:00:00Z", "14:00")]
    [InlineData("2026-10-01T12:00:00Z", "-12:00")]
    [InlineData("2026-10-01T00:00:00Z", "00:00")]
    [InlineData("2026-10-15T05:00:00Z", "-05:00")]
    public void The_offset_comes_from_the_local_first_day_of_the_month(string monthStart, string offset)
    {
        var start = DateTime.Parse(monthStart, null, System.Globalization.DateTimeStyles.AdjustToUniversal);

        Assert.Equal(TimeSpan.Parse(offset.TrimStart('-')) * (offset.StartsWith('-') ? -1 : 1), LocalDay.Offset(start));
    }

    [Fact]
    public void Days_are_aligned_to_the_local_midnight_of_the_month()
    {
        var monthStart = new DateTime(2026, 10, 1, 3, 0, 0, DateTimeKind.Utc);
        var lateNight = new DateTime(2026, 10, 31, 1, 0, 0, DateTimeKind.Utc);

        Assert.Equal(new DateTime(2026, 10, 30, 3, 0, 0, DateTimeKind.Utc), LocalDay.Start(monthStart, lateNight));
        Assert.Equal(new DateTime(2026, 10, 31, 3, 0, 0, DateTimeKind.Utc), LocalDay.Next(monthStart, lateNight));
        Assert.Equal(new DateTime(2026, 10, 31, 2, 59, 59, 999, DateTimeKind.Utc), LocalDay.EndOfDay(monthStart, lateNight));
    }
}
