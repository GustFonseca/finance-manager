using FinanceManager.Aplication.Classification;
using FinanceManager.Aplication.DTOs;
using FinanceManager.Domain.Entities;
using FinanceManager.Domain.Enuns;

namespace FinanceManager.Aplication.Analysis;

public static class PlanningAnalyzer
{
    public const int DefaultEmergencyMonths = 6;
    public const int MaxEmergencyMonths = 24;
    public const int HistoryMonths = 3;
    public const int SeasonalLookbackMonths = 13;
    public const int NetWorthMonths = 12;

    public static EmergencyFundDto EmergencyFund(
        IReadOnlyList<Transaction> transactions, DateTime monthStart, ClassificationRules rules, int months, Goal? goal, long averageSavedCents)
    {
        var history = transactions
            .Where(t => t.Type == TransactionType.EXPENSE && t.Date >= monthStart.AddMonths(-HistoryMonths) && t.Date < monthStart && !t.IsOwnMoney(rules))
            .ToList();
        var dataMonths = AnalysisHistory.MonthsWithData(history, monthStart, HistoryMonths);
        var essential = dataMonths == 0
            ? 0
            : history.Where(t => SpendingClassifier.Classify(t, rules) != SpendingClass.SUPERFLUOUS).Sum(t => t.AmountCents) / dataMonths;
        var target = essential * months;
        var saved = goal?.CurrentCents ?? 0;
        var missing = Math.Max(0, target - saved);
        return new EmergencyFundDto
        {
            Months = months,
            MonthlyEssentialCents = essential,
            TargetCents = target,
            GoalId = goal?.Id,
            GoalName = goal?.Name,
            SavedCents = saved,
            Percent = target > 0 ? Math.Round(Math.Min(100, saved * 100.0 / target), 1) : 0,
            AverageSavedCents = averageSavedCents,
            MonthsToReach = missing == 0 ? 0 : averageSavedCents > 0 ? (int)Math.Ceiling((double)missing / averageSavedCents) : null,
        };
    }

    public static SeasonalExpensesDto Seasonal(IReadOnlyList<Transaction> transactions, DateTime monthStart, DateTime now, ClassificationRules rules)
    {
        var items = transactions
            .Where(t => t.Type == TransactionType.EXPENSE && t.Date <= now && t.Date >= monthStart.AddMonths(-SeasonalLookbackMonths) && !t.IsOwnMoney(rules))
            .Select(t => (Tx: t, Label: rules.Seasonal($"{t.MerchantName(rules)} {t.Description}") ?? (t.Recurrence == Recurrence.YEARLY ? t.MerchantName(rules) : null)))
            .Where(s => s.Label != null)
            .GroupBy(s => (s.Label, Key: s.Tx.MerchantKey(rules)))
            .Select(g =>
            {
                var last = g.MaxBy(s => s.Tx.Date).Tx;
                var next = last.Date.AddYears(1);
                var monthsLeft = Math.Max(1, (next.Year - monthStart.Year) * 12 + next.Month - monthStart.Month);
                return new SeasonalExpenseDto
                {
                    Label = g.Key.Label!,
                    Name = last.MerchantName(rules),
                    LastDate = last.Date,
                    LastCents = last.AmountCents,
                    NextDate = next,
                    MonthsLeft = monthsLeft,
                    MonthlyReserveCents = (long)Math.Ceiling((double)last.AmountCents / monthsLeft),
                };
            })
            .Where(s => s.NextDate > now)
            .OrderBy(s => s.NextDate)
            .ToList();
        return new SeasonalExpensesDto { Items = items, MonthlyReserveCents = items.Sum(i => i.MonthlyReserveCents) };
    }

    public static NetWorthDto NetWorth(IReadOnlyList<Account> accounts, IReadOnlyList<Debt> debts, IReadOnlyList<Transaction> transactions, DateTime monthStart)
    {
        var assets = accounts.Sum(a => a.BalanceCents);
        var owed = debts.Sum(d => d.BalanceCents);
        var history = Enumerable.Range(0, NetWorthMonths)
            .Select(i => monthStart.AddMonths(-i))
            .Select(month =>
            {
                var after = month.AddMonths(1);
                var later = transactions.Where(t => t.Date >= after)
                    .Sum(t => t.Type == TransactionType.INCOME ? t.AmountCents : -t.AmountCents);
                return new NetWorthPointDto { Month = month, AssetsCents = assets - later };
            })
            .OrderBy(p => p.Month)
            .ToList();
        return new NetWorthDto
        {
            AssetsCents = assets,
            DebtsCents = owed,
            NetCents = assets - owed,
            Accounts = accounts.OrderByDescending(a => a.BalanceCents).Select(a => new NetWorthAccountDto { Name = a.Name, BalanceCents = a.BalanceCents }).ToList(),
            History = history,
        };
    }
}
