namespace FinanceManager.Aplication.Companies;

public record CompanyInfo(string ActivityCode, string Activity);

public interface ICompanyRegistry
{
    Task<CompanyInfo?> LookupAsync(string cnpj, CancellationToken cancellationToken = default);
}
