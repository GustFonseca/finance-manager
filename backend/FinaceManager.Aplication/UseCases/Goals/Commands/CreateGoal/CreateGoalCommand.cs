using FinanceManager.Aplication.DTOs;
using FinanceManager.Aplication.Mediator.Messaging;

namespace FinanceManager.Aplication.UseCases.Goals.Commands.CreateGoal;

public record CreateGoalCommand(Guid UserId, string Name, long TargetCents, DateTime? Deadline) : ICommand<GoalDto>;
