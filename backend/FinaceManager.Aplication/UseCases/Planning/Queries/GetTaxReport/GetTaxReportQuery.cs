using FinanceManager.Aplication.DTOs;
using FinanceManager.Aplication.Mediator.Messaging;

namespace FinanceManager.Aplication.UseCases.Planning.Queries.GetTaxReport;

public record GetTaxReportQuery(Guid UserId, int Year) : IQuery<TaxReportDto>;
