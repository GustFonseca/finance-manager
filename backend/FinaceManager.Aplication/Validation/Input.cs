using System.Text.RegularExpressions;
using FinanceManager.Aplication.Exceptions;
using FinanceManager.Domain.Entities;

namespace FinanceManager.Aplication.Validation;

public static partial class Input
{
    public static string Name(string? name, int maxLength = EntityLimits.NameLength, string emptyMessage = "Informe o nome.") =>
        Text(name, maxLength, "O nome") ?? throw new BusinessRuleException(emptyMessage);

    public static string? Text(string? value, int maxLength, string label)
    {
        var text = Optional(value);
        if (text?.Length > maxLength) throw new BusinessRuleException($"{label} pode ter no máximo {maxLength} caracteres.");
        return text;
    }

    public static string? Optional(string? value) => string.IsNullOrWhiteSpace(value) ? null : value.Trim();

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
