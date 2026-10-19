using System.Text.RegularExpressions;

namespace FinanceManager.Aplication.Companies;

public static partial class Cnpj
{
    public static string? Digits(string? document)
    {
        if (document == null) return null;
        var chars = new string(document.Where(char.IsAsciiLetterOrDigit).Select(char.ToUpperInvariant).ToArray());
        return Normalized().IsMatch(chars) ? chars : null;
    }

    public static bool IsNumeric(string cnpj) => cnpj.All(char.IsAsciiDigit);

    [GeneratedRegex("^[0-9A-Z]{12}[0-9]{2}$")]
    private static partial Regex Normalized();
}
