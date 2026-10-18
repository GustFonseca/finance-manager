using FinanceManager.Domain.Entities;

namespace FinanceManager.Domain.Interfaces.Repositories;

public interface ITransactionRepository : IRepository<Transaction>
{
    Task<List<Transaction>> GetByUserIdAsync(Guid userId, DateTime? start, DateTime? end, Guid? accountId = null, Guid? merchantId = null);
    Task<List<Transaction>> GetUncataloguedAsync();
    Task<List<Transaction>> GetByMerchantIdAsync(Guid merchantId);
    Task UpdateRangeAsync(IEnumerable<Transaction> transactions);
    Task CreateRangeAsync(IEnumerable<Transaction> transactions);
    Task<bool> ExistsForAccountAsync(Guid accountId);
    Task<bool> ExistsForCategoryAsync(Guid categoryId);
    Task<int> DeleteByUserIdAsync(Guid userId);
}
