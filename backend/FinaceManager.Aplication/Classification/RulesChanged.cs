using FinanceManager.Aplication.Caching;
using FinanceManager.Aplication.Mediator.Messaging;

namespace FinanceManager.Aplication.Classification;

public static class RulesChanged
{
    public static void AfterCommit(IUnitOfWork unitOfWork, IClassificationRulesProvider rulesProvider, IUserDataVersions versions) =>
        unitOfWork.OnCommitted(() =>
        {
            rulesProvider.Invalidate();
            versions.BumpAll();
            return Task.CompletedTask;
        });
}
