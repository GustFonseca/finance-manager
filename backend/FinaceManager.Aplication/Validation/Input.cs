using System.Text.RegularExpressions;
using FinanceManager.Aplication.Exceptions;
using FinanceManager.Domain.Entities;

namespace FinanceManager.Aplication.Validation;

public static partial class Input
{
    public static string Name(string? name, int maxLength = EntityLimits.NameLength)
    {
        var trimmed = (name ?? string.Empty).Trim();
        if (trimmed.Length == 0) throw new BusinessRuleException("Informe o nome.");
        if (trimmed.Length > maxLength) throw new BusinessRuleException($"O nome pode ter no máximo {maxLength} caracteres.");
        return trimmed;
    }

    public static string Color(string? color)
    {
        var trimmed = (color ?? string.Empty).Trim();
        if (!HexColor().IsMatch(trimmed)) throw new BusinessRuleException("Cor inválida. Use o formato #RRGGBB.");
        return trimmed;
    }

    public static void Defined<TEnum>(TEnum value, string message) where TEnum : struct, Enum
    {
        if (!Enum.IsDefined(value)) throw new BusinessRuleException(message);
    }

    public static void Positive(long cents, string message)
    {
        if (cents <= 0) throw new BusinessRuleException(message);
    }

    [GeneratedRegex("^#[0-9A-Fa-f]{6}$")]
    private static partial Regex HexColor();
}
