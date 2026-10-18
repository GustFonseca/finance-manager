using FinanceManager.Domain.Entities;
using FinanceManager.Domain.Interfaces.Repositories;
using FinanceManager.Infrastructure.Context;
using Microsoft.EntityFrameworkCore;

namespace FinanceManager.Infrastructure.Repositories;

public class WishlistRepository : Repository<WishlistItem>, IWishlistRepository, IRepository<WishlistItem>
{
    public WishlistRepository(AppDbContext _context) : base(_context) { }

    public Task<List<WishlistItem>> GetByUserIdAsync(Guid userId) =>
        _dbSet.AsNoTracking().Where(w => w.UserId == userId).OrderByDescending(w => w.CreatedAt).ToListAsync();
}
