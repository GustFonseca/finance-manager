using FinanceManager.Aplication.Classification;
using FinanceManager.Aplication.DTOs;
using FinanceManager.Domain.Entities;
using FinanceManager.Domain.Enuns;

namespace FinanceManager.Aplication.Analysis;

public static class RecurringExpenseDetector
{
    public const int LookbackMonths = 4;
    private const int ActiveWithinDays = 45;

    public static List<RecurringExpenseDto> Detect(IEnumerable<Transaction> transactions, DateTime now, ClassificationRules rules)
    {
        var since = now.AddMonths(-LookbackMonths);
        var expenses = transactions
            .Where(t => t.Type == TransactionType.EXPENSE && t.Date >= since && t.Date <= now && !t.IsOwnMoney(rules))
            .ToList();
        var result = new List<RecurringExpenseDto>();

        var marked = expenses
            .Where(t => t.Recurrence != Recurrence.NONE)
            .GroupBy(t => (Key: t.MerchantKey(rules), t.AccountId))
            .ToList();
        foreach (var group in marked)
        {
            var latest = group.MaxBy(t => t.Date)!;
            if ((now - latest.Date).TotalDays > ActiveWindowDays(latest.Recurrence)) continue;
            result.Add(ToDto(latest, MonthlyEquivalent(latest), detected: false, rules, latest.Recurrence));
        }
        var markedKeys = marked.Select(g => g.Key).ToHashSet();

        var candidates = expenses
            .Where(t => t.Recurrence == Recurrence.NONE && InstallmentDetector.Parse(t) == null)
            .GroupBy(t => (Key: t.MerchantKey(rules), t.AccountId))
            .Where(g => g.Key.Key.Length > 0 && !markedKeys.Contains(g.Key));
        foreach (var group in candidates)
        {
            var latest = group.MaxBy(t => t.Date)!;
            if ((now - latest.Date).TotalDays > ActiveWithinDays) continue;

            var rule = RuleFor($"{latest.MerchantName(rules)} {latest.Description}", rules);
            var usual = AvoidableSpendingAnalyzer.Median(group.Select(t => t.AmountCents).ToList());
            var similar = group.Where(t => Math.Abs(t.AmountCents - usual) <= usual * rule.Tolerance).ToList();
            var months = similar.Select(t => (t.Date.Year, t.Date.Month)).Distinct().Count();
            if (months < rule.MinMonths || similar.Count > months * 1.5) continue;

            result.Add(ToDto(latest, usual, detected: true, rules, Recurrence.MONTHLY));
        }

        return result.OrderByDescending(r => r.MonthlyCents).ToList();
    }

    public static double ActiveWindowDays(Recurrence period) => period switch
    {
        Recurrence.DAILY => 7,
        Recurrence.WEEKLY => 21,
        Recurrence.YEARLY => 400,
        _ => ActiveWithinDays,
    };

    private static RecurringExpenseDto ToDto(Transaction latest, long monthlyCents, bool detected, ClassificationRules rules, Recurrence period) => new()
    {
        Name = latest.MerchantName(rules),
        Key = latest.MerchantKey(rules),
        CategoryName = latest.Category?.Name ?? string.Empty,
        AccountId = latest.AccountId,
        AccountName = latest.Account?.Name ?? string.Empty,
        MonthlyCents = monthlyCents,
        LastDate = latest.Date,
        Kind = rules.IsSubscription($"{latest.MerchantName(rules)} {latest.Description}")
            ? RecurringKind.SUBSCRIPTION
            : RecurringKind.FIXED,
        Detected = detected,
        Period = period,
    };

    private record DetectionRule(double Tolerance, int MinMonths);

    private static readonly DetectionRule Subscription = new(0.15, 2);
    private static readonly DetectionRule Bill = new(0.35, 2);
    private static readonly DetectionRule Unknown = new(0.10, 3);

    private static DetectionRule RuleFor(string text, ClassificationRules rules) =>
        rules.IsSubscription(text) ? Subscription
        : rules.IsBill(text) ? Bill
        : Unknown;

    public static long MonthlyEquivalent(Transaction t) => t.Recurrence switch
    {
        Recurrence.DAILY => t.AmountCents * 30,
        Recurrence.WEEKLY => t.AmountCents * 52 / 12,
        Recurrence.YEARLY => t.AmountCents / 12,
        _ => t.AmountCents,
    };
}
