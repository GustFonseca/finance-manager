using FinanceManager.Aplication.Analysis;
using FinanceManager.Aplication.DTOs;
using FinanceManager.Aplication.Mediator.Messaging;
using FinanceManager.Domain.Interfaces.Repositories;

namespace FinanceManager.Aplication.UseCases.Merchants.Queries.GetMerchantSpending;

public class GetMerchantSpendingHandler : IRequestHandler<GetMerchantSpendingQuery, MerchantSpendingReportDto>
{
    private readonly ITransactionRepository _transactionRepository;

    public GetMerchantSpendingHandler(ITransactionRepository transactionRepository)
    {
        _transactionRepository = transactionRepository;
    }

    public async Task<MerchantSpendingReportDto> Handle(GetMerchantSpendingQuery request, CancellationToken cancellationToken = default)
    {
        var transactions = await _transactionRepository.GetByUserIdAsync(request.UserId, request.Start, request.End, request.AccountId);
        return MerchantAnalyzer.Report(transactions);
    }
}
