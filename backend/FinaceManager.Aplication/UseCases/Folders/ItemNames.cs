using FinanceManager.Aplication.Validation;
using FinanceManager.Aplication.Exceptions;
namespace FinanceManager.Aplication.UseCases.Folders;

public static class ItemNames
{
    private static readonly char[] Invalid = ['/', '\\', ':', '*', '?', '"', '<', '>', '|'];

    public static string Validate(string? name, int maxLength)
    {
        var trimmed = Input.Name(name, maxLength, "O nome não pode ficar em branco.");
        if (trimmed.IndexOfAny(Invalid) >= 0)
            throw new BusinessRuleException("O nome não pode conter os caracteres \\ / : * ? \" < > |");
        return trimmed;
    }
}
