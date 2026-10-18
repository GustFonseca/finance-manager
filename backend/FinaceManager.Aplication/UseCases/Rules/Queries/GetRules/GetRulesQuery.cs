using FinanceManager.Aplication.DTOs;
using FinanceManager.Aplication.Mediator.Messaging;

namespace FinanceManager.Aplication.UseCases.Rules.Queries.GetRules;

public record GetRulesQuery : IQuery<List<RuleDto>>;
