using FinanceManager.Domain.Entities;

namespace FinanceManager.Domain.Interfaces.Repositories;

public interface IChallengeRepository : IRepository<Challenge>
{
    Task<List<Challenge>> GetByUserIdAsync(Guid userId);
}
