using FinanceManager.Aplication.Classification;
using FinanceManager.Aplication.DTOs;
using FinanceManager.Domain.Entities;
using FinanceManager.Domain.Enuns;

namespace FinanceManager.Aplication.Analysis;

public static class FeeAnalyzer
{
    public const int LookbackMonths = 12;

    public static FeesDto Analyze(IEnumerable<Transaction> transactions, DateTime monthStart, DateTime now, ClassificationRules rules)
    {
        var monthEnd = monthStart.AddMonths(1);
        var since = monthEnd.AddMonths(-LookbackMonths);
        var fees = transactions
            .Where(t => t.Type == TransactionType.EXPENSE && t.Date >= since && t.Date < monthEnd && t.Date <= now)
            .Select(t => (Tx: t, Label: rules.Fee($"{t.Description} {t.Category?.Name}")))
            .Where(f => f.Label != null)
            .ToList();

        var items = fees
            .GroupBy(f => f.Label!)
            .Select(g => new FeeItemDto
            {
                Label = g.Key,
                MonthCents = g.Where(f => f.Tx.Date >= monthStart).Sum(f => f.Tx.AmountCents),
                YearCents = g.Sum(f => f.Tx.AmountCents),
                Count = g.Count(),
                LastDate = g.Max(f => f.Tx.Date),
            })
            .OrderByDescending(i => i.YearCents)
            .ToList();

        return new FeesDto
        {
            MonthCents = items.Sum(i => i.MonthCents),
            YearCents = items.Sum(i => i.YearCents),
            Items = items,
        };
    }
}
