using FinanceManager.Domain.Entities;

namespace FinanceManager.Aplication.Analysis;

public static class AnalysisHistory
{
    public static int MonthsWithData(IEnumerable<Transaction> transactions, DateTime monthStart, int months)
    {
        var list = transactions as IReadOnlyCollection<Transaction> ?? transactions.ToList();
        return Enumerable.Range(1, months)
            .Count(i => list.Any(t => t.Date >= monthStart.AddMonths(-i) && t.Date < monthStart.AddMonths(1 - i)));
    }
}
