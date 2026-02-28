using FinanceManager.Aplication.DTOs;
using FinanceManager.Aplication.Mediator.Messaging;

namespace FinanceManager.Aplication.UseCases.Transactions.Queries.GetTransactionByDateRange;

public record GetTransactionsByDateRangeQuery(Guid UserId, DateTime? Start, DateTime? End) : IQuery<List<TransactionDto>>;
