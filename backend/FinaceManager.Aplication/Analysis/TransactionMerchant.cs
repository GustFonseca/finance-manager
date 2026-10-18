using FinanceManager.Aplication.Classification;
using FinanceManager.Domain.Entities;
using FinanceManager.Domain.Enuns;

namespace FinanceManager.Aplication.Analysis;

public static class TransactionMerchant
{
    public static string MerchantKey(this Transaction t, ClassificationRules rules) =>
        t.Merchant?.Key ?? MerchantParser.Parse(t.Description, rules)?.Key ?? MoneyText.Key(t.Description);

    public static string MerchantName(this Transaction t, ClassificationRules rules)
    {
        var name = t.Merchant?.Name ?? MerchantParser.Parse(t.Description, rules)?.Name ?? t.Description;
        return string.IsNullOrWhiteSpace(name) ? "(sem descrição)" : name;
    }

    public static MerchantKind MerchantKind(this Transaction t, ClassificationRules rules) =>
        t.Merchant?.Kind ?? MerchantParser.Parse(t.Description, rules)?.Kind ?? Domain.Enuns.MerchantKind.BUSINESS;

    public static bool IsOwnMoney(this Transaction t, ClassificationRules rules) =>
        t.MerchantKind(rules) == Domain.Enuns.MerchantKind.OWN;
}
