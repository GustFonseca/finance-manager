using FinanceManager.Aplication.Classification;
using FinanceManager.Domain.Entities;
using FinanceManager.Domain.Enuns;

namespace FinanceManager.Aplication.Analysis;

public static class YearlyCharges
{
    public const int GapDays = 300;

    public static bool IsYearly(IReadOnlyList<Transaction> chargesByDate) =>
        chargesByDate.Count > 0
        && (chargesByDate[^1].Recurrence == Recurrence.YEARLY
            || (chargesByDate.Count > 1 && (chargesByDate[^1].Date - chargesByDate[^2].Date).TotalDays >= GapDays));

    public static IReadOnlySet<string> Keys(IEnumerable<Transaction> expenses, ClassificationRules rules) =>
        expenses
            .GroupBy(t => t.MerchantKey(rules))
            .Where(g => IsYearly(g.OrderBy(t => t.Date).ToList()))
            .Select(g => g.Key)
            .ToHashSet();
}
