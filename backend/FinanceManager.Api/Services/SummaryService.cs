using FinanceManager.Api.Data;
using FinanceManager.Api.DTOs;
using FinanceManager.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace FinanceManager.Api.Services;

public class SummaryService
{
    private readonly AppDbContext _db;

    public SummaryService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<FinancialSummaryDto> GetSummary(Guid userId, DateTime? start, DateTime? end)
    {
        var query = _db.Transactions
            .Include(t => t.Category)
            .Where(t => t.UserId == userId);

        if (start.HasValue)
            query = query.Where(t => t.Date >= start.Value);
        if (end.HasValue)
            query = query.Where(t => t.Date <= end.Value);

        var transactions = await query.ToListAsync();

        var totalIncome = transactions.Where(t => t.Type == TransactionType.INCOME).Sum(t => t.AmountCents);
        var totalExpense = transactions.Where(t => t.Type == TransactionType.EXPENSE).Sum(t => t.AmountCents);

        var byCategory = transactions
            .GroupBy(t => new { t.CategoryId, t.Category.Name, t.Category.Color })
            .Select(g => new CategorySummaryDto
            {
                CategoryId = g.Key.CategoryId,
                CategoryName = g.Key.Name,
                Color = g.Key.Color,
                TotalCents = g.Sum(t => t.AmountCents)
            })
            .OrderByDescending(c => c.TotalCents)
            .ToList();

        return new FinancialSummaryDto
        {
            TotalIncomeCents = totalIncome,
            TotalExpenseCents = totalExpense,
            BalanceCents = totalIncome - totalExpense,
            ByCategory = byCategory
        };
    }
}
