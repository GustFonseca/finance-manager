using FinanceManager.Aplication.Caching;
using FinanceManager.Aplication.Mediator.Messaging;
using FinanceManager.Domain.Events;

namespace FinanceManager.Aplication.Classification;

public sealed class ClassificationRulesChangedHandler(IClassificationRulesProvider rulesProvider, IUserDataVersions versions)
    : IDomainEventHandler<ClassificationRulesChanged>
{
    public Task Handle(IReadOnlyList<ClassificationRulesChanged> events, CancellationToken cancellationToken)
    {
        rulesProvider.Invalidate();
        versions.BumpAll();
        return Task.CompletedTask;
    }
}
