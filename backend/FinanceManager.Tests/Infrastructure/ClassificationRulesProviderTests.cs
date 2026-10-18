using FinanceManager.Domain.Entities;
using FinanceManager.Domain.Enuns;
using FinanceManager.Domain.Interfaces.Repositories;
using FinanceManager.Infrastructure.Classification;
using FinanceManager.Infrastructure.Context;
using FinanceManager.Infrastructure.Repositories;
using FinanceManager.Tests.Support;
using Microsoft.Data.Sqlite;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace FinanceManager.Tests.Infrastructure;

public sealed class ClassificationRulesProviderTests : IDisposable
{
    private readonly AppDbContext _db;
    private readonly SqliteConnection _connection;
    private readonly MemoryCache _cache = new(new MemoryCacheOptions());
    private readonly ListLogger<ClassificationRulesProvider> _logger = new();
    private readonly ClassificationRulesProvider _provider;

    public ClassificationRulesProviderTests()
    {
        (_db, _connection) = TestDb.Sqlite();
        var services = new ServiceCollection()
            .AddSingleton(_db)
            .AddScoped<IClassificationRuleRepository, ClassificationRuleRepository>()
            .BuildServiceProvider();
        _provider = new ClassificationRulesProvider(_cache, services.GetRequiredService<IServiceScopeFactory>(), _logger);
    }

    public void Dispose()
    {
        _cache.Dispose();
        _db.Dispose();
        _connection.Dispose();
    }

    [Fact]
    public async Task Loads_the_active_rules_from_the_database()
    {
        var rules = await _provider.GetAsync();

        Assert.Equal("iFood", rules.Brand("ifood"));
        Assert.Equal("Investimentos", rules.OwnMoney("aplicacao rdb"));
        Assert.Empty(rules.Problems);
        Assert.Empty(_logger.Entries);
    }

    [Fact]
    public async Task Caches_the_rules_until_they_expire()
    {
        var first = await _provider.GetAsync();
        _db.ClassificationRules.Add(new ClassificationRule { Type = RuleType.BRAND, Pattern = "padaria x", Value = "Padaria X", Priority = 1 });
        _db.SaveChanges();

        var cached = await _provider.GetAsync();
        _cache.Remove("classification-rules");
        var refreshed = await _provider.GetAsync();

        Assert.Same(first, cached);
        Assert.Null(cached.Brand("padaria x"));
        Assert.Equal("Padaria X", refreshed.Brand("padaria x"));
        Assert.Equal(TimeSpan.FromMinutes(5), ClassificationRulesProvider.RefreshEvery);
    }

    [Fact]
    public async Task Invalid_patterns_are_skipped_and_logged_as_warnings()
    {
        _db.ClassificationRules.Add(new ClassificationRule { Type = RuleType.BRAND, Pattern = "(sem fechar", Value = "Quebrada", Priority = 1 });
        _db.SaveChanges();

        var rules = await _provider.GetAsync();

        var problem = Assert.Single(rules.Problems);
        var (level, message, _) = Assert.Single(_logger.Entries);
        Assert.Equal(LogLevel.Warning, level);
        Assert.Equal($"Classification rule skipped: {problem}", message);
        Assert.Equal("iFood", rules.Brand("ifood"));
    }
}
