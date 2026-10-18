using FinanceManager.Aplication.DTOs;
using FinanceManager.Domain.Entities;
using FinanceManager.Domain.Enuns;

namespace FinanceManager.Aplication.Analysis;

/// <summary>
/// The spending dashboard: where this month's money went (by class, category and
/// merchant), how it compares with recent months, and which habits could be reduced.
/// </summary>
public static class SpendingAnalyzer
{
    /// <summary>Months shown in the trend, ending with the current one.</summary>
    public const int TrendMonths = 6;
    /// <summary>Full months before the current one used for averages and habits (those with data).</summary>
    public const int AverageMonths = 3;
    private const int TopMerchantCount = 8;
    private const int ReducibleCount = 6;
    /// <summary>Superfluous habits: suggest cutting them in half…</summary>
    private const double SuperfluousCut = 0.5;
    /// <summary>…variable ones (groceries, fuel): about 15% by shopping around.</summary>
    private const double VariableCut = 0.15;
    /// <summary>Habits smaller than this per month aren't worth a suggestion.</summary>
    private const long MinReducibleCents = 5_000;
    /// <summary>"Compare prices" only makes sense for a place visited often (groceries, fuel).</summary>
    private const double MinVariableTimesPerMonth = 2;

    private record Expense(Transaction Tx, SpendingClass Class, string Merchant);

    /// <param name="transactions">The last <see cref="TrendMonths"/> months up to <paramref name="now"/>.</param>
    /// <param name="monthStart">First day of the current month, at the user's local midnight.</param>
    public static SpendingAnalysisDto Analyze(IReadOnlyList<Transaction> transactions, DateTime monthStart, DateTime now)
    {
        var expenses = transactions
            .Where(t => t.Type == TransactionType.EXPENSE && t.Date <= now && !t.IsOwnMoney())
            .Select(ToExpense)
            .ToList();
        var current = InMonth(expenses, monthStart);
        var history = expenses.Where(e => e.Tx.Date >= monthStart.AddMonths(-AverageMonths) && e.Tx.Date < monthStart).ToList();
        var historyMonths = Math.Max(1, AnalysisHistory.MonthsWithData(history.Select(e => e.Tx), monthStart, AverageMonths));
        var monthTotal = current.Sum(e => e.Tx.AmountCents);
        double ShareOf(long cents) => monthTotal > 0 ? (double)cents / monthTotal : 0;

        var reducible = Reducible(history.Count > 0 ? history : current, history.Count > 0 ? historyMonths : 1);

        return new SpendingAnalysisDto
        {
            MonthExpenseCents = monthTotal,
            AverageExpenseCents = history.Sum(e => e.Tx.AmountCents) / historyMonths,
            ByClass = Enum.GetValues<SpendingClass>()
                .Select(c =>
                {
                    var cents = current.Where(e => e.Class == c).Sum(e => e.Tx.AmountCents);
                    return new SpendingClassTotalDto { Class = c, Cents = cents, Share = ShareOf(cents) };
                })
                .ToList(),
            ByCategory = current
                .GroupBy(e => e.Tx.CategoryId)
                .Select(g =>
                {
                    var cents = g.Sum(e => e.Tx.AmountCents);
                    var category = g.First().Tx.Category;
                    return new CategorySpendingDto
                    {
                        CategoryId = g.Key,
                        CategoryName = category?.Name ?? string.Empty,
                        Color = category?.Color ?? string.Empty,
                        Cents = cents,
                        Share = ShareOf(cents),
                        AverageCents = history.Where(e => e.Tx.CategoryId == g.Key).Sum(e => e.Tx.AmountCents) / historyMonths,
                        Class = g.GroupBy(e => e.Class).OrderByDescending(c => c.Sum(e => e.Tx.AmountCents)).First().Key,
                    };
                })
                .OrderByDescending(c => c.Cents)
                .ToList(),
            Months = Enumerable.Range(0, TrendMonths)
                .Select(i => monthStart.AddMonths(i - (TrendMonths - 1)))
                .Select(start =>
                {
                    var month = InMonth(expenses, start);
                    long Sum(SpendingClass c) => month.Where(e => e.Class == c).Sum(e => e.Tx.AmountCents);
                    return new MonthSpendingDto
                    {
                        MonthStart = start,
                        EssentialCents = Sum(SpendingClass.ESSENTIAL),
                        VariableCents = Sum(SpendingClass.VARIABLE),
                        SuperfluousCents = Sum(SpendingClass.SUPERFLUOUS),
                    };
                })
                .ToList(),
            TopMerchants = current
                .Where(e => e.Merchant.Length > 0)
                .GroupBy(e => e.Merchant)
                .Select(g => MerchantAnalyzer.Spending(g.Select(e => e.Tx).ToList(), monthTotal))
                .OrderByDescending(m => m.Cents)
                .Take(TopMerchantCount)
                .ToList(),
            Reducible = reducible,
            ReduciblePotentialCents = reducible.Sum(r => r.PotentialCents),
        };
    }

    private static Expense ToExpense(Transaction t) => new(t, SpendingClassifier.Classify(t), t.MerchantKey());

    /// <summary>The habits worth reducing in <paramref name="history"/>, as monthly averages over <paramref name="months"/>.</summary>
    public static List<ReducibleExpenseDto> Habits(IEnumerable<Transaction> history, int months) =>
        Reducible(
            history.Where(t => t.Type == TransactionType.EXPENSE && !t.IsOwnMoney()).Select(ToExpense).ToList(),
            Math.Max(1, months));

    /// <summary>
    /// Non-essential habits by merchant, as a monthly average over <paramref name="months"/>:
    /// subscriptions can be cancelled, superfluous habits halved, variable ones trimmed.
    /// </summary>
    private static List<ReducibleExpenseDto> Reducible(List<Expense> source, int months) =>
        source
            .Where(e => e.Class != SpendingClass.ESSENTIAL && e.Merchant.Length > 0)
            .GroupBy(e => e.Merchant)
            .Select(g =>
            {
                var latest = g.MaxBy(e => e.Tx.Date)!;
                var monthly = g.Sum(e => e.Tx.AmountCents) / months;
                var times = (double)g.Count() / months;
                var subscription = MerchantPatterns.Subscriptions().IsMatch(MoneyText.Key($"{latest.Tx.MerchantName()} {latest.Tx.Description}"));
                var potential = subscription ? monthly
                    : latest.Class == SpendingClass.SUPERFLUOUS ? (long)(monthly * SuperfluousCut)
                    : (long)(monthly * VariableCut);
                return new ReducibleExpenseDto
                {
                    MerchantId = latest.Tx.MerchantId,
                    Name = latest.Tx.MerchantName(),
                    CategoryId = latest.Tx.CategoryId,
                    Subscription = subscription,
                    Class = latest.Class,
                    TimesPerMonth = Math.Round(times, 1),
                    MonthlyCents = monthly,
                    PotentialCents = potential,
                    Detail = subscription
                        ? $"Assinatura de {MoneyText.Format(monthly)} por mês ({MoneyText.Format(monthly * 12)} por ano). Cancelar economiza o valor inteiro."
                        : latest.Class == SpendingClass.SUPERFLUOUS
                            ? $"{Times(times)} por mês, {MoneyText.Format(monthly)} no total. Cortar pela metade economiza {MoneyText.Format(potential)}."
                            : $"{Times(times)} por mês, {MoneyText.Format(monthly)} no total. Comparar preços e reduzir 15% economiza {MoneyText.Format(potential)}.",
                };
            })
            .Where(r => r.MonthlyCents >= MinReducibleCents)
            .Where(r => r.Subscription || r.Class == SpendingClass.SUPERFLUOUS || r.TimesPerMonth >= MinVariableTimesPerMonth)
            .OrderByDescending(r => r.PotentialCents)
            .Take(ReducibleCount)
            .ToList();

    private static List<Expense> InMonth(IEnumerable<Expense> expenses, DateTime start) =>
        expenses.Where(e => e.Tx.Date >= start && e.Tx.Date < start.AddMonths(1)).ToList();

    private static string Times(double times) => times < 1.05 ? "1 vez" : $"{MoneyText.Decimal(times)} vezes";
}
