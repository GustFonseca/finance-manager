using FinanceManager.Domain.Entities;

namespace FinanceManager.Domain.Interfaces.Repositories;

public interface IStoredFileRepository : IRepository<StoredFile>
{
    Task<List<StoredFile>> GetByFolderIdAsync(Guid folderId);
    Task<List<StoredFile>> GetTrashedAsync(Guid userId);
    Task<Dictionary<Guid, int>> CountActiveByFolderAsync(Guid userId);
    Task UpdateRangeAsync(IEnumerable<StoredFile> files);
    Task DeleteRangeAsync(IEnumerable<StoredFile> files);
}
