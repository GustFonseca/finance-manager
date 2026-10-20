using FinanceManager.Domain.Common;

namespace FinanceManager.Domain.Events;

public sealed record ClassificationRulesChanged(Guid RuleId) : IDomainEvent;
