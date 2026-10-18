namespace FinanceManager.Domain.Enuns;

/// <summary>What a savings suggestion is about.</summary>
public enum SuggestionKind
{
    GOAL,
    BUDGET,
    SUBSCRIPTION,
    CATEGORY,
    /// <summary>A habit at one merchant (delivery, a shop visited every week).</summary>
    HABIT,
    /// <summary>Too much spending without a real category for the analysis to be precise.</summary>
    ORGANIZE
}
