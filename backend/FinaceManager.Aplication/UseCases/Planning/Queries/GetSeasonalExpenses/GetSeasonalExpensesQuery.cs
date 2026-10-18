using FinanceManager.Aplication.DTOs;
using FinanceManager.Aplication.Mediator.Messaging;

namespace FinanceManager.Aplication.UseCases.Planning.Queries.GetSeasonalExpenses;

public record GetSeasonalExpensesQuery(Guid UserId, DateTime MonthStart, DateTime Now) : IQuery<SeasonalExpensesDto>;
