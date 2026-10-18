using FinanceManager.Domain.Entities;

namespace FinanceManager.Domain.Interfaces.Repositories;

public interface ITransactionRepository : IRepository<Transaction>
{
    /// <summary>The user's transactions in the period, optionally of a single account or merchant.</summary>
    Task<List<Transaction>> GetByUserIdAsync(Guid userId, DateTime? start, DateTime? end, Guid? accountId = null, Guid? merchantId = null);
    /// <summary>Transactions of every user not yet filed under a merchant, with their category.</summary>
    Task<List<Transaction>> GetUncataloguedAsync();
    Task<List<Transaction>> GetByMerchantIdAsync(Guid merchantId);
    Task UpdateRangeAsync(IEnumerable<Transaction> transactions);
    /// <summary>Deletes every transaction of the user and returns how many there were.</summary>
    Task<int> DeleteByUserIdAsync(Guid userId);
}
