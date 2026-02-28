using FinanceManager.Domain.Entities;

namespace FinanceManager.Domain.Interfaces.Repositories;

public interface IGoalRepository : IRepository<Goal>
{
    Task<List<Goal>> GetByUserIdAsync(Guid userId);
}
