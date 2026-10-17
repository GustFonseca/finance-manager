using FinanceManager.Domain.Entities;
using FinanceManager.Domain.Interfaces.Repositories;
using FinanceManager.Infrastructure.Context;
using Microsoft.EntityFrameworkCore;

namespace FinanceManager.Infrastructure.Repositories;

public class SavingsPlanRepository : Repository<SavingsPlan>, ISavingsPlanRepository, IRepository<SavingsPlan>
{
    public SavingsPlanRepository(AppDbContext _context) : base(_context) { }

    public async Task<SavingsPlan?> GetByUserIdAsync(Guid userId)
    {
        return await _dbSet.FirstOrDefaultAsync(p => p.UserId == userId);
    }
}
