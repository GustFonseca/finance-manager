using FinanceManager.Domain.Entities;
using FinanceManager.Domain.Interfaces.Repositories;
using FinanceManager.Infrastructure.Context;
using Microsoft.EntityFrameworkCore;

namespace FinanceManager.Infrastructure.Repositories;

public class AccountRepository : Repository<Account>, IAccountRepository, IRepository<Account>
{
    public AccountRepository(AppDbContext _context) : base(_context) {}

    public async Task<List<Account>> GetByUserIdAsync(Guid userId)
    {
        return await _dbSet.Where(a => a.UserId == userId).ToListAsync();
    }
}

