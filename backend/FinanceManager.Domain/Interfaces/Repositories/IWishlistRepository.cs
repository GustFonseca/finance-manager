using FinanceManager.Domain.Entities;

namespace FinanceManager.Domain.Interfaces.Repositories;

public interface IWishlistRepository : IRepository<WishlistItem>
{
    Task<List<WishlistItem>> GetByUserIdAsync(Guid userId);
}
