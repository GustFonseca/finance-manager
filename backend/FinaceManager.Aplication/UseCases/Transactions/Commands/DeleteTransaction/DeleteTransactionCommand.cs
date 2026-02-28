using FinanceManager.Aplication.Mediator.Messaging;

namespace FinanceManager.Aplication.UseCases.Transactions.Commands.DeleteTransaction;

public record DeleteTransactionCommand(Guid UserId, Guid TransactionId) : ICommand;
