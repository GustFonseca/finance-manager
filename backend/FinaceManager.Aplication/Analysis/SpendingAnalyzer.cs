using FinanceManager.Aplication.Classification;
using FinanceManager.Aplication.DTOs;
using FinanceManager.Domain.Entities;
using FinanceManager.Domain.Enuns;

namespace FinanceManager.Aplication.Analysis;

public static class SpendingAnalyzer
{
    public const int TrendMonths = 6;
    public const int AverageMonths = 3;
    private const int TopMerchantCount = 8;
    private const int ReducibleCount = 6;
    private const double SuperfluousCut = 0.5;
    private const double VariableCut = 0.15;
    private const long MinReducibleCents = 5_000;
    private const double MinVariableTimesPerMonth = 2;

    private record Expense(Transaction Tx, SpendingClass Class, string Merchant);

    public static SpendingAnalysisDto Analyze(IReadOnlyList<Transaction> transactions, DateTime monthStart, DateTime now, ClassificationRules rules)
    {
        var expenses = transactions
            .Where(t => t.Type == TransactionType.EXPENSE && t.Date <= now && !t.IsOwnMoney(rules))
            .Select(t => ToExpense(t, rules))
            .ToList();
        var current = InMonth(expenses, monthStart);
        var history = expenses.Where(e => e.Tx.Date >= monthStart.AddMonths(-AverageMonths) && e.Tx.Date < monthStart).ToList();
        var historyMonths = Math.Max(1, AnalysisHistory.MonthsWithData(history.Select(e => e.Tx), monthStart, AverageMonths));
        var monthTotal = current.Sum(e => e.Tx.AmountCents);
        double ShareOf(long cents) => monthTotal > 0 ? (double)cents / monthTotal : 0;

        var yearlyKeys = AvoidableSpendingAnalyzer.YearlyKeys(expenses.Select(e => e.Tx), rules);
        var reducible = Reducible(history.Count > 0 ? history : current, history.Count > 0 ? historyMonths : 1, rules, yearlyKeys);

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
                .Select(g => MerchantAnalyzer.Spending(g.Select(e => e.Tx).ToList(), monthTotal, rules))
                .OrderByDescending(m => m.Cents)
                .Take(TopMerchantCount)
                .ToList(),
            Reducible = reducible,
            ReduciblePotentialCents = reducible.Sum(r => r.PotentialCents),
        };
    }

    private static Expense ToExpense(Transaction t, ClassificationRules rules) => new(t, SpendingClassifier.Classify(t, rules), t.MerchantKey(rules));

    public static List<ReducibleExpenseDto> Habits(IEnumerable<Transaction> history, int months, ClassificationRules rules) =>
        Reducible(
            history.Where(t => t.Type == TransactionType.EXPENSE && !t.IsOwnMoney(rules)).Select(t => ToExpense(t, rules)).ToList(),
            Math.Max(1, months),
            rules,
            new HashSet<string>());

    private static List<ReducibleExpenseDto> Reducible(List<Expense> source, int months, ClassificationRules rules, IReadOnlySet<string> yearlyKeys) =>
        source
            .Where(e => e.Class != SpendingClass.ESSENTIAL && e.Merchant.Length > 0)
            .GroupBy(e => e.Merchant)
            .Select(g =>
            {
                var latest = g.MaxBy(e => e.Tx.Date)!;
                var subscription = rules.IsSubscription($"{latest.Tx.MerchantName(rules)} {latest.Tx.Description}");
                var yearly = subscription && yearlyKeys.Contains(g.Key);
                var monthly = yearly ? latest.Tx.AmountCents / 12 : g.Sum(e => e.Tx.AmountCents) / months;
                var times = yearly ? 1.0 / 12 : (double)g.Count() / months;
                var potential = subscription ? monthly
                    : latest.Class == SpendingClass.SUPERFLUOUS ? (long)(monthly * SuperfluousCut)
                    : (long)(monthly * VariableCut);
                return new ReducibleExpenseDto
                {
                    MerchantId = latest.Tx.MerchantId,
                    Name = latest.Tx.MerchantName(rules),
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
