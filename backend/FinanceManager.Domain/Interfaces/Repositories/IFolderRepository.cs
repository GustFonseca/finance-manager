using FinanceManager.Domain.Entities;

namespace FinanceManager.Domain.Interfaces.Repositories;

public interface IFolderRepository : IRepository<Folder>
{
    /// <summary>The user's folders in the trash (<paramref name="deleted"/>) or outside it.</summary>
    Task<List<Folder>> GetByUserIdAsync(Guid userId, bool deleted);
    Task<Folder?> GetSystemFolderAsync(Guid userId);
    Task DeleteRangeAsync(IEnumerable<Folder> folders);
}
