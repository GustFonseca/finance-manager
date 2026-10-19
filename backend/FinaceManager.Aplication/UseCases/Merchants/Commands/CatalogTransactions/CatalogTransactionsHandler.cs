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
        var filed = 0;
        var attempted = await _transactionRepository.GetUncataloguedAsync(request.Max);
        foreach (var userTransactions in attempted.GroupBy(t => t.UserId))
        {
            var owner = await _userRepository.GetByIdAsync(userTransactions.Key);
            var cache = new Dictionary<string, Merchant>();
            foreach (var transaction in userTransactions)
            {
                var merchant = await MerchantCatalog.ResolveAsync(
                    _merchantRepository, rules, userTransactions.Key, transaction.Description, owner?.Name, cache);
                transaction.CatalogAttemptedAt = DateTime.UtcNow;
                if (merchant == null) continue;
                transaction.MerchantId = merchant.Id;
                filed++;
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
            }
        }

        if (attempted.Count > 0) await _transactionRepository.UpdateRangeAsync(attempted);
        return filed;
    }
}
