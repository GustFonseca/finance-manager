namespace FinanceManager.Aplication.Rates;

public interface IInterestRateProvider
{
    Task<decimal> GetCdiAnnualPercentAsync(CancellationToken cancellationToken = default);
}
