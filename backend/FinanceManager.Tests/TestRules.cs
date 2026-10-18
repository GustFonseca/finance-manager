using FinanceManager.Aplication.Classification;
using FinanceManager.Infrastructure.Classification;

namespace FinanceManager.Tests;

public static class TestRules
{
    public static readonly ClassificationRules Default = new(DefaultClassificationRules.All);

    public static readonly IClassificationRulesProvider Provider = new Fixed(Default);

    private sealed class Fixed(ClassificationRules rules) : IClassificationRulesProvider
    {
        public Task<ClassificationRules> GetAsync(CancellationToken cancellationToken = default) => Task.FromResult(rules);
    }
}
