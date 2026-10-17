using FinanceManager.Aplication.DTOs;
using FinanceManager.Aplication.Mediator.Messaging;

namespace FinanceManager.Aplication.UseCases.Savings.Queries.GetSavingsPlan;

/// <summary>The plan for the month starting at <paramref name="MonthStart"/> (the user's local midnight), as of <paramref name="Now"/>.</summary>
public record GetSavingsPlanQuery(Guid UserId, DateTime MonthStart, DateTime Now) : IQuery<SavingsPlanDto>;
