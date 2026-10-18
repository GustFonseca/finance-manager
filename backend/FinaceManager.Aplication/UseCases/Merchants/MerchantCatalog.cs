using FinanceManager.Aplication.Analysis;
using FinanceManager.Domain.Entities;
using FinanceManager.Domain.Enuns;
using FinanceManager.Domain.Interfaces.Repositories;

namespace FinanceManager.Aplication.UseCases.Merchants;

/// <summary>Files transactions under their merchant; shared by transaction creation and the catalog backfill.</summary>
public static class MerchantCatalog
{
    /// <summary>
    /// The merchant named in the description, created on first sight; null when
    /// it names nobody. <paramref name="cache"/> spares lookups within a batch.
    /// </summary>
    public static async Task<Merchant?> ResolveAsync(
        IMerchantRepository repository,
        Guid userId,
        string description,
        string? ownerName,
        Dictionary<string, Merchant>? cache = null)
    {
        var parsed = MerchantParser.Parse(description, ownerName);
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

    /// <summary>
    /// Whether choosing <paramref name="category"/> should become the merchant's
    /// suggestion. "Outros" means "not sorted yet", and own money has no category to learn.
    /// </summary>
    public static bool ShouldLearn(Merchant merchant, Category category) =>
        merchant.Kind != MerchantKind.OWN
        && merchant.CategoryId != category.Id
        && MoneyText.Key(category.Name) != "outros";
}
