using FinanceManager.Aplication.DTOs;
using FinanceManager.Aplication.Mediator.Messaging;

namespace FinanceManager.Aplication.UseCases.Debts.Queries.GetDebtPlan;

public record GetDebtPlanQuery(Guid UserId, long ExtraCents) : IQuery<DebtPlanDto>;
