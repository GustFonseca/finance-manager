using FinanceManager.Domain.Entities;

namespace FinanceManager.Domain.Interfaces.Repositories;

public interface IActivityLogRepository : IRepository<ActivityLog>
{
    /// <summary>Newest first; <paramref name="before"/> pages back through older entries.</summary>
    Task<List<ActivityLog>> GetByUserIdAsync(Guid userId, DateTime? before, int limit);
}
