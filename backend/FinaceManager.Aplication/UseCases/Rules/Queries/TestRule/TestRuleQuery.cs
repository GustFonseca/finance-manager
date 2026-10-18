using FinanceManager.Aplication.DTOs;
using FinanceManager.Aplication.Mediator.Messaging;

namespace FinanceManager.Aplication.UseCases.Rules.Queries.TestRule;

public record TestRuleQuery(Guid UserId, string Pattern, DateTime Now) : IQuery<RuleTestDto>;
