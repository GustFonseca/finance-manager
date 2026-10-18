using FinanceManager.Aplication.Classification;
using FinanceManager.Aplication.DTOs;
using FinanceManager.Domain.Entities;
using FinanceManager.Domain.Enuns;

namespace FinanceManager.Aplication.Analysis;

public static class CalendarBuilder
{
    public const int MaxItemsPerDay = 8;

    public static CalendarDto Build(IReadOnlyList<Transaction> transactions, DateTime monthStart, DateTime now, TimeSpan offset, ClassificationRules rules)
    {
        var monthEnd = monthStart.AddMonths(1);
        var items = new List<(DateTime Day, CalendarItemDto Item)>();
        DateTime DayOf(DateTime instant) => (instant + offset).Date;

        foreach (var t in transactions.Where(t => t.Date >= monthStart && t.Date < monthEnd && t.Date <= now && !t.IsOwnMoney(rules)))
            items.Add((DayOf(t.Date), new CalendarItemDto
            {
                Kind = t.Type == TransactionType.INCOME ? CalendarItemKind.INCOME : CalendarItemKind.EXPENSE,
                Name = t.MerchantName(rules),
                AmountCents = t.AmountCents,
            }));

        var forecast = CashFlowForecaster.Forecast(transactions, monthStart, now, rules);
        foreach (var expected in forecast.Upcoming)
            items.Add((expected.ExpectedDate.Date, new CalendarItemDto
            {
                Kind = expected.Kind switch
                {
                    ForecastItemKind.INCOME => CalendarItemKind.EXPECTED_INCOME,
                    ForecastItemKind.INSTALLMENT => CalendarItemKind.EXPECTED_INSTALLMENT,
                    _ => CalendarItemKind.EXPECTED_BILL,
                },
                Name = expected.Name,
                AmountCents = expected.AmountCents,
            }));

        foreach (var seasonal in PlanningAnalyzer.Seasonal(transactions, monthStart.AddYears(-1), monthStart, rules).Items
                     .Where(s => s.NextDate >= monthStart && s.NextDate < monthEnd && s.NextDate > now))
            items.Add((DayOf(seasonal.NextDate), new CalendarItemDto { Kind = CalendarItemKind.SEASONAL, Name = seasonal.Name, AmountCents = seasonal.LastCents }));

        var firstDay = DayOf(monthStart);
        var days = Enumerable.Range(0, DateTime.DaysInMonth(firstDay.Year, firstDay.Month))
            .Select(i => firstDay.AddDays(i))
            .Select(day =>
            {
                var today = items.Where(i => i.Day == day).Select(i => i.Item).ToList();
                return new CalendarDayDto
                {
                    Date = DateTime.SpecifyKind(day, DateTimeKind.Utc),
                    IncomeCents = today.Where(i => i.Kind == CalendarItemKind.INCOME).Sum(i => i.AmountCents),
                    ExpenseCents = today.Where(i => i.Kind == CalendarItemKind.EXPENSE).Sum(i => i.AmountCents),
                    ExpectedInCents = today.Where(i => i.Kind == CalendarItemKind.EXPECTED_INCOME).Sum(i => i.AmountCents),
                    ExpectedOutCents = today.Where(i => i.Kind is CalendarItemKind.EXPECTED_BILL or CalendarItemKind.EXPECTED_INSTALLMENT or CalendarItemKind.SEASONAL).Sum(i => i.AmountCents),
                    Items = today.OrderByDescending(i => i.AmountCents).Take(MaxItemsPerDay).ToList(),
                };
            })
            .ToList();
        return new CalendarDto { MonthStart = monthStart, Days = days };
    }
}
