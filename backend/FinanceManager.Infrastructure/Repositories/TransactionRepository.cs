using FinanceManager.Domain.Entities;
using FinanceManager.Domain.Interfaces.Repositories;
using FinanceManager.Infrastructure.Auditing;
using FinanceManager.Infrastructure.Context;
using Microsoft.EntityFrameworkCore;

namespace FinanceManager.Infrastructure.Repositories;

public class TransactionRepository : Repository<Transaction>, ITransactionRepository, IRepository<Transaction>
{
    public TransactionRepository(AppDbContext _context) : base(_context){}

    public Task<List<Transaction>> GetByUserIdAsync(Guid userId, DateTime? start, DateTime? end, Guid? accountId = null, Guid? merchantId = null) =>
        SearchAsync(userId, new TransactionFilter(start, end, accountId, merchantId));

    public async Task<List<Transaction>> SearchAsync(Guid userId, TransactionFilter filter)
    {
        var query = _dbSet
            .AsNoTrackingWithIdentityResolution()
            .Include(t => t.Account)
            .Include(t => t.Category)
            .Include(t => t.Merchant)
            .Where(t => t.UserId == userId);

        if (filter.Start.HasValue) query = query.Where(t => t.Date >= filter.Start.Value);
        if (filter.End.HasValue) query = query.Where(t => t.Date <= filter.End.Value);
        if (filter.AccountId.HasValue) query = query.Where(t => t.AccountId == filter.AccountId.Value);
        if (filter.MerchantId.HasValue) query = query.Where(t => t.MerchantId == filter.MerchantId.Value);
        if (filter.CategoryId.HasValue) query = query.Where(t => t.CategoryId == filter.CategoryId.Value);
        if (filter.Type.HasValue) query = query.Where(t => t.Type == filter.Type.Value);
        if (!string.IsNullOrWhiteSpace(filter.Search))
        {
            var term = filter.Search.Trim().ToLower();
            var key = filter.SearchKey ?? string.Empty;
            query = query.Where(t => t.Description.ToLower().Contains(term)
                                     || (t.Merchant != null && t.Merchant.Name.ToLower().Contains(term))
                                     || (key != string.Empty && t.Merchant != null && t.Merchant.Key.Contains(key)));
        }

        var ordered = query.OrderByDescending(t => t.Date).ThenByDescending(t => t.CreatedAt);
        return await (filter.Limit is > 0 ? ordered.Take(filter.Limit.Value) : ordered).ToListAsync();
    }

    public async Task<List<Transaction>> GetUncataloguedAsync(int max)
    {
        return await _dbSet
            .Include(t => t.Category)
            .Where(t => t.MerchantId == null && t.CatalogAttemptedAt == null)
            .OrderBy(t => t.CreatedAt)
            .Take(max)
            .ToListAsync();
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
        if (_context.Database.IsRelational())
        {
            var deleted = await _dbSet.Where(t => t.UserId == userId).ExecuteDeleteAsync();
            if (deleted == 0) return 0;
            _context.ActivityLogs.Add(ActivityDescriber.BulkDelete(userId, deleted));
            await _context.SaveChangesAsync();
            return deleted;
        }

        var transactions = await _dbSet.Where(t => t.UserId == userId).ToListAsync();
        if (transactions.Count == 0) return 0;
        _dbSet.RemoveRange(transactions);
        await _context.SaveChangesAsync();
        return transactions.Count;
    }
}
