using FinanceManager.Domain.Entities;
using FinanceManager.Domain.Enuns;

namespace FinanceManager.Aplication.Analysis;

/// <summary>
/// Decides whether an expense is essential, variable or superfluous: by the
/// merchant when it's recognizable (iFood is superfluous even if filed under
/// "Alimentação"), otherwise by its category.
/// </summary>
public static class SpendingClassifier
{
    private static readonly HashSet<string> EssentialCategories = ["moradia", "saude", "educacao"];
    private static readonly HashSet<string> SuperfluousCategories = ["lazer"];

    public static SpendingClass Classify(Transaction transaction) =>
        Classify(transaction.Description, transaction.Category?.Name ?? string.Empty);

    public static SpendingClass Classify(string description, string categoryName)
    {
        var merchant = MoneyText.Key(description);
        // Bills first: "Vivo Fibra" is a bill, not a subscription to cut.
        if (MerchantPatterns.Bills().IsMatch(merchant)) return SpendingClass.ESSENTIAL;
        if (MerchantPatterns.Superfluous().IsMatch(merchant) || MerchantPatterns.Subscriptions().IsMatch(merchant))
            return SpendingClass.SUPERFLUOUS;
        if (MerchantPatterns.Groceries().IsMatch(merchant)) return SpendingClass.VARIABLE;

        var category = MoneyText.Key(categoryName);
        if (EssentialCategories.Contains(category)) return SpendingClass.ESSENTIAL;
        if (SuperfluousCategories.Contains(category)) return SpendingClass.SUPERFLUOUS;
        return SpendingClass.VARIABLE;
    }
}
