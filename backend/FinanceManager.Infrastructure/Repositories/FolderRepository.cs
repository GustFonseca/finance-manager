using FinanceManager.Domain.Entities;
using FinanceManager.Domain.Interfaces.Repositories;
using FinanceManager.Infrastructure.Context;
using Microsoft.EntityFrameworkCore;

namespace FinanceManager.Infrastructure.Repositories;

public class FolderRepository : Repository<Folder>, IFolderRepository, IRepository<Folder>
{
    public FolderRepository(AppDbContext _context) : base(_context) { }

    public async Task<List<Folder>> GetByUserIdAsync(Guid userId, bool deleted)
    {
        return await _dbSet
            .Where(f => f.UserId == userId && (f.DeletedAt != null) == deleted)
            .OrderByDescending(f => f.IsSystem)
            .ThenBy(f => f.CreatedAt)
            .ToListAsync();
    }

    public async Task<Folder?> GetSystemFolderAsync(Guid userId)
    {
        return await _dbSet.FirstOrDefaultAsync(f => f.UserId == userId && f.IsSystem);
    }

    public async Task DeleteRangeAsync(IEnumerable<Folder> folders)
    {
        _dbSet.RemoveRange(folders);
        await _context.SaveChangesAsync();
    }
}
