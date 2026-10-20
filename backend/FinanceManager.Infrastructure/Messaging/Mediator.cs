using System.Collections.Concurrent;
using System.Reflection;
using FinanceManager.Aplication.Mediator.Messaging;
using FinanceManager.Infrastructure.Context;
using FinanceManager.Infrastructure.Messaging.Pipeline;
using Microsoft.Extensions.DependencyInjection;

namespace FinanceManager.Infrastructure.Messaging;

public class Mediator : IMediator
{
    private static readonly ConcurrentDictionary<(Type Request, Type? Response), (Type Handler, MethodInfo Handle)> Handlers = new();

    private readonly IServiceProvider _serviceProvider;
    private readonly RequestNesting _nesting;

    public Mediator(IServiceProvider serviceProvider)
    {
        _serviceProvider = serviceProvider;
        _nesting = serviceProvider.GetService<RequestNesting>() ?? new RequestNesting();
    }

    public Task<TResponse> Send<TResponse>(IRequest<TResponse> request, CancellationToken cancellationToken = default)
    {
        var (handler, handle) = Resolve(request.GetType(), typeof(TResponse));
        return Run(request, () => (Task<TResponse>)Invoke(handle, handler, request, cancellationToken), cancellationToken);
    }

    public Task Send(IRequest request, CancellationToken cancellationToken = default)
    {
        var (handler, handle) = Resolve(request.GetType(), null);
        return Run(request, async () =>
        {
            await Invoke(handle, handler, request, cancellationToken);
            return true;
        }, cancellationToken);
    }

    private (object Handler, MethodInfo Handle) Resolve(Type requestType, Type? responseType)
    {
        var shape = Handlers.GetOrAdd((requestType, responseType), key =>
        {
            var handlerType = key.Response == null
                ? typeof(IRequestHandler<>).MakeGenericType(key.Request)
                : typeof(IRequestHandler<,>).MakeGenericType(key.Request, key.Response);
            return (handlerType, handlerType.GetMethod("Handle")!);
        });
        return (_serviceProvider.GetRequiredService(shape.Handler), shape.Handle);
    }

    private async Task<T> Run<T>(object request, Func<Task<T>> handle, CancellationToken cancellationToken)
    {
        if (_nesting.Depth > 0) return await handle();

        var context = RequestContext.For(request, _serviceProvider.GetRequiredService<AppDbContext>());
        Func<Task<T>> innermost = async () =>
        {
            _nesting.Depth++;
            try
            {
                return await handle();
            }
            finally
            {
                _nesting.Depth--;
            }
        };
        var pipeline = _serviceProvider.GetServices<IRequestBehavior>()
            .Reverse()
            .Aggregate(innermost, (next, behavior) => () => behavior.Handle(context, next, cancellationToken));
        return await pipeline();
    }

    private static Task Invoke(MethodInfo method, object handler, object request, CancellationToken cancellationToken) =>
        (Task)method.Invoke(handler, BindingFlags.DoNotWrapExceptions, null, [request, cancellationToken], null)!;
}
