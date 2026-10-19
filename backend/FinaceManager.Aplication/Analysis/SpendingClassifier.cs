using FinanceManager.Aplication.Classification;
using FinanceManager.Domain.Entities;
using FinanceManager.Domain.Enuns;

namespace FinanceManager.Aplication.Analysis;

public static class SpendingClassifier
{
    public static SpendingClass Classify(Transaction transaction, ClassificationRules rules) =>
        transaction.Merchant?.Class
        ?? Classify(
            $"{transaction.Merchant?.Name} {transaction.Description}",
            transaction.Merchant?.Activity,
            transaction.Category?.Name ?? string.Empty,
            rules);

    public static SpendingClass Classify(string description, string categoryName, ClassificationRules rules) =>
        Classify(description, null, categoryName, rules);

    public static SpendingClass Classify(string description, string? activity, string categoryName, ClassificationRules rules) =>
        ByText(description, rules)
        ?? (string.IsNullOrWhiteSpace(activity) ? null : ByText(activity, rules))
        ?? rules.CategoryClass(categoryName)
        ?? SpendingClass.VARIABLE;

    private static SpendingClass? ByText(string text, ClassificationRules rules) =>
        rules.IsBill(text) ? SpendingClass.ESSENTIAL
        : rules.IsSuperfluous(text) || rules.IsSubscription(text) ? SpendingClass.SUPERFLUOUS
        : rules.IsGrocery(text) ? SpendingClass.VARIABLE
        : null;
}
