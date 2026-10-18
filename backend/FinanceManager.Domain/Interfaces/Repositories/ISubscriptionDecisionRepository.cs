using FinanceManager.Domain.Entities;

namespace FinanceManager.Domain.Interfaces.Repositories;

public interface ISubscriptionDecisionRepository : IRepository<SubscriptionDecision>
{
    Task<List<SubscriptionDecision>> GetByUserIdAsync(Guid userId);
    Task<SubscriptionDecision?> GetAsync(Guid userId, string merchantKey);
}
