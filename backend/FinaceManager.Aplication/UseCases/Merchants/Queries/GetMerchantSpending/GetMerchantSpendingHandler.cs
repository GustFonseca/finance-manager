using FinanceManager.Aplication.Analysis;
using FinanceManager.Aplication.Classification;
using FinanceManager.Aplication.DTOs;
using FinanceManager.Aplication.Mediator.Messaging;
using FinanceManager.Domain.Interfaces.Repositories;

namespace FinanceManager.Aplication.UseCases.Merchants.Queries.GetMerchantSpending;

public class GetMerchantSpendingHandler : IRequestHandler<GetMerchantSpendingQuery, MerchantSpendingReportDto>
{
    private readonly IClassificationRulesProvider _rulesProvider;
    private readonly ITransactionRepository _transactionRepository;

    public GetMerchantSpendingHandler(ITransactionRepository transactionRepository, IClassificationRulesProvider rulesProvider)
    {
        _rulesProvider = rulesProvider;
        _transactionRepository = transactionRepository;
    }

    public async Task<MerchantSpendingReportDto> Handle(GetMerchantSpendingQuery request, CancellationToken cancellationToken = default)
    {
        var transactions = await _transactionRepository.GetByUserIdAsync(request.UserId, request.Start, request.End, request.AccountId);
        var rules = await _rulesProvider.GetAsync(cancellationToken);
        return MerchantAnalyzer.Report(transactions, rules);
    }
}
