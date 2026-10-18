using System.Collections.Concurrent;
using System.Text.RegularExpressions;
using FinanceManager.Aplication.Analysis;
using FinanceManager.Domain.Entities;
using FinanceManager.Domain.Enuns;

namespace FinanceManager.Aplication.Classification;

public sealed class ClassificationRules
{
    private static readonly TimeSpan MatchTimeout = TimeSpan.FromMilliseconds(200);
    private const RegexOptions Options = RegexOptions.CultureInvariant | RegexOptions.IgnoreCase;
    public const int MaxCachedLookups = 50_000;

    private readonly Dictionary<RuleType, List<(Regex Pattern, string? Value)>> _rules = [];
    private readonly Regex? _gatewayPrefix;
    private readonly List<string> _problems = [];
    private readonly ConcurrentDictionary<(RuleType Type, string Text), (bool Found, string? Value)> _lookups = new();

    public static readonly ClassificationRules Empty = new([]);

    public ClassificationRules(IEnumerable<ClassificationRule> rules)
    {
        foreach (var rule in rules.Where(r => r.IsActive).OrderBy(r => r.Priority))
        {
            try
            {
                var pattern = new Regex(rule.Pattern, Options, MatchTimeout);
                if (!_rules.TryGetValue(rule.Type, out var list)) _rules[rule.Type] = list = [];
                list.Add((pattern, rule.Value));
            }
            catch (ArgumentException ex)
            {
                _problems.Add($"{rule.Type} {rule.Id}: padrão inválido \"{rule.Pattern}\" ({ex.Message})");
            }
        }

        if (_rules.TryGetValue(RuleType.GATEWAY_PREFIX, out var gateways))
        {
            var alternatives = string.Join('|', gateways.Select(g => $"(?:{g.Pattern})"));
            _gatewayPrefix = new Regex($@"^(?:{alternatives})\s*\*\s*", Options, MatchTimeout);
        }
    }

    public IReadOnlyList<string> Problems => _problems;

    public string? OwnMoney(string description) => FirstValue(RuleType.OWN_MONEY, description);

    public string? Brand(params string[] names) =>
        names.Select(n => FirstValue(RuleType.BRAND, n)).FirstOrDefault(b => b != null);

    public string StripGatewayPrefix(string rawName) => _gatewayPrefix?.Replace(rawName, string.Empty) ?? rawName;

    public bool HasBusinessWord(string name) => Any(RuleType.BUSINESS_WORD, name);
    public bool IsSubscription(string text) => Any(RuleType.SUBSCRIPTION, text);
    public bool IsBill(string text) => Any(RuleType.BILL, text);
    public bool IsGrocery(string text) => Any(RuleType.GROCERY, text);
    public bool IsSuperfluous(string text) => Any(RuleType.SUPERFLUOUS, text);

    public string? CategoryHint(string text) => FirstValue(RuleType.CATEGORY_HINT, text);

    public SpendingClass? CategoryClass(string categoryName) =>
        Any(RuleType.ESSENTIAL_CATEGORY, categoryName) ? SpendingClass.ESSENTIAL
        : Any(RuleType.SUPERFLUOUS_CATEGORY, categoryName) ? SpendingClass.SUPERFLUOUS
        : null;

    public bool IsCatchAll(string categoryName) => Any(RuleType.CATCH_ALL_CATEGORY, categoryName);

    public string? SubscriptionGroup(string text) => FirstValue(RuleType.SUBSCRIPTION_GROUP, text);

    public string? Fee(string text) => FirstValue(RuleType.FEE, text);

    public string? Seasonal(string text) => FirstValue(RuleType.SEASONAL, text);

    public string? TaxDeductible(string text) => FirstValue(RuleType.TAX_DEDUCTIBLE, text);

    public int CachedLookups => _lookups.Count;

    private bool Any(RuleType type, string text) => Lookup(type, text).Found;

    private string? FirstValue(RuleType type, string text) => Lookup(type, text).Value;

    private (bool Found, string? Value) Lookup(RuleType type, string text)
    {
        if (!_rules.TryGetValue(type, out var list)) return (false, null);
        if (_lookups.TryGetValue((type, text), out var cached)) return cached;

        var plain = MoneyText.Plain(text);
        var result = (Found: false, Value: (string?)null);
        foreach (var rule in list)
        {
            if (!Matches(rule.Pattern, plain)) continue;
            result = (true, rule.Value);
            break;
        }
        if (_lookups.Count >= MaxCachedLookups) _lookups.Clear();
        _lookups[(type, text)] = result;
        return result;
    }

    private static bool Matches(Regex pattern, string text)
    {
        try
        {
            return pattern.IsMatch(text);
        }
        catch (RegexMatchTimeoutException)
        {
            return false;
        }
    }
}
