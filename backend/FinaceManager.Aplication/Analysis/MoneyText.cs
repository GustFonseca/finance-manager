using System.Globalization;
using System.Text;
using System.Text.RegularExpressions;

namespace FinanceManager.Aplication.Analysis;

/// <summary>Text helpers shared by the analyses and the activity history.</summary>
public static partial class MoneyText
{
    private static readonly CultureInfo PtBr = CultureInfo.GetCultureInfo("pt-BR");

    /// <summary>"R$ 1.234,56"; with <paramref name="signed"/>, "- R$ …" / "+ R$ …".</summary>
    public static string Format(long cents, bool signed = false)
    {
        var text = (Math.Abs(cents) / 100m).ToString("C", PtBr);
        if (!signed) return text;
        return cents < 0 ? $"- {text}" : $"+ {text}";
    }

    /// <summary>"2,5" — one optional decimal, pt-BR.</summary>
    public static string Decimal(double value) => value.ToString("0.#", PtBr);

    /// <summary>"25%" — pt-BR, whatever the server's culture.</summary>
    public static string Percent(double ratio) => ratio.ToString("P0", PtBr);

    /// <summary>Lower-case letters only, accents removed: "NETFLIX.COM *12" → "netflix com".</summary>
    public static string Key(string text)
    {
        var decomposed = text.Normalize(NormalizationForm.FormD);
        var letters = new StringBuilder(decomposed.Length);
        foreach (var c in decomposed)
        {
            if (CharUnicodeInfo.GetUnicodeCategory(c) == UnicodeCategory.NonSpacingMark) continue;
            letters.Append(char.IsLetter(c) ? char.ToLowerInvariant(c) : ' ');
        }
        return Spaces().Replace(letters.ToString(), " ").Trim();
    }

    [GeneratedRegex(@"\s+")]
    private static partial Regex Spaces();
}
