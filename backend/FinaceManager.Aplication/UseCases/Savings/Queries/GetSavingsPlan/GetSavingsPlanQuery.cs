using FinanceManager.Aplication.DTOs;
using FinanceManager.Aplication.Mediator.Messaging;

namespace FinanceManager.Aplication.UseCases.Savings.Queries.GetSavingsPlan;

public record GetSavingsPlanQuery(Guid UserId, DateTime MonthStart, DateTime Now) : IQuery<SavingsPlanDto>;
