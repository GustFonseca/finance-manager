using FinanceManager.Infrastructure.Context;

namespace FinanceManager.Infrastructure.Messaging.Pipeline;

public sealed class DomainEventsBehavior(AppDbContext db, DomainEventDispatcher dispatcher) : IRequestBehavior
{
    public async Task<T> Handle<T>(RequestContext context, Func<Task<T>> next, CancellationToken cancellationToken)
    {
        T result;
        try
        {
            result = await next();
        }
        catch
        {
            db.DiscardDomainEvents();
            throw;
        }
        await dispatcher.DispatchAsync(db.TakeDomainEvents());
        return result;
    }
}
