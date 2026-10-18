namespace FinanceManager.Aplication.Rates;

public interface IInterestRateProvider
{
    Task<decimal> GetCdiAnnualPercentAsync(CancellationToken cancellationToken = default);
    Task<decimal> GetInflation12MonthsPercentAsync(CancellationToken cancellationToken = default);
}
