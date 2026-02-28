using FinanceManager.Aplication.Mediator.Messaging;
using Microsoft.Extensions.DependencyInjection;

namespace FinanceManager.Infrastructure.Messaging;

public class Mediator : IMediator
{
    private readonly IServiceProvider _serviceProvider;

    public Mediator(IServiceProvider _serviceProvider)
    {
        this._serviceProvider = _serviceProvider;
    }

    public Task<TResponse> Send<TResponse>(IRequest<TResponse> request, CancellationToken cancellationToken = default)
    {
        var handlerType = typeof(IRequestHandler<,>).MakeGenericType(request.GetType(), typeof(TResponse));
        var handler = _serviceProvider.GetRequiredService(handlerType);

        var method = handlerType.GetMethod("Handle") 
            ?? throw new InvalidOperationException($"Handler for {request.GetType().Name} does not have a Handle method");

        return (Task<TResponse>)method.Invoke(handler, [request, cancellationToken])!;
    }

    public Task Send(IRequest request, CancellationToken cancellationToken = default)
    {
        var handlerType = typeof(IRequestHandler<>).MakeGenericType(request.GetType());
        var handler = _serviceProvider.GetRequiredService(handlerType);

        var method = handlerType.GetMethod("Handle") 
            ?? throw new InvalidOperationException($"Handler for {request.GetType().Name} does not have a Handle method");

        return (Task)method.Invoke(handler, [request, cancellationToken])!;
    }
}

