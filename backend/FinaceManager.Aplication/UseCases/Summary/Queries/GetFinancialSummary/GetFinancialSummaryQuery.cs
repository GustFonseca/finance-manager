using FinanceManager.Aplication.DTOs;
using FinanceManager.Aplication.Mediator.Messaging;

namespace FinanceManager.Aplication.UseCases.Summary.Queries.GetFinancialSummary;

public record GetFinancialSummaryQuery(Guid UserId, DateTime? Start, DateTime? End) : IQuery<FinancialSummaryDto>;
