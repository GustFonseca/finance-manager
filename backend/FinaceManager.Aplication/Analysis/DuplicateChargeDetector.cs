using FinanceManager.Aplication.Classification;
using FinanceManager.Aplication.DTOs;
using FinanceManager.Domain.Entities;
using FinanceManager.Domain.Enuns;

namespace FinanceManager.Aplication.Analysis;

public static class DuplicateChargeDetector
{
    public const int WindowDays = 3;
    public const int RefundWithinDays = 30;
    public const long MinCents = 3_000;
    public const string KeyPrefix = "DUPLICATE:";

    public static List<DuplicateChargeDto> Detect(
        IReadOnlyList<Transaction> transactions, DateTime monthStart, DateTime now, ClassificationRules rules, IReadOnlySet<string> dismissed)
    {
        var monthEnd = monthStart.AddMonths(1);
        var refunds = transactions
            .Where(t => t.Type == TransactionType.INCOME && !t.IsOwnMoney(rules))
            .Select(t => (Key: t.MerchantKey(rules), t.AmountCents, t.Date))
            .ToList();

        return transactions
            .Where(t => t.Type == TransactionType.EXPENSE && t.AmountCents >= MinCents && t.Date <= now
                        && t.Date >= monthStart.AddDays(-WindowDays) && t.Date < monthEnd
                        && !t.IsOwnMoney(rules) && InstallmentDetector.Parse(t) == null)
            .GroupBy(t => (Key: t.MerchantKey(rules), t.AmountCents))
            .SelectMany(g =>
            {
                var charges = g.OrderBy(t => t.Date).ToList();
                return charges.Skip(1).Select((second, i) => (First: charges[i], Second: second, g.Key.Key));
            })
            .Where(p => p.Second.Date >= monthStart
                        && (p.Second.Date - p.First.Date).TotalDays <= WindowDays
                        && !dismissed.Contains(KeyPrefix + p.Second.Id)
                        && !refunds.Any(r => r.Key == p.Key && r.AmountCents == p.Second.AmountCents
                                             && r.Date >= p.First.Date && r.Date <= p.First.Date.AddDays(RefundWithinDays)))
            .Select(p => new DuplicateChargeDto
            {
                Key = KeyPrefix + p.Second.Id,
                TransactionId = p.Second.Id,
                MerchantId = p.Second.MerchantId,
                Name = p.Second.MerchantName(rules),
                AmountCents = p.Second.AmountCents,
                FirstDate = p.First.Date,
                SecondDate = p.Second.Date,
            })
            .OrderByDescending(d => d.SecondDate)
            .ToList();
    }
}
