using FinanceManager.Domain.Entities;
using FinanceManager.Domain.Interfaces.Repositories;
using FinanceManager.Infrastructure.Context;
using Microsoft.EntityFrameworkCore;

namespace FinanceManager.Infrastructure.Repositories;

public class StoredFileRepository : Repository<StoredFile>, IStoredFileRepository, IRepository<StoredFile>
{
    public StoredFileRepository(AppDbContext _context) : base(_context) { }

    public async Task<List<StoredFile>> GetByFolderIdAsync(Guid folderId)
    {
        return await _dbSet.Where(f => f.FolderId == folderId).OrderBy(f => f.Name).ToListAsync();
    }

    public async Task<List<StoredFile>> GetByFolderIdsAsync(IReadOnlyCollection<Guid> folderIds)
    {
        if (folderIds.Count == 0) return [];
        return await _dbSet.Where(f => folderIds.Contains(f.FolderId)).ToListAsync();
    }

    public async Task<List<StoredFile>> GetTrashedAsync(Guid userId)
    {
        return await _dbSet
            .Include(f => f.Folder)
            .Where(f => f.UserId == userId && f.DeletedAt != null && f.Folder.DeletedAt == null)
            .OrderByDescending(f => f.DeletedAt)
            .ToListAsync();
    }

    public async Task<Dictionary<Guid, int>> CountActiveByFolderAsync(Guid userId)
    {
        return await _dbSet
            .Where(f => f.UserId == userId && f.DeletedAt == null)
            .GroupBy(f => f.FolderId)
            .ToDictionaryAsync(g => g.Key, g => g.Count());
    }

    public async Task UpdateRangeAsync(IEnumerable<StoredFile> files)
    {
        _dbSet.UpdateRange(files);
        await _context.SaveChangesAsync();
    }

    public async Task DeleteRangeAsync(IEnumerable<StoredFile> files)
    {
        _dbSet.RemoveRange(files);
        await _context.SaveChangesAsync();
    }
}
