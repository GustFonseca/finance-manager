using FinanceManager.Aplication.DTOs;
using FinanceManager.Aplication.Mediator.Messaging;

namespace FinanceManager.Aplication.UseCases.Transactions.Commands.SetReceipt;

public record SetReceiptCommand(Guid UserId, Guid TransactionId, Guid? FileId) : ICommand<TransactionDto>;
