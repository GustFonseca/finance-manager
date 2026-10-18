using FinanceManager.Aplication.Mediator.Messaging;
using FinanceManager.Infrastructure.Context;
using Microsoft.EntityFrameworkCore;
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

        return InTransactionIfCommand(request, () => (Task<TResponse>)method.Invoke(handler, [request, cancellationToken])!, cancellationToken);
    }

    public async Task Send(IRequest request, CancellationToken cancellationToken = default)
    {
        var handlerType = typeof(IRequestHandler<>).MakeGenericType(request.GetType());
        var handler = _serviceProvider.GetRequiredService(handlerType);

        var method = handlerType.GetMethod("Handle")
            ?? throw new InvalidOperationException($"Handler for {request.GetType().Name} does not have a Handle method");

        await InTransactionIfCommand(request, async () =>
        {
            await (Task)method.Invoke(handler, [request, cancellationToken])!;
            return true;
        }, cancellationToken);
    }

    private async Task<T> InTransactionIfCommand<T>(object request, Func<Task<T>> handle, CancellationToken cancellationToken)
    {
        var isCommand = request.GetType().GetInterfaces()
            .Any(i => i == typeof(ICommand) || (i.IsGenericType && i.GetGenericTypeDefinition() == typeof(ICommand<>)));
        var db = _serviceProvider.GetRequiredService<AppDbContext>();
        if (!isCommand || !db.Database.IsRelational() || db.Database.CurrentTransaction != null)
            return await handle();

        await using var transaction = await db.Database.BeginTransactionAsync(cancellationToken);
        var result = await handle();
        await transaction.CommitAsync(cancellationToken);
        return result;
    }
}
