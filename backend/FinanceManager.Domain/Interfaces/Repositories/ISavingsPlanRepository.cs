using FinanceManager.Domain.Entities;

namespace FinanceManager.Domain.Interfaces.Repositories;

public interface ISavingsPlanRepository : IRepository<SavingsPlan>
{
    Task<SavingsPlan?> GetByUserIdAsync(Guid userId);
}
