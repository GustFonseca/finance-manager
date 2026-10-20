using FinanceManager.Aplication.Caching;
using FinanceManager.Aplication.Mediator.Messaging;
using FinanceManager.Domain.Events;

namespace FinanceManager.Aplication.UseCases.Merchants;

public sealed class MerchantEnrichedHandler(IUserDataVersions versions) : IDomainEventHandler<MerchantEnriched>
{
    public Task Handle(IReadOnlyList<MerchantEnriched> events, CancellationToken cancellationToken)
    {
        foreach (var userId in events.Select(e => e.UserId).Distinct()) versions.Bump(userId);
        return Task.CompletedTask;
    }
}
