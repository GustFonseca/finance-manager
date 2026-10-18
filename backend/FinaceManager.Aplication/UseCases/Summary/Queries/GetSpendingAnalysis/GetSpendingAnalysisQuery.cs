using FinanceManager.Aplication.DTOs;
using FinanceManager.Aplication.Mediator.Messaging;

namespace FinanceManager.Aplication.UseCases.Summary.Queries.GetSpendingAnalysis;

public record GetSpendingAnalysisQuery(Guid UserId, DateTime MonthStart, DateTime Now, Guid? AccountId) : IQuery<SpendingAnalysisDto>;
