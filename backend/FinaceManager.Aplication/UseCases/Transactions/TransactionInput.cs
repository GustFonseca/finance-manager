using FinanceManager.Aplication.Ownership;
using FinanceManager.Aplication.Exceptions;
using FinanceManager.Aplication.Validation;
using FinanceManager.Domain.Entities;
using FinanceManager.Domain.Enuns;
using FinanceManager.Domain.Interfaces.Repositories;

namespace FinanceManager.Aplication.UseCases.Transactions;

public static class TransactionInput
{
    public const int MaxDescriptionLength = EntityLimits.DescriptionLength;

    public static string Validate(long amountCents, string? description, TransactionType type, Recurrence recurrence = Recurrence.NONE)
    {
        Input.Positive(amountCents, "O valor deve ser maior que zero.");
        Input.Defined(type, "Tipo de transação inválido.");
        Input.Defined(recurrence, "Recorrência inválida.");
        var text = description ?? string.Empty;
        if (text.Length > MaxDescriptionLength)
            throw new BusinessRuleException($"A descrição pode ter no máximo {MaxDescriptionLength} caracteres.");
        return text;
    }

    public static async Task<(Account Account, Category Category)> LoadReferencesAsync(
        IAccountRepository accountRepository,
        ICategoryRepository categoryRepository,
        Guid userId,
        Guid accountId,
        Guid categoryId,
        TransactionType type)
    {
        var account = await accountRepository.FindOwnedAsync(accountId, userId)
            ?? throw new BusinessRuleException("Conta não encontrada.");
        var category = await categoryRepository.FindOwnedAsync(categoryId, userId)
            ?? throw new BusinessRuleException("Categoria não encontrada.");
        EnsureCategoryFits(category, type);
        return (account, category);
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
}
