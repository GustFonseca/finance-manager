using FinanceManager.Aplication.Mediator.Messaging;

namespace FinanceManager.Aplication.UseCases.Savings.Commands.ApplySuggestedBudgets;

/// <summary>Sets every category with spending history to its suggested limit; returns how many were set.</summary>
public record ApplySuggestedBudgetsCommand(Guid UserId, DateTime MonthStart, DateTime Now) : ICommand<int>;
