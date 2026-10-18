using FinanceManager.Aplication.Classification;
using FinanceManager.Aplication.DTOs;
using FinanceManager.Domain.Entities;
using FinanceManager.Domain.Enuns;

namespace FinanceManager.Aplication.Analysis;

public static class MerchantAnalyzer
{
    public static MerchantSpendingReportDto Report(IEnumerable<Transaction> transactions, ClassificationRules rules)
    {
        var expenses = transactions.Where(t => t.Type == TransactionType.EXPENSE && !t.IsOwnMoney(rules)).ToList();
        var total = expenses.Sum(t => t.AmountCents);

        return new MerchantSpendingReportDto
        {
            TotalCents = total,
            Count = expenses.Count,
            Merchants = expenses
                .GroupBy(t => t.MerchantKey(rules))
                .Select(g => Spending(g.ToList(), total, rules))
                .OrderByDescending(m => m.Cents)
                .ToList(),
        };
    }

    public static MerchantSpendingDto Spending(IReadOnlyList<Transaction> group, long periodTotal, ClassificationRules rules)
    {
        var latest = group.MaxBy(t => t.Date)!;
        var cents = group.Sum(t => t.AmountCents);
        return new MerchantSpendingDto
        {
            MerchantId = latest.MerchantId,
            Name = latest.MerchantName(rules),
            Kind = latest.MerchantKind(rules),
            CategoryName = latest.Category?.Name ?? string.Empty,
            Color = latest.Category?.Color ?? string.Empty,
            Count = group.Count,
            Cents = cents,
            Share = periodTotal > 0 ? (double)cents / periodTotal : 0,
            AverageTicketCents = cents / group.Count,
            LastDate = latest.Date,
            Class = SpendingClassifier.Classify(latest, rules),
        };
    }

    public static MerchantHistoryDto History(IReadOnlyList<Transaction> transactions, DateTime start, DateTime end)
    {
        var months = new List<MerchantMonthDto>();
        for (var month = start; month <= end; month = month.AddMonths(1))
        {
            var inMonth = transactions.Where(t => t.Date >= month && t.Date < month.AddMonths(1)).ToList();
            months.Add(new MerchantMonthDto
            {
                MonthStart = month,
                ExpenseCents = Sum(inMonth, TransactionType.EXPENSE),
                IncomeCents = Sum(inMonth, TransactionType.INCOME),
                Count = inMonth.Count,
            });
        }

        var expense = Sum(transactions, TransactionType.EXPENSE);
        var expenseCount = transactions.Count(t => t.Type == TransactionType.EXPENSE);
        var monthsWithSpending = months.Count(m => m.ExpenseCents > 0);
        return new MerchantHistoryDto
        {
            Months = months,
            ExpenseCents = expense,
            IncomeCents = Sum(transactions, TransactionType.INCOME),
            Count = transactions.Count,
            AverageMonthlyCents = monthsWithSpending > 0 ? expense / monthsWithSpending : 0,
            AverageTicketCents = expenseCount > 0 ? expense / expenseCount : 0,
        };
    }

    private static long Sum(IEnumerable<Transaction> transactions, TransactionType type) =>
        transactions.Where(t => t.Type == type).Sum(t => t.AmountCents);
}
