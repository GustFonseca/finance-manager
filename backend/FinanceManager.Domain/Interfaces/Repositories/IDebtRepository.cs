using FinanceManager.Domain.Entities;

namespace FinanceManager.Domain.Interfaces.Repositories;

public interface IDebtRepository : IRepository<Debt>
{
    Task<List<Debt>> GetByUserIdAsync(Guid userId);
}
