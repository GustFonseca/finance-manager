using FinanceManager.Domain.Entities;

namespace FinanceManager.Aplication.Analysis;

public record AvoidableContext(
    IReadOnlySet<string> Dismissed,
    IReadOnlyDictionary<string, SubscriptionDecision> Decisions,
    decimal InflationPercent)
{
    public static readonly AvoidableContext Empty = new(new HashSet<string>(), new Dictionary<string, SubscriptionDecision>(), 0m);
}
