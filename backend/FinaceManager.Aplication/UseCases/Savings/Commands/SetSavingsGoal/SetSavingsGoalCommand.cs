using FinanceManager.Aplication.Mediator.Messaging;

namespace FinanceManager.Aplication.UseCases.Savings.Commands.SetSavingsGoal;

public record SetSavingsGoalCommand(Guid UserId, long MonthlyGoalCents) : ICommand<long>;
