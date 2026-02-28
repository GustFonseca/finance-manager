using FinanceManager.Aplication.DTOs;
using FinanceManager.Aplication.Mediator.Messaging;
using FinanceManager.Domain.Enuns;

namespace FinanceManager.Aplication.UseCases.Transactions.Commands.CreateTransaction;

public record CreateTransactionCommand(
    Guid UserId,
    Guid AccountId,
    Guid CategoryId,
    TransactionType Type,
    long AmountCents,
    string Description,
    DateTime Date,
    Recurrence Recurrence) : ICommand<TransactionDto>;
