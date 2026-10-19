namespace FinanceManager.Aplication.Companies;

public record CompanyInfo(string ActivityCode, string Activity, string? Name = null);

public interface ICompanyRegistry
{
    Task<CompanyInfo?> LookupAsync(string cnpj, CancellationToken cancellationToken = default);
}
