using FinanceManager.Domain.Entities;
using FinanceManager.Domain.Interfaces.Repositories;
using FinanceManager.Infrastructure.Context;
using Microsoft.EntityFrameworkCore;

namespace FinanceManager.Infrastructure.Repositories;

public class ActivityLogRepository : Repository<ActivityLog>, IActivityLogRepository, IRepository<ActivityLog>
{
    public ActivityLogRepository(AppDbContext _context) : base(_context) { }

    public async Task<List<ActivityLog>> GetByUserIdAsync(Guid userId, DateTime? before, int limit)
    {
        return await _dbSet
            .AsNoTracking()
            .Where(a => a.UserId == userId && (before == null || a.CreatedAt < before))
            .OrderByDescending(a => a.CreatedAt)
            .Take(limit)
            .ToListAsync();
    }
}
