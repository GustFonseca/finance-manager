using FinanceManager.Aplication.Mediator.Messaging;

namespace FinanceManager.Aplication.UseCases.Transactions.Commands.DeleteAllTransactions;

public record DeleteAllTransactionsCommand(Guid UserId) : ICommand<int>;
