using FinanceManager.Aplication.Mediator.Messaging;

namespace FinanceManager.Aplication.UseCases.Transactions.Commands.DeleteAllTransactions;

/// <summary>Deletes every transaction of the user and zeroes the account balances; returns how many were deleted.</summary>
public record DeleteAllTransactionsCommand(Guid UserId) : ICommand<int>;
