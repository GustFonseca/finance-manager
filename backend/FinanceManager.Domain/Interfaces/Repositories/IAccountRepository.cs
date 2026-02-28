using FinanceManager.Domain.Entities;

namespace FinanceManager.Domain.Interfaces.Repositories;

public interface IAccountRepository : IRepository<Account>
{
    Task<List<Account>> GetByUserIdAsync(Guid userId);
}

