using System.Globalization;
using System.Text;
using System.Text.RegularExpressions;

namespace FinanceManager.Aplication.Analysis;

public static partial class MoneyText
{
    public static readonly CultureInfo PtBr = CultureInfo.GetCultureInfo("pt-BR");

    public static string Format(long cents, bool signed = false)
    {
        var text = (Math.Abs(cents) / 100m).ToString("C", PtBr);
        if (!signed) return text;
        return cents < 0 ? $"- {text}" : $"+ {text}";
    }

    public static string Decimal(double value) => value.ToString("0.#", PtBr);

    public static string Percent(double ratio) => ratio.ToString("P0", PtBr);

    public static string Key(string text) => Normalize(text, char.IsLetter);

    public static string Plain(string text) => Normalize(text, char.IsLetterOrDigit);

    private static string Normalize(string text, Func<char, bool> keep)
    {
        var decomposed = text.Normalize(NormalizationForm.FormD);
        var chars = new StringBuilder(decomposed.Length);
        foreach (var c in decomposed)
        {
            if (CharUnicodeInfo.GetUnicodeCategory(c) == UnicodeCategory.NonSpacingMark) continue;
            chars.Append(keep(c) ? char.ToLowerInvariant(c) : ' ');
        }
        return Spaces().Replace(chars.ToString(), " ").Trim();
    }

    [GeneratedRegex(@"\s+")]
    private static partial Regex Spaces();
}
