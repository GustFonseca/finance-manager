using FinanceManager.Domain.Entities;

namespace FinanceManager.Domain.Interfaces.Repositories;

public interface IInsightDismissalRepository : IRepository<InsightDismissal>
{
    Task<HashSet<string>> GetKeysAsync(Guid userId);
    Task<bool> ExistsAsync(Guid userId, string key);
}
