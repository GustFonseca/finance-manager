using FinanceManager.Aplication.DTOs;
using FinanceManager.Aplication.Mediator.Messaging;

namespace FinanceManager.Aplication.UseCases.Rules.Commands.SetRuleActive;

public record SetRuleActiveCommand(Guid UserId, Guid RuleId, bool IsActive) : ICommand<RuleDto>;
