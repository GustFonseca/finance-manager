using FinanceManager.Aplication.Classification;
using FinanceManager.Aplication.DTOs;
using FinanceManager.Domain.Entities;
using FinanceManager.Domain.Enuns;

namespace FinanceManager.Aplication.Analysis;

public static class DigestAnalyzer
{
    public const int WeekDays = 7;

    public static DigestDto Build(
        IReadOnlyList<Transaction> transactions, IReadOnlyList<Goal> goals, DateTime monthStart, DateTime now, DateTime dayStart, ClassificationRules rules)
    {
        var moves = transactions.Where(t => t.Date <= now && !t.IsOwnMoney(rules)).ToList();
        var weekStart = dayStart.AddDays(1 - WeekDays);
        var elapsed = now - monthStart;
        var previousMonth = monthStart.AddMonths(-1);
        return new DigestDto
        {
            Week = Period(moves, weekStart, now, weekStart.AddDays(-WeekDays), weekStart, rules),
            Month = Period(moves, monthStart, now, previousMonth, Min(previousMonth + elapsed, monthStart), rules),
            Goals = goals
                .Where(g => g.Status == GoalStatus.ACTIVE && g.TargetCents > 0)
                .Select(g => new GoalProgressDto
                {
                    Name = g.Name,
                    Percent = Math.Round(Math.Min(100, g.CurrentCents * 100.0 / g.TargetCents), 1),
                    MissingCents = Math.Max(0, g.TargetCents - g.CurrentCents),
                })
                .OrderByDescending(g => g.Percent)
                .ToList(),
        };
    }

    private static PeriodDigestDto Period(List<Transaction> moves, DateTime start, DateTime end, DateTime previousStart, DateTime previousEnd, ClassificationRules rules)
    {
        var current = moves.Where(t => t.Date >= start && t.Date <= end).ToList();
        var previous = moves.Where(t => t.Date >= previousStart && t.Date < previousEnd).ToList();
        var spent = Expenses(current).Sum(t => t.AmountCents);
        var previousSpent = Expenses(previous).Sum(t => t.AmountCents);
        var income = current.Where(t => t.Type == TransactionType.INCOME).Sum(t => t.AmountCents);
        var byMerchant = ByMerchant(current, rules);
        var before = ByMerchant(previous, rules);

        var top = byMerchant.Values.OrderByDescending(m => m.Cents).Select(m => new DigestMerchantDto { Name = m.Name, Cents = m.Cents }).FirstOrDefault();
        var increase = byMerchant
            .Select(m => new DigestMerchantDto { Name = m.Value.Name, Cents = m.Value.Cents, PreviousCents = before.GetValueOrDefault(m.Key).Cents })
            .Where(m => m.Cents > m.PreviousCents)
            .OrderByDescending(m => m.Cents - m.PreviousCents)
            .FirstOrDefault();

        return new PeriodDigestDto
        {
            Start = start,
            End = end,
            SpentCents = spent,
            PreviousSpentCents = previousSpent,
            ChangePercent = previousSpent > 0 ? Math.Round(((double)spent / previousSpent - 1) * 100, 1) : null,
            IncomeCents = income,
            SavedCents = income - spent,
            SuperfluousCents = Expenses(current).Where(t => SpendingClassifier.Classify(t, rules) == SpendingClass.SUPERFLUOUS).Sum(t => t.AmountCents),
            TopMerchant = top,
            TopIncrease = increase,
        };
    }

    private static DateTime Min(DateTime a, DateTime b) => a < b ? a : b;

    private static IEnumerable<Transaction> Expenses(IEnumerable<Transaction> moves) => moves.Where(t => t.Type == TransactionType.EXPENSE);

    private static Dictionary<string, (string Name, long Cents)> ByMerchant(IEnumerable<Transaction> moves, ClassificationRules rules) =>
        Expenses(moves)
            .GroupBy(t => t.MerchantKey(rules))
            .ToDictionary(g => g.Key, g => (g.MaxBy(t => t.Date)!.MerchantName(rules), g.Sum(t => t.AmountCents)));
}
