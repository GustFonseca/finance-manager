using FinanceManager.Aplication.DTOs;
using FinanceManager.Aplication.Mediator.Messaging;
using FinanceManager.Domain.Enuns;

namespace FinanceManager.Aplication.UseCases.Rules.Commands.SaveRule;

public record SaveRuleCommand(Guid UserId, Guid? RuleId, RuleType Type, string Pattern, string? Value, int Priority, string? Note) : ICommand<RuleDto>;
