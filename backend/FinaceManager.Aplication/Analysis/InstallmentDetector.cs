using System.Text.RegularExpressions;
using FinanceManager.Aplication.Classification;
using FinanceManager.Aplication.DTOs;
using FinanceManager.Domain.Entities;
using FinanceManager.Domain.Enuns;

namespace FinanceManager.Aplication.Analysis;

public static partial class InstallmentDetector
{
    public const int ActiveWithinDays = 45;

    public sealed record Installment(Transaction Tx, int Number, int Total);

    public static Installment? Parse(Transaction transaction)
    {
        var match = Pattern().Match(transaction.Description ?? string.Empty);
        if (!match.Success) return null;
        var number = int.Parse(match.Groups["n"].Value);
        var total = int.Parse(match.Groups["total"].Value);
        if (match.Groups["bare"].Success && number == transaction.Date.Day && total == transaction.Date.Month) return null;
        return total >= 2 && number >= 1 && number <= total ? new Installment(transaction, number, total) : null;
    }

    public static InstallmentsDto Detect(IEnumerable<Transaction> transactions, DateTime now, ClassificationRules rules)
    {
        var items = transactions
            .Where(t => t.Type == TransactionType.EXPENSE && t.Date <= now)
            .Select(Parse)
            .Where(i => i != null)
            .Select(i => i!)
            .GroupBy(i => (Key: i.Tx.MerchantKey(rules), i.Total, i.Tx.AmountCents))
            .Select(g => (g.Key.Key, Latest: g.MaxBy(i => (i.Number, i.Tx.Date))!))
            .Where(g => g.Latest.Number < g.Latest.Total && (now - g.Latest.Tx.Date).TotalDays <= ActiveWithinDays)
            .Select(g => new InstallmentDto
            {
                MerchantId = g.Latest.Tx.MerchantId,
                Key = g.Key,
                Name = g.Latest.Tx.MerchantName(rules),
                AmountCents = g.Latest.Tx.AmountCents,
                Paid = g.Latest.Number,
                Total = g.Latest.Total,
                RemainingCents = g.Latest.Tx.AmountCents * (g.Latest.Total - g.Latest.Number),
                LastDate = g.Latest.Tx.Date,
                EndsOn = g.Latest.Tx.Date.AddMonths(g.Latest.Total - g.Latest.Number),
            })
            .OrderBy(i => i.EndsOn)
            .ThenBy(i => i.Name)
            .ToList();

        return new InstallmentsDto
        {
            MonthlyCents = items.Sum(i => i.AmountCents),
            RemainingCents = items.Sum(i => i.RemainingCents),
            Items = items,
        };
    }

    [GeneratedRegex(@"\bparc(?:ela)?\.?\s*(?<n>\d{1,3})\s*(?:/|de)\s*(?<total>\d{1,3})|\s(?<n>\d{1,2})\s+de\s+(?<total>\d{1,2})\s*$|\s(?<bare>(?<n>\d{1,2})/(?<total>\d{1,2}))\s*$", RegexOptions.IgnoreCase)]
    private static partial Regex Pattern();
}
