using FinanceManager.Domain.Entities;
using FinanceManager.Domain.Interfaces.Repositories;
using FinanceManager.Infrastructure.Context;
using Microsoft.EntityFrameworkCore;

namespace FinanceManager.Infrastructure.Repositories;

public class TransactionRepository : Repository<Transaction>, ITransactionRepository, IRepository<Transaction>
{
    public TransactionRepository(AppDbContext _context) : base(_context){}

    public async Task<List<Transaction>> GetByUserIdAsync(Guid userId, DateTime? start, DateTime? end, Guid? accountId = null, Guid? merchantId = null)
    {
        var query = _dbSet
            .Include(t => t.Account)
            .Include(t => t.Category)
            .Include(t => t.Merchant)
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

        if (merchantId.HasValue)
        {
            query = query.Where(t => t.MerchantId == merchantId.Value);
        }

        return await query.OrderByDescending(t => t.Date).ToListAsync();
    }

    public async Task<List<Transaction>> GetUncataloguedAsync()
    {
        return await _dbSet.Include(t => t.Category).Where(t => t.MerchantId == null).ToListAsync();
    }

    public async Task<List<Transaction>> GetByMerchantIdAsync(Guid merchantId)
    {
        return await _dbSet.Where(t => t.MerchantId == merchantId).ToListAsync();
    }

    public async Task UpdateRangeAsync(IEnumerable<Transaction> transactions)
    {
        _dbSet.UpdateRange(transactions);
        await _context.SaveChangesAsync();
    }

    public async Task CreateRangeAsync(IEnumerable<Transaction> transactions)
    {
        await _dbSet.AddRangeAsync(transactions);
        await _context.SaveChangesAsync();
    }

    public Task<bool> ExistsForAccountAsync(Guid accountId) => _dbSet.AnyAsync(t => t.AccountId == accountId);

    public Task<bool> ExistsForCategoryAsync(Guid categoryId) => _dbSet.AnyAsync(t => t.CategoryId == categoryId);

    public async Task<int> DeleteByUserIdAsync(Guid userId)
    {
        var transactions = await _dbSet.Where(t => t.UserId == userId).ToListAsync();
        if (transactions.Count == 0) return 0;
        _dbSet.RemoveRange(transactions);
        await _context.SaveChangesAsync();
        return transactions.Count;
    }
}
