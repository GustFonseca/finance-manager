using FinanceManager.Domain.Entities;
using FinanceManager.Domain.Interfaces.Repositories;
using FinanceManager.Infrastructure.Context;
using Microsoft.EntityFrameworkCore;

namespace FinanceManager.Infrastructure.Repositories;

public class UserRepository : Repository<User>, IUserRepository, IRepository<User>
{
    public UserRepository(AppDbContext _context) : base(_context){}

    public async Task<User?> GetByGoogleIdAsync(string googleId)
    {
        return await _dbSet.FirstOrDefaultAsync(user => user.GoogleId.Equals(googleId));
    }
}
