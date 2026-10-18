using FinanceManager.Aplication.DTOs;
using FinanceManager.Aplication.Mediator.Messaging;

namespace FinanceManager.Aplication.UseCases.Summary.Queries.GetDailyBudget;

public record GetDailyBudgetQuery(Guid UserId, DateTime MonthStart, DateTime Now, DateTime DayStart) : IQuery<DailyBudgetDto>;
