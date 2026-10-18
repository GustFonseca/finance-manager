using AutoMapper;
using FinanceManager.Aplication.Analysis;
using FinanceManager.Aplication.DTOs;
using FinanceManager.Aplication.Mediator.Messaging;
using FinanceManager.Domain.Interfaces.Repositories;

namespace FinanceManager.Aplication.UseCases.Merchants.Queries.GetMerchantHistory;

public class GetMerchantHistoryHandler : IRequestHandler<GetMerchantHistoryQuery, MerchantHistoryDto?>
{
    private readonly IMerchantRepository _merchantRepository;
    private readonly ITransactionRepository _transactionRepository;
    private readonly IMapper _mapper;

    public GetMerchantHistoryHandler(
        IMerchantRepository merchantRepository,
        ITransactionRepository transactionRepository,
        IMapper mapper)
    {
        _merchantRepository = merchantRepository;
        _transactionRepository = transactionRepository;
        _mapper = mapper;
    }

    public async Task<MerchantHistoryDto?> Handle(GetMerchantHistoryQuery request, CancellationToken cancellationToken = default)
    {
        var merchant = await _merchantRepository.GetByIdAsync(request.MerchantId);
        if (merchant == null || merchant.UserId != request.UserId) return null;

        var transactions = await _transactionRepository.GetByUserIdAsync(request.UserId, request.Start, request.End, merchantId: merchant.Id);
        var history = MerchantAnalyzer.History(transactions, request.Start, request.End);
        history.Merchant = _mapper.Map<MerchantDto>(merchant);
        return history;
    }
}
