using FinanceManager.Domain.Entities;
using FinanceManager.Domain.Interfaces.Repositories;
using FinanceManager.Infrastructure.Context;
using Microsoft.EntityFrameworkCore;

namespace FinanceManager.Infrastructure.Repositories;

public class SubscriptionDecisionRepository : Repository<SubscriptionDecision>, ISubscriptionDecisionRepository, IRepository<SubscriptionDecision>
{
    public SubscriptionDecisionRepository(AppDbContext _context) : base(_context) { }

    public Task<List<SubscriptionDecision>> GetByUserIdAsync(Guid userId) =>
        _dbSet.AsNoTracking().Where(d => d.UserId == userId).ToListAsync();

    public Task<SubscriptionDecision?> GetAsync(Guid userId, string merchantKey) =>
        _dbSet.FirstOrDefaultAsync(d => d.UserId == userId && d.MerchantKey == merchantKey);
}
