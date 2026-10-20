using FinanceManager.Aplication.Classification;
using FinanceManager.Domain.Entities;
using FinanceManager.Domain.Enuns;

namespace FinanceManager.Aplication.Analysis;

public static class WorkValue
{
    public const int DefaultHoursPerMonth = 176;
    public const int MaxHoursPerMonth = 744;
    public const int IncomeMonths = 3;

    public static int Hours(SavingsPlan? plan) => plan?.WorkHoursPerMonth ?? DefaultHoursPerMonth;

    public static long HourCents(IEnumerable<Transaction> transactions, DateTime monthStart, int hoursPerMonth, ClassificationRules rules)
    {
        var monthly = Enumerable.Range(1, IncomeMonths)
            .Select(i => monthStart.AddMonths(-i))
            .Select(m => transactions
                .Where(t => t.Type == TransactionType.INCOME && t.Date >= m && t.Date < m.AddMonths(1) && !t.IsOwnMoney(rules))
                .Sum(t => t.AmountCents))
            .Where(total => total > 0)
            .ToList();
        if (monthly.Count == 0 || hoursPerMonth <= 0) return 0;
        return Stats.Median(monthly) / hoursPerMonth;
    }
}
