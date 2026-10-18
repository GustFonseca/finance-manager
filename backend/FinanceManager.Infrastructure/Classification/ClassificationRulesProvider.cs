using FinanceManager.Aplication.Classification;
using FinanceManager.Domain.Interfaces.Repositories;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace FinanceManager.Infrastructure.Classification;

public sealed class ClassificationRulesProvider : IClassificationRulesProvider
{
    public static readonly TimeSpan RefreshEvery = TimeSpan.FromMinutes(5);
    private const string CacheKey = "classification-rules";

    private readonly IMemoryCache _cache;
    private readonly IServiceScopeFactory _scopes;
    private readonly ILogger<ClassificationRulesProvider> _logger;

    public ClassificationRulesProvider(IMemoryCache cache, IServiceScopeFactory scopes, ILogger<ClassificationRulesProvider> logger)
    {
        _cache = cache;
        _scopes = scopes;
        _logger = logger;
    }

    public async Task<ClassificationRules> GetAsync(CancellationToken cancellationToken = default)
    {
        return (await _cache.GetOrCreateAsync(CacheKey, async entry =>
        {
            entry.AbsoluteExpirationRelativeToNow = RefreshEvery;
            using var scope = _scopes.CreateScope();
            var rows = await scope.ServiceProvider.GetRequiredService<IClassificationRuleRepository>().GetActiveAsync();
            var rules = new ClassificationRules(rows);
            foreach (var problem in rules.Problems)
                _logger.LogWarning("Classification rule skipped: {Problem}", problem);
            return rules;
        }))!;
    }
}
