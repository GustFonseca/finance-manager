using AutoMapper;
using FinanceManager.Aplication.DTOs;
using FinanceManager.Aplication.Exceptions;
using FinanceManager.Aplication.Mediator.Messaging;
using FinanceManager.Domain.Interfaces.Repositories;

namespace FinanceManager.Aplication.UseCases.Transactions.Commands.SetReceipt;

public class SetReceiptHandler : IRequestHandler<SetReceiptCommand, TransactionDto?>
{
    private readonly ITransactionRepository _transactionRepository;
    private readonly IStoredFileRepository _fileRepository;
    private readonly IMapper _mapper;

    public SetReceiptHandler(ITransactionRepository transactionRepository, IStoredFileRepository fileRepository, IMapper mapper)
    {
        _transactionRepository = transactionRepository;
        _fileRepository = fileRepository;
        _mapper = mapper;
    }

    public async Task<TransactionDto?> Handle(SetReceiptCommand request, CancellationToken cancellationToken = default)
    {
        var transaction = await _transactionRepository.GetByIdAsync(request.TransactionId);
        if (transaction == null || transaction.UserId != request.UserId) return null;
        if (request.FileId is { } fileId)
        {
            var file = await _fileRepository.GetByIdAsync(fileId);
            if (file == null || file.UserId != request.UserId || file.DeletedAt != null)
                throw new BusinessRuleException("Escolha um arquivo seu que não esteja na lixeira.");
        }
        transaction.ReceiptFileId = request.FileId;
        await _transactionRepository.UpdateAsync(transaction);
        return _mapper.Map<TransactionDto>(transaction);
    }
}
