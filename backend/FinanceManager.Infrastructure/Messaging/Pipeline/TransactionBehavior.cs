using FinanceManager.Infrastructure.Context;

namespace FinanceManager.Infrastructure.Messaging.Pipeline;

public sealed class TransactionBehavior(AppDbContext db) : IRequestBehavior
{
    public async Task<T> Handle<T>(RequestContext context, Func<Task<T>> next, CancellationToken cancellationToken)
    {
        if (!context.OwnsTransaction) return await next();

        await using var transaction = await db.Database.BeginTransactionAsync(cancellationToken);
        var result = await next();
        await transaction.CommitAsync(cancellationToken);
        return result;
    }
}
