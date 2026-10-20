using FinanceManager.Domain.Common;

namespace FinanceManager.Aplication.Mediator.Messaging;

public interface IDomainEventHandler<TEvent> where TEvent : IDomainEvent
{
    Task Handle(IReadOnlyList<TEvent> events, CancellationToken cancellationToken);
}
