using FinanceManager.Aplication.Analysis;
using FinanceManager.Aplication.Classification;
using FinanceManager.Domain.Entities;
using FinanceManager.Domain.Enuns;
using FinanceManager.Domain.Interfaces.Repositories;

namespace FinanceManager.Aplication.UseCases.Merchants;

public static class MerchantCatalog
{
    public static async Task<Merchant?> ResolveAsync(
        IMerchantRepository repository,
        ClassificationRules rules,
        Guid userId,
        string description,
        string? ownerName,
        Dictionary<string, Merchant>? cache = null)
    {
        var parsed = MerchantParser.Parse(description, rules, ownerName);
        if (parsed == null) return null;
        if (cache != null && cache.TryGetValue(parsed.Key, out var known)) return known;

        var merchant = await repository.GetByKeyAsync(userId, parsed.Key)
            ?? await repository.CreateAsync(new Merchant
            {
                UserId = userId,
                Name = parsed.Name,
                Key = parsed.Key,
                Kind = parsed.Kind,
                Document = parsed.Document,
            });
        if (cache != null) cache[parsed.Key] = merchant;
        return merchant;
    }

    public static async Task<Merchant?> FileAsync(
        IMerchantRepository repository,
        ClassificationRules rules,
        Guid userId,
        string description,
        string? ownerName,
        Category category,
        bool learnCategory = true,
        Dictionary<string, Merchant>? cache = null)
    {
        var merchant = await ResolveAsync(repository, rules, userId, description, ownerName, cache);
        if (merchant != null && learnCategory && ShouldLearn(merchant, category, rules))
        {
            merchant.CategoryId = category.Id;
            await repository.UpdateAsync(merchant);
        }
        return merchant;
    }

    public static bool ShouldLearn(Merchant merchant, Category category, ClassificationRules rules) =>
        merchant.Kind != MerchantKind.OWN
        && merchant.CategoryId != category.Id
        && !rules.IsCatchAll(category.Name);
}
