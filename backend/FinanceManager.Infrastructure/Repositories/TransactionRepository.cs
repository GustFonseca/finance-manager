using FinanceManager.Domain.Entities;
using FinanceManager.Domain.Interfaces.Repositories;
using FinanceManager.Infrastructure.Context;
using Microsoft.EntityFrameworkCore;

namespace FinanceManager.Infrastructure.Repositories;

public class TransactionRepository : Repository<Transaction>, ITransactionRepository, IRepository<Transaction>
{
    public TransactionRepository(AppDbContext _context) : base(_context){}

    public async Task<List<Transaction>> GetByUserIdAsync(Guid userId, DateTime? start, DateTime? end)
    {
        var query = _dbSet
            .Include(t => t.Account)
            .Include(t => t.Category)
            .Where(t => t.UserId == userId);

        if (start.HasValue)
        {
            query = query.Where(t => t.Date >= start.Value);
        }

        if (end.HasValue)
        {
            query = query.Where(t => t.Date <= end.Value);
        }

        return await query.OrderByDescending(t => t.Date).ToListAsync();
    }
}
