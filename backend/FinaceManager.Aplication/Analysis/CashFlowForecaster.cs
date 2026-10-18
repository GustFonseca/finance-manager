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
        var tomorrow = now.Date.AddDays(1);
        var remainingDays = tomorrow < monthEnd ? (int)(monthEnd - tomorrow).TotalDays : 0;

        var incomeSoFar = current.Where(t => t.Type == TransactionType.INCOME).Sum(t => t.AmountCents);
        var expenseSoFar = current.Where(t => t.Type == TransactionType.EXPENSE).Sum(t => t.AmountCents);
        var installments = InstallmentDetector.Detect(transactions, now, rules);

        var upcoming = new List<ForecastItemDto>();
        long variable = 0;
        if (remainingDays > 0)
        {
            upcoming.AddRange(PendingIncomes(history, chargedKeys, monthStart, tomorrow, rules));
            var recurring = RecurringExpenseDetector.Detect(transactions, now, rules);
            var bills = recurring.Where(r => !chargedKeys.Contains(r.Key)).ToList();
            upcoming.AddRange(bills.Select(b => Item(ForecastItemKind.BILL, b.Name, b.MonthlyCents, Expected(monthStart, b.LastDate.Day, tomorrow))));
            var recurringKeys = recurring.Select(r => r.Key).ToHashSet();
            upcoming.AddRange(installments.Items
                .Where(i => !recurringKeys.Contains(i.Key) && !chargedKeys.Contains(i.Key))
                .Select(i => Item(ForecastItemKind.INSTALLMENT, $"{i.Name} ({i.Paid + 1}/{i.Total})", i.AmountCents, Expected(monthStart, i.LastDate.Day, tomorrow))));
            variable = VariableEstimate(history, recurringKeys, monthStart, tomorrow, monthEnd, rules);
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
        List<Transaction> history, HashSet<string> chargedKeys, DateTime monthStart, DateTime tomorrow, ClassificationRules rules) =>
        history
            .Where(t => t.Type == TransactionType.INCOME)
            .GroupBy(t => t.MerchantKey(rules))
            .Where(g => g.Key.Length > 0 && !chargedKeys.Contains(g.Key))
            .Select(g => g.GroupBy(t => (t.Date.Year, t.Date.Month)).Select(m => m.ToList()).ToList())
            .Where(months => months.Count >= MinIncomeMonths)
            .Select(months => Item(
                ForecastItemKind.INCOME,
                months.SelectMany(m => m).MaxBy(t => t.Date)!.MerchantName(rules),
                AvoidableSpendingAnalyzer.Median(months.Select(m => m.Sum(t => t.AmountCents)).ToList()),
                Expected(monthStart, (int)AvoidableSpendingAnalyzer.Median(months.Select(m => (long)m.Min(t => t.Date.Day)).ToList()), tomorrow)));

    private static long VariableEstimate(
        List<Transaction> history, HashSet<string> fixedKeys, DateTime monthStart, DateTime from, DateTime monthEnd, ClassificationRules rules)
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
            .SelectMany(m => Enumerable.Range(0, DateTime.DaysInMonth(m.Year, m.Month)).Select(d => m.AddDays(d).DayOfWeek))
            .GroupBy(d => d)
            .ToDictionary(g => g.Key, g => g.Count());
        var perWeekday = expenses
            .GroupBy(t => t.Date.DayOfWeek)
            .ToDictionary(g => g.Key, g => g.Sum(t => t.AmountCents) / (double)daysByWeekday[g.Key]);

        double total = 0;
        for (var day = from; day < monthEnd; day = day.AddDays(1))
            total += perWeekday.GetValueOrDefault(day.DayOfWeek);
        return (long)Math.Round(total);
    }

    private static DateTime Expected(DateTime monthStart, int day, DateTime tomorrow)
    {
        var date = monthStart.AddDays(Math.Clamp(day, 1, DateTime.DaysInMonth(monthStart.Year, monthStart.Month)) - 1);
        return date < tomorrow ? tomorrow : date;
    }

    private static ForecastItemDto Item(ForecastItemKind kind, string name, long amount, DateTime date) =>
        new() { Kind = kind, Name = name, AmountCents = amount, ExpectedDate = date };
}
