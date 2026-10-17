using FinanceManager.Aplication.DTOs;
using FinanceManager.Domain.Entities;
using FinanceManager.Domain.Enuns;

namespace FinanceManager.Aplication.Analysis;

/// <summary>
/// Finds fixed costs and subscriptions: expenses marked as recurring, plus
/// charges that repeat once a month with a similar amount (imported statements
/// never carry a recurrence). Known subscriptions and bills need less evidence
/// than an unknown merchant, so a monthly dinner out isn't taken for a bill.
/// </summary>
public static class RecurringExpenseDetector
{
    /// <summary>How far back to look for repeated charges.</summary>
    public const int LookbackMonths = 4;
    /// <summary>A charge not seen for longer than this is considered cancelled.</summary>
    private const int ActiveWithinDays = 45;

    public static List<RecurringExpenseDto> Detect(IEnumerable<Transaction> transactions, DateTime now)
    {
        var since = now.AddMonths(-LookbackMonths);
        var expenses = transactions
            .Where(t => t.Type == TransactionType.EXPENSE && t.Date >= since && t.Date <= now)
            .ToList();
        var result = new List<RecurringExpenseDto>();

        // Marked by the user: trusted as is.
        var marked = expenses
            .Where(t => t.Recurrence != Recurrence.NONE)
            .GroupBy(t => (Key: MoneyText.Key(t.Description), t.AccountId))
            .ToList();
        foreach (var group in marked)
        {
            var latest = group.MaxBy(t => t.Date)!;
            result.Add(ToDto(latest, MonthlyEquivalent(latest), detected: false));
        }
        var markedKeys = marked.Select(g => g.Key).ToHashSet();

        // Detected: the same charge in different months, with a similar amount, still active.
        var candidates = expenses
            .Where(t => t.Recurrence == Recurrence.NONE)
            .GroupBy(t => (Key: MoneyText.Key(t.Description), t.AccountId))
            .Where(g => g.Key.Key.Length > 0 && !markedKeys.Contains(g.Key));
        foreach (var group in candidates)
        {
            var latest = group.MaxBy(t => t.Date)!;
            if ((now - latest.Date).TotalDays > ActiveWithinDays) continue;

            var rule = RuleFor(group.Key.Key);
            var usual = Median(group.Select(t => t.AmountCents));
            var similar = group.Where(t => Math.Abs(t.AmountCents - usual) <= usual * rule.Tolerance).ToList();
            var months = similar.Select(t => (t.Date.Year, t.Date.Month)).Distinct().Count();
            // Once a month, not a shop visited every week.
            if (months < rule.MinMonths || similar.Count > months * 1.5) continue;

            result.Add(ToDto(latest, usual, detected: true));
        }

        return result.OrderByDescending(r => r.MonthlyCents).ToList();
    }

    private static RecurringExpenseDto ToDto(Transaction latest, long monthlyCents, bool detected) => new()
    {
        Name = string.IsNullOrWhiteSpace(latest.Description) ? "(sem descrição)" : latest.Description,
        CategoryName = latest.Category?.Name ?? string.Empty,
        AccountId = latest.AccountId,
        AccountName = latest.Account?.Name ?? string.Empty,
        MonthlyCents = monthlyCents,
        LastDate = latest.Date,
        Kind = MerchantPatterns.Subscriptions().IsMatch(MoneyText.Key(latest.Description))
            ? RecurringKind.SUBSCRIPTION
            : RecurringKind.FIXED,
        Detected = detected,
    };

    /// <summary>How much a charge may vary, and for how many months it must repeat, to count as recurring.</summary>
    private record DetectionRule(double Tolerance, int MinMonths);

    /// <summary>Subscriptions keep their price.</summary>
    private static readonly DetectionRule Subscription = new(0.15, 2);
    /// <summary>Utility bills vary with use (energy, water…).</summary>
    private static readonly DetectionRule Bill = new(0.35, 2);
    /// <summary>Anything else needs a longer, steadier pattern.</summary>
    private static readonly DetectionRule Unknown = new(0.10, 3);

    private static DetectionRule RuleFor(string key) =>
        MerchantPatterns.Subscriptions().IsMatch(key) ? Subscription
        : MerchantPatterns.Bills().IsMatch(key) ? Bill
        : Unknown;

    private static long MonthlyEquivalent(Transaction t) => t.Recurrence switch
    {
        Recurrence.DAILY => t.AmountCents * 30,
        Recurrence.WEEKLY => t.AmountCents * 52 / 12,
        Recurrence.YEARLY => t.AmountCents / 12,
        _ => t.AmountCents,
    };

    private static long Median(IEnumerable<long> values)
    {
        var sorted = values.Order().ToList();
        return sorted[sorted.Count / 2];
    }
}
