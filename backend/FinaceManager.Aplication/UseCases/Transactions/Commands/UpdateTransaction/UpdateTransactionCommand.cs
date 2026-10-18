using FinanceManager.Aplication.DTOs;
using FinanceManager.Aplication.Mediator.Messaging;
using FinanceManager.Domain.Enuns;

namespace FinanceManager.Aplication.UseCases.Transactions.Commands.UpdateTransaction;

public record UpdateTransactionCommand(
    Guid UserId,
    Guid TransactionId,
    Guid AccountId,
    Guid CategoryId,
    TransactionType Type,
    long AmountCents,
    string Description,
    DateTime Date,
    Recurrence Recurrence) : ICommand<TransactionDto>;
