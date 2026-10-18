using FinanceManager.Aplication.Classification;
using FinanceManager.Domain.Entities;
using FinanceManager.Domain.Enuns;

namespace FinanceManager.Aplication.Analysis;

public static class SpendingClassifier
{
    public static SpendingClass Classify(Transaction transaction, ClassificationRules rules) =>
        transaction.Merchant?.Class
        ?? Classify($"{transaction.Merchant?.Name} {transaction.Merchant?.Activity} {transaction.Description}", transaction.Category?.Name ?? string.Empty, rules);

    public static SpendingClass Classify(string description, string categoryName, ClassificationRules rules)
    {
        if (rules.IsBill(description)) return SpendingClass.ESSENTIAL;
        if (rules.IsSuperfluous(description) || rules.IsSubscription(description)) return SpendingClass.SUPERFLUOUS;
        if (rules.IsGrocery(description)) return SpendingClass.VARIABLE;
        return rules.CategoryClass(categoryName) ?? SpendingClass.VARIABLE;
    }
}
