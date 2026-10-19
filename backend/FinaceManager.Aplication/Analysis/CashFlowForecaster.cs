using FinanceManager.Aplication.Classification;
using FinanceManager.Aplication.DTOs;
using FinanceManager.Domain.Entities;
using FinanceManager.Domain.Enuns;

namespace FinanceManager.Aplication.Analysis;

public static class CashFlowForecaster
{
    public const int HistoryMonths = 3;
    public const int MinIncomeMonths = 2;

    public static CashFlowForecastDto Forecast(IReadOnlyList<Transaction> transactions, DateTime monthStart, DateTime now, ClassificationRules rules)
    {
        var monthEnd = monthStart.AddMonths(1);
        var moves = transactions.Where(t => t.Date <= now && !t.IsOwnMoney(rules)).ToList();
        var current = moves.Where(t => t.Date >= monthStart && t.Date < monthEnd).ToList();
        var history = moves.Where(t => t.Date >= monthStart.AddMonths(-HistoryMonths) && t.Date < monthStart).ToList();
        var chargedKeys = current.Select(t => t.MerchantKey(rules)).ToHashSet();
        var tomorrow = LocalDay.Next(monthStart, now);
        var remainingDays = tomorrow < monthEnd ? (int)Math.Round((monthEnd - tomorrow).TotalDays) : 0;
        var offset = LocalDay.Offset(monthStart);

        var incomeSoFar = current.Where(t => t.Type == TransactionType.INCOME).Sum(t => t.AmountCents);
        var expenseSoFar = current.Where(t => t.Type == TransactionType.EXPENSE).Sum(t => t.AmountCents);
        var installments = InstallmentDetector.Detect(transactions, now, rules);

        var upcoming = new List<ForecastItemDto>();
        long variable = 0;
        if (remainingDays > 0)
        {
            upcoming.AddRange(PendingIncomes(history, current, monthStart, tomorrow, offset, rules));
            var recurring = RecurringExpenseDetector.Detect(transactions, now, rules);
            upcoming.AddRange(PendingBills(recurring.Where(r => r.Period != Recurrence.YEARLY).ToList(), current, chargedKeys, monthStart, tomorrow, offset, rules));
            var recurringKeys = recurring.Select(r => r.Key).ToHashSet();
            upcoming.AddRange(installments.Items
                .Where(i => !recurringKeys.Contains(i.Key) && !chargedKeys.Contains(i.Key))
                .Select(i => Item(ForecastItemKind.INSTALLMENT, $"{i.Name} ({i.Paid + 1}/{i.Total})", i.AmountCents, Expected(monthStart, LocalDayOfMonth(i.LastDate, offset), tomorrow))));
            variable = VariableEstimate(history, recurringKeys, monthStart, tomorrow, remainingDays, offset, rules);
        }

        upcoming = upcoming.OrderBy(i => i.ExpectedDate).ThenByDescending(i => i.AmountCents).ToList();
        var pendingIncome = upcoming.Where(i => i.Kind == ForecastItemKind.INCOME).Sum(i => i.AmountCents);
        var pendingBills = upcoming.Where(i => i.Kind != ForecastItemKind.INCOME).Sum(i => i.AmountCents);
        var projectedIncome = incomeSoFar + pendingIncome;
        var projectedExpense = expenseSoFar + pendingBills + variable;

        return new CashFlowForecastDto
        {
            IsCurrentMonth = remainingDays > 0,
            RemainingDays = remainingDays,
            IncomeSoFarCents = incomeSoFar,
            ExpenseSoFarCents = expenseSoFar,
            PendingIncomeCents = pendingIncome,
            PendingBillsCents = pendingBills,
            VariableEstimateCents = variable,
            ProjectedIncomeCents = projectedIncome,
            ProjectedExpenseCents = projectedExpense,
            ProjectedBalanceCents = projectedIncome - projectedExpense,
            Upcoming = upcoming,
            NextIncome = upcoming.FirstOrDefault(i => i.Kind == ForecastItemKind.INCOME),
            Installments = installments,
        };
    }

    private static IEnumerable<ForecastItemDto> PendingIncomes(
        List<Transaction> history, List<Transaction> current, DateTime monthStart, DateTime tomorrow, TimeSpan offset, ClassificationRules rules)
    {
        var received = current
            .Where(t => t.Type == TransactionType.INCOME)
            .GroupBy(t => t.MerchantKey(rules))
            .ToDictionary(g => g.Key, g => g.Sum(t => t.AmountCents));
        return history
            .Where(t => t.Type == TransactionType.INCOME)
            .GroupBy(t => t.MerchantKey(rules))
            .Where(g => g.Key.Length > 0)
            .Select(g => (g.Key, Months: g.GroupBy(t => (t.Date.Year, t.Date.Month)).Select(m => m.ToList()).ToList()))
            .Where(p => p.Months.Count >= MinIncomeMonths)
            .Select(p => (
                Payer: p,
                Pending: Math.Max(0, AvoidableSpendingAnalyzer.Median(p.Months.Select(m => m.Sum(t => t.AmountCents)).ToList()) - received.GetValueOrDefault(p.Key))))
            .Where(p => p.Pending > 0)
            .Select(p => Item(
                ForecastItemKind.INCOME,
                p.Payer.Months.SelectMany(m => m).MaxBy(t => t.Date)!.MerchantName(rules),
                p.Pending,
                Expected(monthStart, (int)AvoidableSpendingAnalyzer.Median(p.Payer.Months.Select(m => (long)m.Min(t => LocalDayOfMonth(t.Date, offset))).ToList()), tomorrow)));
    }

    private static IEnumerable<ForecastItemDto> PendingBills(
        List<RecurringExpenseDto> recurring, List<Transaction> current, HashSet<string> chargedKeys,
        DateTime monthStart, DateTime tomorrow, TimeSpan offset, ClassificationRules rules)
    {
        var charged = current
            .Where(t => t.Type == TransactionType.EXPENSE)
            .GroupBy(t => t.MerchantKey(rules))
            .ToDictionary(g => g.Key, g => g.Sum(t => t.AmountCents));
        foreach (var bill in recurring)
        {
            if (bill.Period is Recurrence.DAILY or Recurrence.WEEKLY)
            {
                var pending = Math.Max(0, bill.MonthlyCents - charged.GetValueOrDefault(bill.Key));
                if (pending == 0) continue;
                var next = LocalDay.Start(monthStart, bill.LastDate).AddDays(bill.Period == Recurrence.DAILY ? 1 : 7);
                yield return Item(ForecastItemKind.BILL, bill.Name, pending, next < tomorrow ? tomorrow : next);
                continue;
            }
            if (chargedKeys.Contains(bill.Key)) continue;
            yield return Item(ForecastItemKind.BILL, bill.Name, bill.MonthlyCents, Expected(monthStart, LocalDayOfMonth(bill.LastDate, offset), tomorrow));
        }
    }

    private static long VariableEstimate(
        List<Transaction> history, HashSet<string> fixedKeys, DateTime monthStart, DateTime from, int days, TimeSpan offset, ClassificationRules rules)
    {
        var months = Enumerable.Range(1, HistoryMonths)
            .Select(i => monthStart.AddMonths(-i))
            .Where(m => history.Any(t => t.Date >= m && t.Date < m.AddMonths(1)))
            .ToList();
        if (months.Count == 0) return 0;

        var expenses = history
            .Where(t => t.Type == TransactionType.EXPENSE && !fixedKeys.Contains(t.MerchantKey(rules)) && InstallmentDetector.Parse(t) == null)
            .Where(t => months.Any(m => t.Date >= m && t.Date < m.AddMonths(1)))
            .ToList();
        var daysByWeekday = months
            .SelectMany(m => Enumerable.Range(0, (int)Math.Round((m.AddMonths(1) - m).TotalDays)).Select(d => (m.AddDays(d) + offset).DayOfWeek))
            .GroupBy(d => d)
            .ToDictionary(g => g.Key, g => g.Count());
        var perWeekday = expenses
            .GroupBy(t => (t.Date + offset).DayOfWeek)
            .ToDictionary(g => g.Key, g => g.Sum(t => t.AmountCents) / (double)daysByWeekday[g.Key]);

        double total = 0;
        for (var i = 0; i < days; i++)
            total += perWeekday.GetValueOrDefault((from.AddDays(i) + offset).DayOfWeek);
        return (long)Math.Round(total);
    }

    private static int LocalDayOfMonth(DateTime instant, TimeSpan offset) => (instant + offset).Day;

    private static DateTime Expected(DateTime monthStart, int day, DateTime tomorrow)
    {
        var local = monthStart + LocalDay.Offset(monthStart);
        var date = monthStart.AddDays(Math.Clamp(day, 1, DateTime.DaysInMonth(local.Year, local.Month)) - 1);
        return date < tomorrow ? tomorrow : date;
    }

    private static ForecastItemDto Item(ForecastItemKind kind, string name, long amount, DateTime date) =>
        new() { Kind = kind, Name = name, AmountCents = amount, ExpectedDate = date };
}
