using FinanceManager.Aplication.Mediator.Messaging;

namespace FinanceManager.Aplication.UseCases.Savings.Commands.ApplySuggestedBudgets;

public record ApplySuggestedBudgetsCommand(Guid UserId, DateTime MonthStart, DateTime Now) : ICommand<int>;
