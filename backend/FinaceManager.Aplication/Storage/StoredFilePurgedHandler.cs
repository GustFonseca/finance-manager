using FinanceManager.Aplication.Mediator.Messaging;
using FinanceManager.Domain.Events;

namespace FinanceManager.Aplication.Storage;

public sealed class StoredFilePurgedHandler(IFileStorage storage) : IDomainEventHandler<StoredFilePurged>
{
    public Task Handle(IReadOnlyList<StoredFilePurged> events, CancellationToken cancellationToken) =>
        storage.DeleteAsync(events.Select(e => e.StorageKey).Distinct().ToList(), cancellationToken);
}
