using FinanceManager.Domain.Entities;

namespace FinanceManager.Domain.Interfaces.Repositories;

public interface ITransactionRepository : IRepository<Transaction>
{
    /// <summary>The user's transactions in the period, optionally of a single account.</summary>
    Task<List<Transaction>> GetByUserIdAsync(Guid userId, DateTime? start, DateTime? end, Guid? accountId = null);
}
