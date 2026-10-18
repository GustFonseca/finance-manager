using FinanceManager.Aplication.DTOs;
using FinanceManager.Aplication.Mediator.Messaging;

namespace FinanceManager.Aplication.UseCases.Planning.Queries.GetNetWorth;

public record GetNetWorthQuery(Guid UserId, DateTime MonthStart, DateTime Now) : IQuery<NetWorthDto>;
