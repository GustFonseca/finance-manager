using FinanceManager.Aplication.Caching;
using Microsoft.Extensions.Caching.Memory;

namespace FinanceManager.Infrastructure.Caching;

public sealed class UserDataVersions : IUserDataVersions
{
    public static readonly TimeSpan KeepFor = TimeSpan.FromDays(1);

    private readonly IMemoryCache _cache;
    private long _global = Random.Shared.NextInt64();

    public UserDataVersions(IMemoryCache cache)
    {
        _cache = cache;
    }

    public string Current(string userId) => $"{Interlocked.Read(ref _global)}.{Interlocked.Read(ref CounterOf(userId).Value)}";

    public void Bump(Guid userId) => Bump(userId.ToString());

    public void Bump(string userId) => Interlocked.Increment(ref CounterOf(userId).Value);

    public void BumpAll() => Interlocked.Increment(ref _global);

    private Counter CounterOf(string userId) =>
        _cache.GetOrCreate(("user-data-version", userId), entry =>
        {
            entry.SlidingExpiration = KeepFor;
            return new Counter { Value = Random.Shared.NextInt64() };
        })!;

    private sealed class Counter
    {
        public long Value;
    }
}
