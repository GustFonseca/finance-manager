using System.Collections;
using System.Collections.Concurrent;
using System.Reflection;
using FinanceManager.Aplication.Mediator.Messaging;
using FinanceManager.Domain.Common;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace FinanceManager.Infrastructure.Messaging;

public sealed class DomainEventDispatcher(IServiceProvider services, ILogger<DomainEventDispatcher>? logger = null)
{
    private static readonly ConcurrentDictionary<Type, (Type Handler, MethodInfo Handle, Type List)> Shapes = new();

    public async Task DispatchAsync(IReadOnlyList<IDomainEvent> events)
    {
        foreach (var group in events.GroupBy(e => e.GetType()))
        {
            var shape = Shapes.GetOrAdd(group.Key, ShapeOf);
            var batch = (IList)Activator.CreateInstance(shape.List)!;
            foreach (var domainEvent in group) batch.Add(domainEvent);

            foreach (var handler in services.GetServices(shape.Handler))
            {
                try
                {
                    await (Task)shape.Handle.Invoke(handler, BindingFlags.DoNotWrapExceptions, null, [batch, CancellationToken.None], null)!;
                }
                catch (Exception ex)
                {
                    logger?.LogWarning(ex, "A handler for {Event} failed after the commit", group.Key.Name);
                }
            }
        }
    }

    private static (Type, MethodInfo, Type) ShapeOf(Type eventType)
    {
        var handler = typeof(IDomainEventHandler<>).MakeGenericType(eventType);
        return (handler, handler.GetMethod("Handle")!, typeof(List<>).MakeGenericType(eventType));
    }
}
