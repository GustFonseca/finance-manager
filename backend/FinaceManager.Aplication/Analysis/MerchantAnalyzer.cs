using FinanceManager.Aplication.DTOs;
using FinanceManager.Domain.Entities;
using FinanceManager.Domain.Enuns;

namespace FinanceManager.Aplication.Analysis;

/// <summary>How much goes to each merchant: over a period, and one merchant month by month.</summary>
public static class MerchantAnalyzer
{
    /// <summary>Spending per merchant in the period, biggest first. Own money moving is left out.</summary>
    public static MerchantSpendingReportDto Report(IEnumerable<Transaction> transactions)
    {
        var expenses = transactions.Where(t => t.Type == TransactionType.EXPENSE && !t.IsOwnMoney()).ToList();
        var total = expenses.Sum(t => t.AmountCents);

        return new MerchantSpendingReportDto
        {
            TotalCents = total,
            Count = expenses.Count,
            Merchants = expenses
                .GroupBy(t => t.MerchantKey())
                .Select(g => Spending(g.ToList(), total))
                .OrderByDescending(m => m.Cents)
                .ToList(),
        };
    }

    /// <summary>One merchant's row: totals, ticket, and the category and class of its latest purchase.</summary>
    public static MerchantSpendingDto Spending(IReadOnlyList<Transaction> group, long periodTotal)
    {
        var latest = group.MaxBy(t => t.Date)!;
        var cents = group.Sum(t => t.AmountCents);
        return new MerchantSpendingDto
        {
            MerchantId = latest.MerchantId,
            Name = latest.MerchantName(),
            Kind = latest.MerchantKind(),
            CategoryName = latest.Category?.Name ?? string.Empty,
            Color = latest.Category?.Color ?? string.Empty,
            Count = group.Count,
            Cents = cents,
            Share = periodTotal > 0 ? (double)cents / periodTotal : 0,
            AverageTicketCents = cents / group.Count,
            LastDate = latest.Date,
            Class = SpendingClassifier.Classify(latest),
        };
    }

    /// <summary>
    /// Month by month from the month of <paramref name="start"/> (the user's local
    /// first day) up to <paramref name="end"/>. Averages use the months with spending.
    /// </summary>
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
