using FinanceManager.Aplication.Classification;
using FinanceManager.Aplication.DTOs;
using FinanceManager.Domain.Entities;
using FinanceManager.Domain.Enuns;

namespace FinanceManager.Aplication.Analysis;

public static class TaxReportBuilder
{
    public static TaxReportDto Build(IReadOnlyList<Transaction> transactions, int year, ClassificationRules rules)
    {
        var moves = transactions.Where(t => t.Date.Year == year && !t.IsOwnMoney(rules)).ToList();
        var incomes = Parties(moves.Where(t => t.Type == TransactionType.INCOME), rules);
        var deductibles = moves
            .Where(t => t.Type == TransactionType.EXPENSE)
            .Select(t => (Tx: t, Label: rules.TaxDeductible($"{t.Category?.Name} {t.MerchantName(rules)} {t.Merchant?.Activity} {t.Description}")))
            .Where(d => d.Label != null)
            .GroupBy(d => d.Label!)
            .Select(g => new TaxDeductibleGroupDto
            {
                Label = g.Key,
                Cents = g.Sum(d => d.Tx.AmountCents),
                Providers = Parties(g.Select(d => d.Tx), rules),
            })
            .OrderByDescending(g => g.Cents)
            .ToList();

        return new TaxReportDto
        {
            Year = year,
            IncomeCents = incomes.Sum(i => i.Cents),
            ExpenseCents = moves.Where(t => t.Type == TransactionType.EXPENSE).Sum(t => t.AmountCents),
            DeductibleCents = deductibles.Sum(d => d.Cents),
            Incomes = incomes,
            Deductibles = deductibles,
        };
    }

    private static List<TaxPartyDto> Parties(IEnumerable<Transaction> transactions, ClassificationRules rules) =>
        transactions
            .GroupBy(t => t.MerchantKey(rules))
            .Select(g =>
            {
                var latest = g.MaxBy(t => t.Date)!;
                return new TaxPartyDto
                {
                    Name = latest.MerchantName(rules),
                    Document = g.Select(t => t.Merchant?.Document).FirstOrDefault(d => !string.IsNullOrWhiteSpace(d)),
                    Cents = g.Sum(t => t.AmountCents),
                    Count = g.Count(),
                };
            })
            .OrderByDescending(p => p.Cents)
            .ToList();
}
