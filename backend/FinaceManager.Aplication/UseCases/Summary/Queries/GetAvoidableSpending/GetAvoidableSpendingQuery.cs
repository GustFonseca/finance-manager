using FinanceManager.Aplication.DTOs;
using FinanceManager.Aplication.Mediator.Messaging;

namespace FinanceManager.Aplication.UseCases.Summary.Queries.GetAvoidableSpending;

public record GetAvoidableSpendingQuery(Guid UserId, DateTime MonthStart, DateTime Now, Guid? AccountId) : IQuery<AvoidableSpendingDto>;
