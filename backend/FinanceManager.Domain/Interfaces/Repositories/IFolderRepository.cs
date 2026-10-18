using FinanceManager.Domain.Entities;

namespace FinanceManager.Domain.Interfaces.Repositories;

public interface IFolderRepository : IRepository<Folder>
{
    Task<List<Folder>> GetByUserIdAsync(Guid userId, bool deleted);
    Task<Folder?> GetSystemFolderAsync(Guid userId);
    Task DeleteRangeAsync(IEnumerable<Folder> folders);
}
