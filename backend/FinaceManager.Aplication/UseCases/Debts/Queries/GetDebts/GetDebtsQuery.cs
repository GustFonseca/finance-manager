using FinanceManager.Aplication.DTOs;
using FinanceManager.Aplication.Mediator.Messaging;

namespace FinanceManager.Aplication.UseCases.Debts.Queries.GetDebts;

public record GetDebtsQuery(Guid UserId) : IQuery<List<DebtDto>>;
