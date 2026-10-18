namespace FinanceManager.Aplication.Classification;

public interface IClassificationRulesProvider
{
    Task<ClassificationRules> GetAsync(CancellationToken cancellationToken = default);
}
