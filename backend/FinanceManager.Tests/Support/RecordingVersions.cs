using FinanceManager.Aplication.Caching;

namespace FinanceManager.Tests.Support;

public sealed class RecordingVersions(List<Guid> bumped) : IUserDataVersions
{
    public int All { get; private set; }

    public void Bump(Guid userId) => bumped.Add(userId);

    public void BumpAll() => All++;
}
