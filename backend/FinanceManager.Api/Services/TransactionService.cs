using FinanceManager.Api.Data;
using FinanceManager.Api.DTOs;
using FinanceManager.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace FinanceManager.Api.Services;

public class TransactionService
{
    private readonly AppDbContext _db;

    public TransactionService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<Transaction> Add(Guid userId, CreateTransactionRequest request)
    {
        var account = await _db.Accounts.FirstOrDefaultAsync(a => a.Id == request.AccountId && a.UserId == userId)
            ?? throw new InvalidOperationException("Account not found");

        var category = await _db.Categories.FirstOrDefaultAsync(c => c.Id == request.CategoryId && c.UserId == userId)
            ?? throw new InvalidOperationException("Category not found");

        var transaction = new Transaction
        {
            UserId = userId,
            AccountId = request.AccountId,
            CategoryId = request.CategoryId,
            Type = request.Type,
            AmountCents = request.AmountCents,
            Description = request.Description,
            Date = request.Date,
            Recurrence = request.Recurrence
        };

        // Update account balance
        if (transaction.Type == TransactionType.INCOME)
            account.BalanceCents += transaction.AmountCents;
        else
            account.BalanceCents -= transaction.AmountCents;

        _db.Transactions.Add(transaction);
        await _db.SaveChangesAsync();

        return transaction;
    }

    public async Task Remove(Guid userId, Guid transactionId)
    {
        var transaction = await _db.Transactions
            .FirstOrDefaultAsync(t => t.Id == transactionId && t.UserId == userId)
            ?? throw new InvalidOperationException("Transaction not found");

        var account = await _db.Accounts.FirstAsync(a => a.Id == transaction.AccountId);

        // Revert balance
        if (transaction.Type == TransactionType.INCOME)
            account.BalanceCents -= transaction.AmountCents;
        else
            account.BalanceCents += transaction.AmountCents;

        _db.Transactions.Remove(transaction);
        await _db.SaveChangesAsync();
    }

    public async Task<List<Transaction>> GetByDateRange(Guid userId, DateTime? start, DateTime? end)
    {
        var query = _db.Transactions
            .Include(t => t.Account)
            .Include(t => t.Category)
            .Where(t => t.UserId == userId);

        if (start.HasValue)
            query = query.Where(t => t.Date >= start.Value);
        if (end.HasValue)
            query = query.Where(t => t.Date <= end.Value);

        return await query.OrderByDescending(t => t.Date).ToListAsync();
    }
}
