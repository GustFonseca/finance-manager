using FinanceManager.Domain.Entities;

namespace FinanceManager.Domain.Interfaces.Repositories;

public interface ICategoryBudgetRepository : IRepository<CategoryBudget>
{
    Task<List<CategoryBudget>> GetByUserIdAsync(Guid userId);
    Task<CategoryBudget?> GetByCategoryIdAsync(Guid userId, Guid categoryId);
}
