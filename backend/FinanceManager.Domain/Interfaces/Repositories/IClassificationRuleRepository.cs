using FinanceManager.Domain.Entities;

namespace FinanceManager.Domain.Interfaces.Repositories;

public interface IClassificationRuleRepository : IRepository<ClassificationRule>
{
    Task<List<ClassificationRule>> GetActiveAsync();
}
