using FinanceManager.Aplication.DTOs;
using FinanceManager.Aplication.Mediator.Messaging;

namespace FinanceManager.Aplication.UseCases.Summary.Queries.GetCashFlowForecast;

public record GetCashFlowForecastQuery(Guid UserId, DateTime MonthStart, DateTime Now, Guid? AccountId) : IQuery<CashFlowForecastDto>;
