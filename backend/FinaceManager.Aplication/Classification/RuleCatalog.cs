using System.Text.RegularExpressions;
using FinanceManager.Domain.Entities;
using FinanceManager.Domain.Enuns;

namespace FinanceManager.Aplication.Classification;

public static class RuleCatalog
{
    public const int MaxPatternLength = 2000;
    public const int MaxValueLength = 100;
    public const int MaxNoteLength = 300;
    public const string DefaultIdPrefix = "c1a55100-0000-0000-0000-";
    public static readonly TimeSpan TestTimeout = TimeSpan.FromMilliseconds(200);

    public static readonly IReadOnlySet<RuleType> RequiresValue = new HashSet<RuleType>
    {
        RuleType.OWN_MONEY, RuleType.BRAND, RuleType.CATEGORY_HINT, RuleType.SUBSCRIPTION_GROUP, RuleType.FEE, RuleType.SEASONAL, RuleType.TAX_DEDUCTIBLE,
    };

    public static bool IsDefault(ClassificationRule rule) => rule.Id.ToString().StartsWith(DefaultIdPrefix);

    public static string? PatternError(string pattern)
    {
        if (string.IsNullOrWhiteSpace(pattern)) return "Informe o padrão.";
        if (pattern.Length > MaxPatternLength) return $"O padrão pode ter até {MaxPatternLength} caracteres.";
        try
        {
            _ = new Regex(pattern, RegexOptions.CultureInvariant | RegexOptions.IgnoreCase, TestTimeout);
            return null;
        }
        catch (ArgumentException ex)
        {
            return $"Padrão inválido: {ex.Message}";
        }
    }
}
