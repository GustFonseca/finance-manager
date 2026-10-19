using FinanceManager.Domain.Entities;

namespace FinanceManager.Domain.Interfaces.Repositories;

public interface IMerchantRepository : IRepository<Merchant>
{
    Task<List<Merchant>> GetByUserIdAsync(Guid userId);
    Task<Merchant?> GetByKeyAsync(Guid userId, string key);
    Task<List<Merchant>> GetPendingEnrichmentAsync(int max);
    void Stage(Merchant merchant);
}
