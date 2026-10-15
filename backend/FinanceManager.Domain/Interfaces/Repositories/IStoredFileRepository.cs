using FinanceManager.Domain.Entities;

namespace FinanceManager.Domain.Interfaces.Repositories;

public interface IStoredFileRepository : IRepository<StoredFile>
{
    /// <summary>Every file of the folder, trashed or not.</summary>
    Task<List<StoredFile>> GetByFolderIdAsync(Guid folderId);
    /// <summary>Files trashed on their own (their folder is not in the trash).</summary>
    Task<List<StoredFile>> GetTrashedAsync(Guid userId);
    /// <summary>Number of files outside the trash, per folder.</summary>
    Task<Dictionary<Guid, int>> CountActiveByFolderAsync(Guid userId);
    Task UpdateRangeAsync(IEnumerable<StoredFile> files);
    Task DeleteRangeAsync(IEnumerable<StoredFile> files);
}
