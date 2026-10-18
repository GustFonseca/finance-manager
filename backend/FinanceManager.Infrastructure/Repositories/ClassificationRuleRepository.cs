using FinanceManager.Domain.Entities;
using FinanceManager.Domain.Interfaces.Repositories;
using FinanceManager.Infrastructure.Context;
using Microsoft.EntityFrameworkCore;

namespace FinanceManager.Infrastructure.Repositories;

public class ClassificationRuleRepository : Repository<ClassificationRule>, IClassificationRuleRepository, IRepository<ClassificationRule>
{
    public ClassificationRuleRepository(AppDbContext _context) : base(_context) { }

    public async Task<List<ClassificationRule>> GetActiveAsync()
    {
        return await _dbSet.AsNoTracking()
            .Where(r => r.IsActive)
            .OrderBy(r => r.Type).ThenBy(r => r.Priority)
            .ToListAsync();
    }
}
