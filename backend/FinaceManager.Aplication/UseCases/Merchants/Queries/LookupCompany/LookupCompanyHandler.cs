using FinanceManager.Aplication.Companies;
using FinanceManager.Aplication.DTOs;
using FinanceManager.Aplication.Mediator.Messaging;

namespace FinanceManager.Aplication.UseCases.Merchants.Queries.LookupCompany;

public class LookupCompanyHandler : IRequestHandler<LookupCompanyQuery, CompanyDto?>
{
    private readonly ICompanyRegistry _registry;

    public LookupCompanyHandler(ICompanyRegistry registry)
    {
        _registry = registry;
    }

    public async Task<CompanyDto?> Handle(LookupCompanyQuery request, CancellationToken cancellationToken = default)
    {
        var cnpj = Cnpj.Digits(request.Cnpj);
        if (cnpj == null) return null;
        try
        {
            var company = await _registry.LookupAsync(cnpj, cancellationToken);
            return company == null ? null : new CompanyDto { Cnpj = cnpj, Name = company.Name, Activity = company.Activity };
        }
        catch (HttpRequestException)
        {
            return null;
        }
    }
}
