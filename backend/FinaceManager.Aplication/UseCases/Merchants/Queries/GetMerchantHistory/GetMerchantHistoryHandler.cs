using FinanceManager.Aplication.Mappings;
using FinanceManager.Aplication.Ownership;
using FinanceManager.Aplication.Analysis;
using FinanceManager.Aplication.DTOs;
using FinanceManager.Aplication.Mediator.Messaging;
using FinanceManager.Domain.Interfaces.Repositories;

namespace FinanceManager.Aplication.UseCases.Merchants.Queries.GetMerchantHistory;

public class GetMerchantHistoryHandler : IRequestHandler<GetMerchantHistoryQuery, MerchantHistoryDto>
{
    private readonly IMerchantRepository _merchantRepository;
    private readonly ITransactionRepository _transactionRepository;

    public GetMerchantHistoryHandler(
        IMerchantRepository merchantRepository,
        ITransactionRepository transactionRepository)
    {
        _merchantRepository = merchantRepository;
        _transactionRepository = transactionRepository;
    }

    public async Task<MerchantHistoryDto> Handle(GetMerchantHistoryQuery request, CancellationToken cancellationToken = default)
    {
        var merchant = await _merchantRepository.GetOwnedAsync(request.MerchantId, request.UserId);

        var transactions = await _transactionRepository.GetByUserIdAsync(request.UserId, request.Start, request.End, merchantId: merchant.Id);
        var history = MerchantAnalyzer.History(transactions, request.Start, request.End);
        history.Merchant = merchant.ToDto();
        return history;
    }
}
