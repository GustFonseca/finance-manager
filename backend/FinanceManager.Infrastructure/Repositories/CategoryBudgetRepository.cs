using FinanceManager.Domain.Entities;
using FinanceManager.Domain.Interfaces.Repositories;
using FinanceManager.Infrastructure.Context;
using Microsoft.EntityFrameworkCore;

namespace FinanceManager.Infrastructure.Repositories;

public class CategoryBudgetRepository : Repository<CategoryBudget>, ICategoryBudgetRepository, IRepository<CategoryBudget>
{
    public CategoryBudgetRepository(AppDbContext _context) : base(_context) { }

    public async Task<List<CategoryBudget>> GetByUserIdAsync(Guid userId)
    {
        return await _dbSet.Where(b => b.UserId == userId).ToListAsync();
    }

    public async Task<CategoryBudget?> GetByCategoryIdAsync(Guid userId, Guid categoryId)
    {
        return await _dbSet.FirstOrDefaultAsync(b => b.UserId == userId && b.CategoryId == categoryId);
    }
}
