using FinanceManager.Domain.Entities;

namespace FinanceManager.Domain.Interfaces.Repositories;

public interface IActivityLogRepository : IRepository<ActivityLog>
{
    Task<List<ActivityLog>> GetByUserIdAsync(Guid userId, DateTime? before, int limit);
}
