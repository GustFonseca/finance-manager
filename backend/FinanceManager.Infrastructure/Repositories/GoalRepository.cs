using FinanceManager.Domain.Entities;
using FinanceManager.Domain.Interfaces.Repositories;
using FinanceManager.Infrastructure.Context;
using Microsoft.EntityFrameworkCore;

namespace FinanceManager.Infrastructure.Repositories;

public class GoalRepository : Repository<Goal>, IGoalRepository, IRepository<Goal>
{
    public GoalRepository(AppDbContext _context) : base(_context){}

    public async Task<List<Goal>> GetByUserIdAsync(Guid userId)
    {
        return await _dbSet.Where(g => g.UserId == userId).OrderByDescending(g => g.CreatedAt).ToListAsync();
    }
}
