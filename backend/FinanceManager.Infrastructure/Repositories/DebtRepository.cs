using FinanceManager.Domain.Entities;
using FinanceManager.Domain.Interfaces.Repositories;
using FinanceManager.Infrastructure.Context;
using Microsoft.EntityFrameworkCore;

namespace FinanceManager.Infrastructure.Repositories;

public class DebtRepository : Repository<Debt>, IDebtRepository, IRepository<Debt>
{
    public DebtRepository(AppDbContext _context) : base(_context) { }

    public Task<List<Debt>> GetByUserIdAsync(Guid userId) =>
        _dbSet.AsNoTracking().Where(d => d.UserId == userId).OrderBy(d => d.Name).ToListAsync();
}
