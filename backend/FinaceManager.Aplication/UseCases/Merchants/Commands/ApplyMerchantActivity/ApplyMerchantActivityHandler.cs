using FinanceManager.Aplication.Analysis;
using FinanceManager.Aplication.Classification;
using FinanceManager.Aplication.Mediator.Messaging;
using FinanceManager.Domain.Enuns;
using FinanceManager.Domain.Interfaces.Repositories;

namespace FinanceManager.Aplication.UseCases.Merchants.Commands.ApplyMerchantActivity;

public class ApplyMerchantActivityHandler : IRequestHandler<ApplyMerchantActivityCommand, int>
{
    private readonly IMerchantRepository _merchantRepository;
    private readonly ICategoryRepository _categoryRepository;
    private readonly ITransactionRepository _transactionRepository;
    private readonly IClassificationRulesProvider _rulesProvider;

    public ApplyMerchantActivityHandler(
        IMerchantRepository merchantRepository,
        ICategoryRepository categoryRepository,
        ITransactionRepository transactionRepository,
        IClassificationRulesProvider rulesProvider)
    {
        _merchantRepository = merchantRepository;
        _categoryRepository = categoryRepository;
        _transactionRepository = transactionRepository;
        _rulesProvider = rulesProvider;
    }

    public async Task<int> Handle(ApplyMerchantActivityCommand request, CancellationToken cancellationToken = default)
    {
        var merchant = await _merchantRepository.GetByIdAsync(request.MerchantId);
        if (merchant == null) return 0;

        merchant.EnrichedAt = request.Now;
        merchant.ActivityCode = request.Company?.ActivityCode;
        merchant.Activity = request.Company?.Activity;

        var moved = 0;
        if (request.Company != null && merchant.CategoryId == null)
        {
            var rules = await _rulesProvider.GetAsync(cancellationToken);
            var hint = rules.CategoryHint(request.Company.Activity);
            var categories = await _categoryRepository.GetByUserIdAndTypeAsync(merchant.UserId, CategoryType.EXPENSE);
            var category = hint == null ? null : categories.FirstOrDefault(c => MoneyText.Key(c.Name) == MoneyText.Key(hint));
            if (category != null)
            {
                merchant.CategoryId = category.Id;
                var unsorted = (await _transactionRepository.GetByMerchantIdAsync(merchant.Id))
                    .Where(t => t.Type == TransactionType.EXPENSE && categories.Any(c => c.Id == t.CategoryId && rules.IsCatchAll(c.Name)))
                    .ToList();
                foreach (var transaction in unsorted) transaction.CategoryId = category.Id;
                if (unsorted.Count > 0) await _transactionRepository.UpdateRangeAsync(unsorted);
                moved = unsorted.Count;
            }
        }

        await _merchantRepository.UpdateAsync(merchant);
        return moved;
    }
}
