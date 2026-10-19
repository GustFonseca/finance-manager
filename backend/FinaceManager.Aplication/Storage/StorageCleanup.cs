using FinanceManager.Aplication.Mediator.Messaging;

namespace FinanceManager.Aplication.Storage;

public static class StorageCleanup
{
    public static void AfterCommit(IUnitOfWork unitOfWork, IFileStorage storage, IReadOnlyCollection<string> keys)
    {
        if (keys.Count == 0) return;
        unitOfWork.OnCommitted(() => storage.DeleteAsync(keys, CancellationToken.None));
    }
}
