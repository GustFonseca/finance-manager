using FinanceManager.Domain.Entities;

namespace FinanceManager.Domain.Interfaces.Repositories;

public interface IMerchantRepository : IRepository<Merchant>
{
    /// <summary>The user's merchants with their category, by name.</summary>
    Task<List<Merchant>> GetByUserIdAsync(Guid userId);
    Task<Merchant?> GetByKeyAsync(Guid userId, string key);
}
