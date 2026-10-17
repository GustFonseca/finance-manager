using FinanceManager.Aplication.DTOs;
using FinanceManager.Aplication.Mediator.Messaging;

namespace FinanceManager.Aplication.UseCases.Summary.Queries.GetSpendingAnalysis;

/// <summary>The spending dashboard for the month starting at <paramref name="MonthStart"/>, optionally of one account.</summary>
public record GetSpendingAnalysisQuery(Guid UserId, DateTime MonthStart, DateTime Now, Guid? AccountId) : IQuery<SpendingAnalysisDto>;
