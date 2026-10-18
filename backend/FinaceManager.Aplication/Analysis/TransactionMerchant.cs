using FinanceManager.Domain.Entities;
using FinanceManager.Domain.Enuns;

namespace FinanceManager.Aplication.Analysis;

/// <summary>
/// The merchant of a transaction for the analyses: the catalogued one when
/// loaded, otherwise read from the description, so analyses group by place
/// ("iFood") and not by the bank's wording of each payment.
/// </summary>
public static class TransactionMerchant
{
    public static string MerchantKey(this Transaction t) =>
        t.Merchant?.Key ?? MerchantParser.Parse(t.Description)?.Key ?? MoneyText.Key(t.Description);

    public static string MerchantName(this Transaction t)
    {
        var name = t.Merchant?.Name ?? MerchantParser.Parse(t.Description)?.Name ?? t.Description;
        return string.IsNullOrWhiteSpace(name) ? "(sem descrição)" : name;
    }

    public static MerchantKind MerchantKind(this Transaction t) =>
        t.Merchant?.Kind ?? MerchantParser.Parse(t.Description)?.Kind ?? Domain.Enuns.MerchantKind.BUSINESS;

    /// <summary>
    /// The user's own money moving (investments, the card bill, their accounts
    /// elsewhere): neither income nor spending, so the analyses leave it out.
    /// </summary>
    public static bool IsOwnMoney(this Transaction t) => t.MerchantKind() == Domain.Enuns.MerchantKind.OWN;
}
