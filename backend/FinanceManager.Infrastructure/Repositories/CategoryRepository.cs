using FinanceManager.Domain.Entities;
using FinanceManager.Domain.Enuns;
using FinanceManager.Domain.Interfaces.Repositories;
using FinanceManager.Infrastructure.Context;
using Microsoft.EntityFrameworkCore;

namespace FinanceManager.Infrastructure.Repositories;

public class CategoryRepository : Repository<Category>, ICategoryRepository, IRepository<Category>
{
    public CategoryRepository(AppDbContext _context) : base(_context){}

    public async Task<List<Category>> GetByUserIdAsync(Guid userId)
    {
        return await _dbSet.Where(c => c.UserId == userId).OrderBy(c => c.Name).ToListAsync();
    }

    public async Task<List<Category>> GetByUserIdAndTypeAsync(Guid userId, CategoryType type)
    {
        return await _dbSet.Where(c => c.UserId == userId && c.Type == type).OrderBy(c => c.Name).ToListAsync();
    }
}
