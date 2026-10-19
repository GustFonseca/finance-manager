using FinanceManager.Aplication.DTOs;
using FinanceManager.Aplication.Mediator.Messaging;

namespace FinanceManager.Aplication.UseCases.Merchants.Queries.LookupCompany;

public record LookupCompanyQuery(string Cnpj) : IQuery<CompanyDto?>;
