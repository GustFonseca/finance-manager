using FinanceManager.Aplication.Exceptions;
using FinanceManager.Domain.Entities;
using FinanceManager.Domain.Enuns;

namespace FinanceManager.Aplication.UseCases.Transactions;

public static class TransactionInput
{
    public const int MaxDescriptionLength = 500;

    public static void Validate(long amountCents, string description)
    {
        if (amountCents <= 0) throw new BusinessRuleException("O valor deve ser maior que zero.");
        if (description.Length > MaxDescriptionLength)
            throw new BusinessRuleException($"A descrição pode ter no máximo {MaxDescriptionLength} caracteres.");
    }

    public static void EnsureCategoryFits(Category category, TransactionType type)
    {
        var expected = type == TransactionType.INCOME ? CategoryType.INCOME : CategoryType.EXPENSE;
        if (category.Type != expected)
            throw new BusinessRuleException($"A categoria {category.Name} é de {(category.Type == CategoryType.INCOME ? "receita" : "despesa")}.");
    }

    public static DateTime ToUtc(DateTime date) => date.Kind switch
    {
        DateTimeKind.Utc => date,
        DateTimeKind.Local => date.ToUniversalTime(),
        _ => DateTime.SpecifyKind(date, DateTimeKind.Utc),
    };

    public static void ApplyToBalance(Account account, TransactionType type, long amountCents)
    {
        if (type == TransactionType.INCOME) account.AddBalance(amountCents);
        else account.SubtractBalance(amountCents);
    }
}
