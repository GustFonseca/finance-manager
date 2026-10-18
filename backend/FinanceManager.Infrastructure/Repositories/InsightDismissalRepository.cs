using FinanceManager.Domain.Entities;
using FinanceManager.Domain.Interfaces.Repositories;
using FinanceManager.Infrastructure.Context;
using Microsoft.EntityFrameworkCore;

namespace FinanceManager.Infrastructure.Repositories;

public class InsightDismissalRepository : Repository<InsightDismissal>, IInsightDismissalRepository, IRepository<InsightDismissal>
{
    public InsightDismissalRepository(AppDbContext _context) : base(_context) { }

    public async Task<HashSet<string>> GetKeysAsync(Guid userId) =>
        (await _dbSet.AsNoTracking().Where(d => d.UserId == userId).Select(d => d.Key).ToListAsync()).ToHashSet();

    public Task<bool> ExistsAsync(Guid userId, string key) => _dbSet.AnyAsync(d => d.UserId == userId && d.Key == key);
}
