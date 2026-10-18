using FinanceManager.Aplication.Classification;
using FinanceManager.Aplication.Mediator.Messaging;
using FinanceManager.Domain.Entities;
using FinanceManager.Domain.Interfaces.Repositories;

namespace FinanceManager.Aplication.UseCases.Merchants.Commands.CatalogTransactions;

public class CatalogTransactionsHandler : IRequestHandler<CatalogTransactionsCommand, int>
{
    private readonly IClassificationRulesProvider _rulesProvider;
    private readonly ITransactionRepository _transactionRepository;
    private readonly IMerchantRepository _merchantRepository;
    private readonly IUserRepository _userRepository;

    public CatalogTransactionsHandler(
        ITransactionRepository transactionRepository,
        IMerchantRepository merchantRepository,
        IUserRepository userRepository,
        IClassificationRulesProvider rulesProvider)
    {
        _rulesProvider = rulesProvider;
        _transactionRepository = transactionRepository;
        _merchantRepository = merchantRepository;
        _userRepository = userRepository;
    }

    public async Task<int> Handle(CatalogTransactionsCommand request, CancellationToken cancellationToken = default)
    {
        var rules = await _rulesProvider.GetAsync(cancellationToken);
        var filed = new List<Transaction>();
        foreach (var userTransactions in (await _transactionRepository.GetUncataloguedAsync()).GroupBy(t => t.UserId))
        {
            var owner = await _userRepository.GetByIdAsync(userTransactions.Key);
            var cache = new Dictionary<string, Merchant>();
            foreach (var transaction in userTransactions)
            {
                var merchant = await MerchantCatalog.ResolveAsync(
                    _merchantRepository, rules, userTransactions.Key, transaction.Description, owner?.Name, cache);
                if (merchant == null) continue;
                transaction.MerchantId = merchant.Id;
                filed.Add(transaction);
            }

            foreach (var merchant in cache.Values.Where(m => m.CategoryId == null))
            {
                var usual = userTransactions
                    .Where(t => t.MerchantId == merchant.Id)
                    .GroupBy(t => t.CategoryId)
                    .OrderByDescending(g => g.Count())
                    .First().First().Category;
                if (usual == null || !MerchantCatalog.ShouldLearn(merchant, usual, rules)) continue;
                merchant.CategoryId = usual.Id;
                await _merchantRepository.UpdateAsync(merchant);
            }
        }

        if (filed.Count > 0) await _transactionRepository.UpdateRangeAsync(filed);
        return filed.Count;
    }
}
