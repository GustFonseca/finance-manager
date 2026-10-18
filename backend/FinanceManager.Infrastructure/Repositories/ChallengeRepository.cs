using FinanceManager.Domain.Entities;
using FinanceManager.Domain.Interfaces.Repositories;
using FinanceManager.Infrastructure.Context;
using Microsoft.EntityFrameworkCore;

namespace FinanceManager.Infrastructure.Repositories;

public class ChallengeRepository : Repository<Challenge>, IChallengeRepository, IRepository<Challenge>
{
    public ChallengeRepository(AppDbContext _context) : base(_context) { }

    public async Task<List<Challenge>> GetByUserIdAsync(Guid userId)
    {
        return await _dbSet.Where(c => c.UserId == userId).OrderByDescending(c => c.StartsOn).ToListAsync();
    }
}
