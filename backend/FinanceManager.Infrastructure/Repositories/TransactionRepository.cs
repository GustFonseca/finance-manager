using FinanceManager.Domain.Entities;
using FinanceManager.Domain.Interfaces.Repositories;
using FinanceManager.Infrastructure.Context;
using Microsoft.EntityFrameworkCore;

namespace FinanceManager.Infrastructure.Repositories;

public class TransactionRepository : Repository<Transaction>, ITransactionRepository, IRepository<Transaction>
{
    public TransactionRepository(AppDbContext _context) : base(_context){}

    public async Task<List<Transaction>> GetByUserIdAsync(Guid userId, DateTime? start, DateTime? end, Guid? accountId = null)
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

        if (accountId.HasValue)
        {
            query = query.Where(t => t.AccountId == accountId.Value);
        }

        return await query.OrderByDescending(t => t.Date).ToListAsync();
    }

    public async Task<int> DeleteByUserIdAsync(Guid userId)
    {
        // Loaded and removed through the change tracker (not ExecuteDelete) so the
        // activity history sees the deletion.
        var transactions = await _dbSet.Where(t => t.UserId == userId).ToListAsync();
        if (transactions.Count == 0) return 0;
        _dbSet.RemoveRange(transactions);
        await _context.SaveChangesAsync();
        return transactions.Count;
    }
}
