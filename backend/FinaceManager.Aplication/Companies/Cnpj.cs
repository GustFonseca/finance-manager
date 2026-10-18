namespace FinanceManager.Aplication.Companies;

public static class Cnpj
{
    public static string? Digits(string? document)
    {
        if (document == null) return null;
        var digits = new string(document.Where(char.IsDigit).ToArray());
        return digits.Length == 14 ? digits : null;
    }
}
