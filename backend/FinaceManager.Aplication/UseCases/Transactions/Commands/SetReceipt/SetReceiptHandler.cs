using FinanceManager.Aplication.Mappings;
using FinanceManager.Aplication.Ownership;
using FinanceManager.Aplication.DTOs;
using FinanceManager.Aplication.Exceptions;
using FinanceManager.Aplication.Mediator.Messaging;
using FinanceManager.Domain.Interfaces.Repositories;

namespace FinanceManager.Aplication.UseCases.Transactions.Commands.SetReceipt;

public class SetReceiptHandler : IRequestHandler<SetReceiptCommand, TransactionDto>
{
    private readonly ITransactionRepository _transactionRepository;
    private readonly IStoredFileRepository _fileRepository;

    public SetReceiptHandler(ITransactionRepository transactionRepository, IStoredFileRepository fileRepository)
    {
        _transactionRepository = transactionRepository;
        _fileRepository = fileRepository;
    }

    public async Task<TransactionDto> Handle(SetReceiptCommand request, CancellationToken cancellationToken = default)
    {
        var transaction = await _transactionRepository.GetOwnedAsync(request.TransactionId, request.UserId);
        if (request.FileId is { } fileId)
        {
            if (await _fileRepository.FindOwnedAsync(fileId, request.UserId) is not { DeletedAt: null })
                throw new BusinessRuleException("Escolha um arquivo seu que não esteja na lixeira.");
        }
        transaction.ReceiptFileId = request.FileId;
        await _transactionRepository.UpdateAsync(transaction);
        return transaction.ToDto();
    }
}
