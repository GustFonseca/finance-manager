using FinanceManager.Aplication.DTOs;
using FinanceManager.Aplication.Mediator.Messaging;

namespace FinanceManager.Aplication.UseCases.Goals.Queries.GetAllGoals;

public record GetAllGoalsQuery(Guid UserId) : IQuery<List<GoalDto>>;
