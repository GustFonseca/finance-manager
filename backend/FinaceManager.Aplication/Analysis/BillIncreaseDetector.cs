using FinanceManager.Aplication.Classification;
using FinanceManager.Aplication.DTOs;
using FinanceManager.Domain.Entities;
using FinanceManager.Domain.Enuns;

namespace FinanceManager.Aplication.Analysis;

public static class BillIncreaseDetector
{
    public const int PreviousCharges = 6;
    public const int MinPreviousCharges = 2;
    public const double MinIncreasePercent = 10;
    public const long MinIncreaseCents = 500;
    public const string KeyPrefix = "BILL_INCREASE:";

    public static List<BillIncreaseDto> Detect(
        IReadOnlyList<Transaction> transactions, DateTime monthStart, DateTime now, ClassificationRules rules,
        decimal inflationPercent, IReadOnlySet<string> dismissed)
    {
        var monthEnd = monthStart.AddMonths(1);
        return transactions
            .Where(t => t.Type == TransactionType.EXPENSE && t.Date <= now && t.Date < monthEnd && !t.IsOwnMoney(rules))
            .Where(t =>
            {
                var text = $"{t.MerchantName(rules)} {t.Merchant?.Activity} {t.Description}";
                return (rules.IsBill(text) || t.Recurrence == Recurrence.MONTHLY) && !rules.IsSubscription(text);
            })
            .GroupBy(t => t.MerchantKey(rules))
            .Select(g =>
            {
                var latest = g.Where(t => t.Date >= monthStart).MaxBy(t => t.Date);
                if (latest == null) return null;
                var previous = g.Where(t => t.Date < monthStart).OrderByDescending(t => t.Date).Take(PreviousCharges)
                    .Select(t => t.AmountCents).ToList();
                if (previous.Count < MinPreviousCharges) return null;
                var usual = AvoidableSpendingAnalyzer.Median(previous);
                if (usual <= 0) return null;
                var increase = ((double)latest.AmountCents / usual - 1) * 100;
                var key = $"{KeyPrefix}{g.Key}:{monthStart:yyyy-MM}";
                return increase >= MinIncreasePercent && increase > (double)inflationPercent
                       && latest.AmountCents - usual >= MinIncreaseCents && !dismissed.Contains(key)
                    ? new BillIncreaseDto
                    {
                        Key = key,
                        MerchantId = latest.MerchantId,
                        Name = latest.MerchantName(rules),
                        PreviousCents = usual,
                        CurrentCents = latest.AmountCents,
                        IncreasePercent = Math.Round(increase, 1),
                        YearlyImpactCents = (latest.AmountCents - usual) * 12,
                    }
                    : null;
            })
            .Where(b => b != null)
            .Select(b => b!)
            .OrderByDescending(b => b.YearlyImpactCents)
            .ToList();
    }
}
