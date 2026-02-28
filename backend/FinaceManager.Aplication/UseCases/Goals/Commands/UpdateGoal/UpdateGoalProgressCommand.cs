using FinanceManager.Aplication.DTOs;
using FinanceManager.Aplication.Mediator.Messaging;

namespace FinanceManager.Aplication.UseCases.Goals.Commands.UpdateGoal;

public record UpdateGoalProgressCommand(Guid UserId, Guid GoalId, long AmountCents) : ICommand<GoalDto>;
