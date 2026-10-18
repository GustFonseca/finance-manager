using FinanceManager.Domain.Entities;

namespace FinanceManager.Aplication.Analysis;

/// <summary>The months before the current one that the analyses average over.</summary>
public static class AnalysisHistory
{
    /// <summary>
    /// How many of the <paramref name="months"/> before <paramref name="monthStart"/>
    /// have any transaction. Averages divide by this, not by the full window: a
    /// month never imported is missing data, not a month without spending.
    /// </summary>
    public static int MonthsWithData(IEnumerable<Transaction> transactions, DateTime monthStart, int months)
    {
        var list = transactions as IReadOnlyCollection<Transaction> ?? transactions.ToList();
        return Enumerable.Range(1, months)
            .Count(i => list.Any(t => t.Date >= monthStart.AddMonths(-i) && t.Date < monthStart.AddMonths(1 - i)));
    }
}
