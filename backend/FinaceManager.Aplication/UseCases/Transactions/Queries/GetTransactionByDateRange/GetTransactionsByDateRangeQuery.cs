using FinanceManager.Aplication.DTOs;
using FinanceManager.Aplication.Mediator.Messaging;
using FinanceManager.Domain.Enuns;

namespace FinanceManager.Aplication.UseCases.Transactions.Queries.GetTransactionByDateRange;

public record GetTransactionsByDateRangeQuery(
    Guid UserId,
    DateTime? Start,
    DateTime? End,
    Guid? AccountId = null,
    Guid? MerchantId = null,
    Guid? CategoryId = null,
    TransactionType? Type = null,
    string? Search = null) : IQuery<List<TransactionDto>>;
