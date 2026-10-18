using System.Globalization;
using System.Text.RegularExpressions;
using FinanceManager.Domain.Enuns;

namespace FinanceManager.Aplication.Analysis;

/// <summary>A merchant read from a description.</summary>
public record ParsedMerchant(string Name, string Key, MerchantKind Kind, string? Document);

/// <summary>
/// Reads who is on the other side of a transaction from the bank's description.
/// "Transferência enviada pelo Pix - IFOOD.COM AGENCIA DE RESTAURANTES ONLINE S.A. -
/// 14.380.200/0001-21 - ADYEN…" and "Compra no débito via NuPay - iFood" are both
/// "iFood"; the bank, branch and account that follow the name are dropped.
/// </summary>
public static partial class MerchantParser
{
    private const int MaxNameLength = 100;

    /// <summary>The user's own money moving around, by normalized description.</summary>
    private static readonly (Regex Pattern, string Name)[] OwnMovements =
    [
        (new Regex(@"valor adicionado na conta por cartao de credito"), "Crédito do cartão (Pix no crédito)"),
        (new Regex(@"pagamento de fatura|pagamento recebido"), "Fatura do cartão"),
        (new Regex(@"aplicacao rdb|resgate rdb|nuinvest|caixinha|dinheiro guardado|guardar dinheiro|aplicacao|resgate cdb|tesouro direto"), "Investimentos"),
        // Borrowed money coming in is not income.
        (new Regex(@"(deposito|resgate) de emprestimo"), "Empréstimo recebido"),
    ];

    /// <summary>Well-known brands, whatever legal name or payment gateway the bank shows.</summary>
    private static readonly (Regex Pattern, string Name)[] Brands =
    [
        (new Regex(@"\bifood\b|^ifd\b"), "iFood"),
        (new Regex(@"\buber\b"), "Uber"),
        (new Regex(@"^99\b|\b99 ?app\b|\b99 tecnologia\b|\b99 pop\b"), "99"),
        (new Regex(@"\brappi\b"), "Rappi"),
        (new Regex(@"\bshpp\b|\bshopee\b"), "Shopee"),
        (new Regex(@"mercado ?livre|mercadolivre"), "Mercado Livre"),
        (new Regex(@"mercado ?pago|^pix marketplace$|^mp\b"), "Mercado Pago"),
        (new Regex(@"\bamazon\b|\bamzn\b"), "Amazon"),
        (new Regex(@"\bnetflix\b"), "Netflix"),
        (new Regex(@"\bspotify\b"), "Spotify"),
        (new Regex(@"\bdisney\b"), "Disney+"),
        (new Regex(@"\bapple\b|\bitunes\b"), "Apple"),
        (new Regex(@"\bgoogle\b"), "Google"),
        (new Regex(@"\bmicrosoft\b"), "Microsoft"),
        (new Regex(@"\bpagseguro\b|\bpagbank\b"), "PagBank"),
        (new Regex(@"\bpicpay\b"), "PicPay"),
        (new Regex(@"^tim\b"), "TIM"),
        (new Regex(@"^vivo\b|telefonica brasil"), "Vivo"),
        (new Regex(@"^claro\b"), "Claro"),
        (new Regex(@"receita federal"), "Receita Federal"),
    ];

    /// <summary>Lower-case words kept as is in a title-cased name.</summary>
    private static readonly HashSet<string> Particles = ["de", "da", "do", "das", "dos", "e", "em", "para", "com"];

    /// <summary>
    /// How merchants are matched: accents, case, spaces and punctuation removed,
    /// so "Loja Avenida", "LOJA AVENIDA" and "LojaAvenida" are the same place.
    /// </summary>
    public static string KeyOf(string name) => Plain(name).Replace(" ", string.Empty);

    /// <param name="ownerName">The user's name: a Pix to themselves (another bank) is their own money.</param>
    public static ParsedMerchant? Parse(string? description, string? ownerName = null)
    {
        var text = Spaces().Replace(description ?? string.Empty, " ").Trim();
        if (text.Length == 0) return null;

        var key = MoneyText.Key(text);
        foreach (var (pattern, own) in OwnMovements)
        {
            if (pattern.IsMatch(key)) return Own(own);
        }

        var (rawName, document, transfer) = Split(text);
        var name = Clean(rawName);
        var plain = Plain(name);
        if (plain.Length == 0) return null;

        // Matched before and after cleaning: "Ifd*Restaurante X" is iFood by its gateway prefix.
        var plainRaw = Plain(rawName);
        foreach (var (pattern, brand) in Brands)
        {
            if (pattern.IsMatch(plain) || pattern.IsMatch(plainRaw)) return new ParsedMerchant(brand, KeyOf(brand), MerchantKind.BUSINESS, document);
        }

        if (IsOwner(plain, ownerName)) return new ParsedMerchant(name, KeyOf(name), MerchantKind.OWN, document);

        // Only a transfer can be to a person; "Crédito em conta" is just the bank's wording.
        var kind = document != null && Cnpj().IsMatch(document) ? MerchantKind.BUSINESS
            : document != null ? MerchantKind.PERSON
            : transfer && LooksLikePerson(rawName) ? MerchantKind.PERSON
            : MerchantKind.BUSINESS;
        return new ParsedMerchant(name, KeyOf(name), kind, document);
    }

    private static ParsedMerchant Own(string name) => new(name, KeyOf(name), MerchantKind.OWN, null);

    /// <summary>Lower case, no accents, letters and digits separated by single spaces.</summary>
    private static string Plain(string text)
    {
        var decomposed = text.Normalize(System.Text.NormalizationForm.FormD);
        var chars = new System.Text.StringBuilder(decomposed.Length);
        foreach (var c in decomposed)
        {
            if (CharUnicodeInfo.GetUnicodeCategory(c) == UnicodeCategory.NonSpacingMark) continue;
            chars.Append(char.IsLetterOrDigit(c) ? char.ToLowerInvariant(c) : ' ');
        }
        return Spaces().Replace(chars.ToString(), " ").Trim();
    }

    /// <summary>
    /// The name and document out of "Transferência enviada pelo Pix - NAME - DOCUMENT - BANK…"
    /// and "Compra no débito - NAME"; anything else (card bill titles) is the name itself.
    /// </summary>
    private static (string Name, string? Document, bool Transfer) Split(string text)
    {
        // "Pix via Open Banking - Iniciada por: Belvo - NAME - …": the app that started it isn't the payee.
        var parts = text.Split(" - ").Select(p => p.Trim()).Where(p => !InitiatedBy().IsMatch(p)).ToArray();
        var head = MoneyText.Key(parts[0]);
        if (parts.Length < 2 || !TransferOrPurchase().IsMatch(head)) return (text, null, false);

        var name = Parenthesis().Replace(parts[1], string.Empty);
        var document = parts.Length > 2 && Document().IsMatch(parts[2]) ? parts[2] : null;
        // "Compra no débito - Mercado, Centro": the part after the comma is the place.
        if (head.StartsWith("compra")) name = name.Split(',')[0];
        return (name, document, !head.StartsWith("compra"));
    }

    /// <summary>Drops payment-gateway prefixes, installments, the MEI's CNPJ prefix and corporate suffixes; title-cases.</summary>
    private static string Clean(string raw)
    {
        var name = GatewayPrefix().Replace(raw, string.Empty);
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

    /// <summary>Every word of the user's name (at least two) appears in the merchant's.</summary>
    private static bool IsOwner(string plainName, string? ownerName)
    {
        var owner = Plain(ownerName ?? string.Empty).Split(' ', StringSplitOptions.RemoveEmptyEntries);
        if (owner.Length < 2) return false;
        var words = plainName.Split(' ').ToHashSet();
        return owner.All(words.Contains);
    }

    /// <summary>"Ana Carolina de Oliveira" (no document): letters only, 2+ words, no company words.</summary>
    private static bool LooksLikePerson(string name)
    {
        var key = MoneyText.Key(name);
        var words = key.Split(' ', StringSplitOptions.RemoveEmptyEntries);
        return words.Length >= 2
               && !name.Any(char.IsDigit)
               && !CompanyWords().IsMatch(key);
    }

    [GeneratedRegex(@"^(transferencia|pix|compra|pagamento|ted|doc)\b")]
    private static partial Regex TransferOrPurchase();

    [GeneratedRegex(@"^iniciada por:", RegexOptions.IgnoreCase)]
    private static partial Regex InitiatedBy();

    [GeneratedRegex(@"\s*\(.*\)\s*$")]
    private static partial Regex Parenthesis();

    /// <summary>A CNPJ or a (masked) CPF.</summary>
    [GeneratedRegex(@"^[\d•*.\-/ ]{11,20}$")]
    private static partial Regex Document();

    [GeneratedRegex(@"^\d{2}\.\d{3}\.\d{3}/\d{4}-\d{2}$")]
    private static partial Regex Cnpj();

    [GeneratedRegex(@"^(ifd|mp|pg|pag|ec|pp|ppro|dl|htm|sumup|lpz|ebn|mlp|ebanx|paypal|pagar ?me)\s*\*\s*", RegexOptions.IgnoreCase)]
    private static partial Regex GatewayPrefix();

    [GeneratedRegex(@"\s*-?\s*parcela\s*\d+\s*/\s*\d+\s*$|\s+\d{1,2}/\d{1,2}\s*$", RegexOptions.IgnoreCase)]
    private static partial Regex Installment();

    /// <summary>"17.133.477 MARCIO…": the MEI's CNPJ root before the owner's name.</summary>
    [GeneratedRegex(@"^[\d.\-/]{6,}\s+")]
    private static partial Regex LeadingNumbers();

    [GeneratedRegex(@"\s+(ltda|s\s?\.?\s?a|me|epp|eireli|mei|cia|s/a)\.?$", RegexOptions.IgnoreCase)]
    private static partial Regex CorporateSuffix();

    [GeneratedRegex(@"\b(ltda|sa|servicos|comercio|loja|lojas|restaurante|bar|mercado|supermercado|padaria|panificadora|pizzaria|pizzeria|lanches|lanchonete|hamburgueria|food|ai|farmacia|drogaria|posto|auto|center|centro|store|shop|digital|tecnologia|pagamentos|instituicao|banco|bco|grupo|empresa|clinica|academia|escola|condominio|igreja|associacao)\b")]
    private static partial Regex CompanyWords();

    [GeneratedRegex(@"\s+")]
    private static partial Regex Spaces();
}
