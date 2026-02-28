using FinanceManager.Aplication.DTOs;
using FinanceManager.Aplication.Mediator.Messaging;

namespace FinanceManager.Aplication.UseCases.Goals.Commands.CompleteGoal;

public record CompleteGoalCommand(Guid UserId, Guid GoalId) : ICommand<GoalDto>;
