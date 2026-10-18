using FinanceManager.Aplication.Mediator.Messaging;

namespace FinanceManager.Aplication.UseCases.Planning.Commands.SetEmergencyFund;

public record SetEmergencyFundCommand(Guid UserId, int Months, Guid? GoalId) : ICommand<bool>;
