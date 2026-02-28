using FinanceManager.Domain.Entities;
using FinanceManager.Domain.Enuns;

namespace FinanceManager.Domain.Interfaces.Repositories;

public interface ICategoryRepository : IRepository<Category>
{
    Task<List<Category>> GetByUserIdAsync(Guid userId);
    Task<List<Category>> GetByUserIdAndTypeAsync(Guid userId, CategoryType type);
}
