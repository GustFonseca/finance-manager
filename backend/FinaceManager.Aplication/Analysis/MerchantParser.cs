using System.Globalization;
using System.Text.RegularExpressions;
using FinanceManager.Aplication.Classification;
using FinanceManager.Domain.Enuns;

namespace FinanceManager.Aplication.Analysis;

public record ParsedMerchant(string Name, string Key, MerchantKind Kind, string? Document);

public static partial class MerchantParser
{
    private const int MaxNameLength = 100;

    private static readonly HashSet<string> Particles = ["de", "da", "do", "das", "dos", "e", "em", "para", "com"];

    public static string KeyOf(string name) => MoneyText.Plain(name).Replace(" ", string.Empty);

    public static ParsedMerchant? Parse(string? description, ClassificationRules rules, string? ownerName = null)
    {
        var text = Spaces().Replace(description ?? string.Empty, " ").Trim();
        if (text.Length == 0) return null;

        var own = rules.OwnMoney(text);
        if (own != null) return new ParsedMerchant(own, KeyOf(own), MerchantKind.OWN, null);

        var (rawName, document, transfer) = Split(text);
        var name = Clean(rawName, rules);
        var plain = MoneyText.Plain(name);
        if (plain.Length == 0) return null;

        var brand = rules.Brand(name, rawName);
        if (brand != null) return new ParsedMerchant(brand, KeyOf(brand), MerchantKind.BUSINESS, document);

        if (IsOwner(plain, ownerName)) return new ParsedMerchant(name, KeyOf(name), MerchantKind.OWN, document);

        var kind = document != null && Cnpj().IsMatch(document) ? MerchantKind.BUSINESS
            : document != null ? MerchantKind.PERSON
            : transfer && LooksLikePerson(rawName, rules) ? MerchantKind.PERSON
            : MerchantKind.BUSINESS;
        return new ParsedMerchant(name, KeyOf(name), kind, document);
    }

    private static (string Name, string? Document, bool Transfer) Split(string text)
    {
        var bank = BankTransfer().Match(text);
        if (bank.Success) return (bank.Groups["name"].Value.Trim(), null, true);

        var parts = text.Split(" - ").Select(p => p.Trim()).Where(p => !InitiatedBy().IsMatch(p)).ToArray();
        var head = MoneyText.Key(parts[0]);
        if (parts.Length < 2 || !TransferOrPurchase().IsMatch(head)) return (text, null, false);

        var name = Parenthesis().Replace(parts[1], string.Empty);
        var document = parts.Length > 2 && Document().IsMatch(parts[2]) ? parts[2] : null;
        if (head.StartsWith("compra")) name = name.Split(',')[0];
        return (name, document, !head.StartsWith("compra"));
    }

    private static string Clean(string raw, ClassificationRules rules)
    {
        var name = rules.StripGatewayPrefix(raw);
        name = Installment().Replace(name, string.Empty);
        name = LeadingNumbers().Replace(name, string.Empty);
        name = name.Replace('*', ' ').Replace('_', ' ');
        string previous;
        do
        {
            previous = name;
            name = CorporateSuffix().Replace(name.Trim(' ', '.', ',', '-'), string.Empty);
        } while (name != previous);
        name = Spaces().Replace(name, " ").Trim(' ', '.', ',', '-');
        if (name.Length > MaxNameLength) name = name[..MaxNameLength].Trim();
        return IsShouting(name) ? TitleCase(name) : name;
    }

    private static bool IsShouting(string name) => name.Any(char.IsLetter) && !name.Any(char.IsLower);

    private static string TitleCase(string name) =>
        string.Join(' ', name.ToLower(CultureInfo.GetCultureInfo("pt-BR")).Split(' ').Select((word, i) =>
            i > 0 && Particles.Contains(word) ? word
            : word.Length == 0 ? word
            : char.ToUpper(word[0]) + word[1..]));

    private const int MinTruncatedLength = 3;

    private static bool IsOwner(string plainName, string? ownerName)
    {
        var owner = Significant(MoneyText.Plain(ownerName ?? string.Empty));
        if (owner.Length < 2) return false;
        var words = Significant(plainName);
        if (owner.All(words.Contains)) return true;
        if (words.Length < 2 || words[0] != owner[0]) return false;

        var next = 1;
        var strong = false;
        foreach (var word in words.Skip(1))
        {
            var match = Array.FindIndex(owner, next, o => SameWord(word, o));
            if (match < 0) return false;
            strong |= word.Length >= MinTruncatedLength;
            next = match + 1;
        }
        return strong;
    }

    private static string[] Significant(string plain) =>
        plain.Split(' ', StringSplitOptions.RemoveEmptyEntries).Where(w => !Particles.Contains(w)).ToArray();

    private static bool SameWord(string word, string ownerWord) =>
        word == ownerWord
        || (word.Length == 1 && ownerWord.StartsWith(word))
        || (word.Length >= MinTruncatedLength && ownerWord.StartsWith(word));

    private static bool LooksLikePerson(string name, ClassificationRules rules) =>
        MoneyText.Key(name).Split(' ', StringSplitOptions.RemoveEmptyEntries).Length >= 2
        && !name.Any(char.IsDigit)
        && !rules.HasBusinessWord(name);

    [GeneratedRegex(@"^(transferencia|pix|compra|pagamento|ted|doc)\b")]
    private static partial Regex TransferOrPurchase();

    [GeneratedRegex(@"^iniciada por:", RegexOptions.IgnoreCase)]
    private static partial Regex InitiatedBy();

    [GeneratedRegex(@"\s*\(.*\)\s*$")]
    private static partial Regex Parenthesis();

    [GeneratedRegex(@"^(?:pix transf\s+(?<name>.+?)\s?\d{2}/\d{2}|pix (?:enviado|recebido)\s*:\s*""?(?:cp\s*:\s*\d+\s*-\s*)?(?<name>[^""]+?)""?|sispag (?:pix|ted|doc)\s+(?<name>.+?))\s*$", RegexOptions.IgnoreCase)]
    private static partial Regex BankTransfer();

    [GeneratedRegex(@"^(?:[\d•*.\-/ ]{11,20}|[0-9A-Z]{2}\.?[0-9A-Z]{3}\.?[0-9A-Z]{3}/?[0-9A-Z]{4}-?\d{2})$")]
    private static partial Regex Document();

    [GeneratedRegex(@"^[0-9A-Z]{2}\.[0-9A-Z]{3}\.[0-9A-Z]{3}/[0-9A-Z]{4}-\d{2}$")]
    private static partial Regex Cnpj();

    [GeneratedRegex(@"\s*-?\s*parc(?:ela)?\.?\s*\d+\s*(?:/|de)\s*\d+\s*$|\s+\d{1,2}/\d{1,2}\s*$|\s+\d{1,2}\s+de\s+\d{1,2}\s*$", RegexOptions.IgnoreCase)]
    private static partial Regex Installment();

    [GeneratedRegex(@"^[\d.\-/]{6,}\s+")]
    private static partial Regex LeadingNumbers();

    [GeneratedRegex(@"(?<!\b(?:de|da|do|dos|das|e))\s+(ltda|s\s?\.?\s?a|me|epp|eireli|mei|cia|s/a)\.?$", RegexOptions.IgnoreCase)]
    private static partial Regex CorporateSuffix();

    [GeneratedRegex(@"\s+")]
    private static partial Regex Spaces();
}
