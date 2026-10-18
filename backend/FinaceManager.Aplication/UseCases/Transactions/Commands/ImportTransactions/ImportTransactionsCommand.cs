using FinanceManager.Aplication.DTOs;
using FinanceManager.Aplication.Mediator.Messaging;

namespace FinanceManager.Aplication.UseCases.Transactions.Commands.ImportTransactions;

public record ImportTransactionsCommand(Guid UserId, Guid AccountId, List<ImportTransactionLine> Lines) : ICommand<int>;
