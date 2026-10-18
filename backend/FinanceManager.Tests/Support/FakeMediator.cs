using FinanceManager.Aplication.Mediator.Messaging;

namespace FinanceManager.Tests.Support;

public sealed class FakeMediator : IMediator
{
    private readonly Dictionary<Type, Func<object, object?>> _responses = [];

    public List<object> Sent { get; } = [];

    public FakeMediator Returns<TRequest>(Func<TRequest, object?> response)
    {
        _responses[typeof(TRequest)] = request => response((TRequest)request);
        return this;
    }

    public FakeMediator Throws<TRequest>(Exception exception)
    {
        _responses[typeof(TRequest)] = _ => throw exception;
        return this;
    }

    public Task<TResponse> Send<TResponse>(IRequest<TResponse> request, CancellationToken cancellationToken = default)
    {
        Sent.Add(request);
        return Task.FromResult(_responses.TryGetValue(request.GetType(), out var respond) ? (TResponse)respond(request)! : default!);
    }

    public Task Send(IRequest request, CancellationToken cancellationToken = default)
    {
        Sent.Add(request);
        if (_responses.TryGetValue(request.GetType(), out var respond)) respond(request);
        return Task.CompletedTask;
    }
}
