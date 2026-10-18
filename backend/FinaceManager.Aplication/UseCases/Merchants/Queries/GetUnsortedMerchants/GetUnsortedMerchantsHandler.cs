using FinanceManager.Aplication.Analysis;
using FinanceManager.Aplication.Classification;
using FinanceManager.Aplication.DTOs;
using FinanceManager.Aplication.Mediator.Messaging;
using FinanceManager.Domain.Interfaces.Repositories;

namespace FinanceManager.Aplication.UseCases.Merchants.Queries.GetUnsortedMerchants;

public class GetUnsortedMerchantsHandler : IRequestHandler<GetUnsortedMerchantsQuery, List<MerchantSpendingDto>>
{
    private readonly ITransactionRepository _transactionRepository;
    private readonly IMerchantRepository _merchantRepository;
    private readonly IClassificationRulesProvider _rulesProvider;

    public GetUnsortedMerchantsHandler(
        ITransactionRepository transactionRepository,
        IMerchantRepository merchantRepository,
        IClassificationRulesProvider rulesProvider)
    {
        _transactionRepository = transactionRepository;
        _merchantRepository = merchantRepository;
        _rulesProvider = rulesProvider;
    }

    public async Task<List<MerchantSpendingDto>> Handle(GetUnsortedMerchantsQuery request, CancellationToken cancellationToken = default)
    {
        var rules = await _rulesProvider.GetAsync(cancellationToken);
        var unsorted = (await _merchantRepository.GetByUserIdAsync(request.UserId))
            .Where(m => m.Category == null || rules.IsCatchAll(m.Category.Name))
            .Select(m => m.Id)
            .ToHashSet();
        var transactions = await _transactionRepository.GetByUserIdAsync(request.UserId, request.Start, request.End);

        return MerchantAnalyzer.Report(transactions, rules).Merchants
            .Where(m => m.MerchantId.HasValue && unsorted.Contains(m.MerchantId.Value))
            .ToList();
    }
}
