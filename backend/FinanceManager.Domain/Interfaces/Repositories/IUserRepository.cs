using FinanceManager.Domain.Entities;

namespace FinanceManager.Domain.Interfaces.Repositories;

public interface IUserRepository : IRepository<User>
{
    Task<User?> GetByGoogleIdAsync(string googleId);
    Task<List<UserActivitySummary>> GetActivitySummaryAsync();
}
