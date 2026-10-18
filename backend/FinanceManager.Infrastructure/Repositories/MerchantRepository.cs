using FinanceManager.Domain.Entities;
using FinanceManager.Domain.Enuns;
using FinanceManager.Domain.Interfaces.Repositories;
using FinanceManager.Infrastructure.Context;
using Microsoft.EntityFrameworkCore;

namespace FinanceManager.Infrastructure.Repositories;

public class MerchantRepository : Repository<Merchant>, IMerchantRepository, IRepository<Merchant>
{
    public MerchantRepository(AppDbContext _context) : base(_context) { }

    public async Task<List<Merchant>> GetByUserIdAsync(Guid userId)
    {
        return await _dbSet.Include(m => m.Category).Where(m => m.UserId == userId).OrderBy(m => m.Name).ToListAsync();
    }

    public async Task<List<Merchant>> GetPendingEnrichmentAsync(int max)
    {
        return await _dbSet
            .Where(m => m.EnrichedAt == null && m.Kind == MerchantKind.BUSINESS && m.Document != null && m.Document.Contains("/"))
            .OrderBy(m => m.CreatedAt)
            .Take(max)
            .ToListAsync();
    }

    public async Task<Merchant?> GetByKeyAsync(Guid userId, string key)
    {
        return await _dbSet.Include(m => m.Category).FirstOrDefaultAsync(m => m.UserId == userId && m.Key == key);
    }
}
