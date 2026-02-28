using FinanceManager.Aplication.Mediator.Messaging;

namespace FinanceManager.Aplication.UseCases.Goals.Commands.DeleteGoal;

public record DeleteGoalCommand(Guid UserId, Guid GoalId) : ICommand<bool>;
