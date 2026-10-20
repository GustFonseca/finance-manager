namespace FinanceManager.Infrastructure.Messaging.Pipeline;

public interface IRequestBehavior
{
    Task<T> Handle<T>(RequestContext context, Func<Task<T>> next, CancellationToken cancellationToken);
}
