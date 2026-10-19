using System.Reflection;
﻿using FinanceManager.Aplication.Exceptions;
using FinanceManager.Aplication.Mediator.Messaging;
using FinanceManager.Infrastructure.Context;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace FinanceManager.Infrastructure.Messaging;

public class Mediator : IMediator
{
    public const int MaxAttempts = 5;
    public const int RetryDelayMilliseconds = 25;
    public const string ConflictMessage = "Outra alteração foi feita ao mesmo tempo. Tente novamente.";

    private readonly IServiceProvider _serviceProvider;
    private readonly UnitOfWork _unitOfWork;
    private readonly ILogger<Mediator>? _logger;

    public Mediator(IServiceProvider serviceProvider)
    {
        _serviceProvider = serviceProvider;
        _unitOfWork = serviceProvider.GetService<UnitOfWork>() ?? new UnitOfWork();
        _logger = serviceProvider.GetService<ILogger<Mediator>>();
    }

    public Task<TResponse> Send<TResponse>(IRequest<TResponse> request, CancellationToken cancellationToken = default)
    {
        var handlerType = typeof(IRequestHandler<,>).MakeGenericType(request.GetType(), typeof(TResponse));
        var handler = _serviceProvider.GetRequiredService(handlerType);

        var method = handlerType.GetMethod("Handle")
            ?? throw new InvalidOperationException($"Handler for {request.GetType().Name} does not have a Handle method");

        return Run(request, () => (Task<TResponse>)Invoke(method, handler, request, cancellationToken), cancellationToken);
    }

    public async Task Send(IRequest request, CancellationToken cancellationToken = default)
    {
        var handlerType = typeof(IRequestHandler<>).MakeGenericType(request.GetType());
        var handler = _serviceProvider.GetRequiredService(handlerType);

        var method = handlerType.GetMethod("Handle")
            ?? throw new InvalidOperationException($"Handler for {request.GetType().Name} does not have a Handle method");

        await Run(request, async () =>
        {
            await Invoke(method, handler, request, cancellationToken);
            return true;
        }, cancellationToken);
    }

    private async Task<T> Run<T>(object request, Func<Task<T>> handle, CancellationToken cancellationToken)
    {
        if (_unitOfWork.Depth > 0) return await handle();

        var db = _serviceProvider.GetRequiredService<AppDbContext>();
        var interfaces = request.GetType().GetInterfaces();
        var isCommand = interfaces.Any(i => i == typeof(ICommand) || (i.IsGenericType && i.GetGenericTypeDefinition() == typeof(ICommand<>)));
        var ownsTransaction = isCommand
            && !interfaces.Contains(typeof(IRunsOutsideTransaction))
            && db.Database.IsRelational()
            && db.Database.CurrentTransaction == null;

        for (var attempt = 1; ; attempt++)
        {
            _unitOfWork.Depth++;
            try
            {
                var result = ownsTransaction ? await InTransaction(db, handle, cancellationToken) : await handle();
                _unitOfWork.Depth--;
                await _unitOfWork.FlushAsync(_logger);
                return result;
            }
            catch (Exception ex) when (IsConflict(ex))
            {
                _unitOfWork.Depth--;
                _unitOfWork.Discard();
                db.ChangeTracker.Clear();
                var safeToRetry = ownsTransaction || !isCommand;
                if (!safeToRetry || attempt >= MaxAttempts) throw new ConflictException(ConflictMessage);
                _logger?.LogInformation(ex, "Concurrent change detected; running {Request} again (attempt {Attempt})", request.GetType().Name, attempt + 1);
                await Task.Delay(Random.Shared.Next(RetryDelayMilliseconds, RetryDelayMilliseconds * 3) * attempt, cancellationToken);
            }
            catch
            {
                _unitOfWork.Depth--;
                _unitOfWork.Discard();
                throw;
            }
        }
    }

    private static Task Invoke(MethodInfo method, object handler, object request, CancellationToken cancellationToken) =>
        (Task)method.Invoke(handler, BindingFlags.DoNotWrapExceptions, null, [request, cancellationToken], null)!;

    private static bool IsConflict(Exception exception) =>
        exception is DbUpdateConcurrencyException || DbErrors.IsUniqueViolation(exception);

    private static async Task<T> InTransaction<T>(AppDbContext db, Func<Task<T>> handle, CancellationToken cancellationToken)
    {
        await using var transaction = await db.Database.BeginTransactionAsync(cancellationToken);
        var result = await handle();
        await transaction.CommitAsync(cancellationToken);
        return result;
    }
}
