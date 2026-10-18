using FinanceManager.Aplication.Exceptions;
namespace FinanceManager.Aplication.UseCases.Folders;

public static class ItemNames
{
    private static readonly char[] Invalid = ['/', '\\', ':', '*', '?', '"', '<', '>', '|'];

    public static string Validate(string? name, int maxLength)
    {
        var trimmed = (name ?? string.Empty).Trim();
        if (trimmed.Length == 0)
            throw new BusinessRuleException("O nome não pode ficar em branco.");
        if (trimmed.Length > maxLength)
            throw new BusinessRuleException($"O nome pode ter no máximo {maxLength} caracteres.");
        if (trimmed.IndexOfAny(Invalid) >= 0)
            throw new BusinessRuleException("O nome não pode conter os caracteres \\ / : * ? \" < > |");
        return trimmed;
    }
}
