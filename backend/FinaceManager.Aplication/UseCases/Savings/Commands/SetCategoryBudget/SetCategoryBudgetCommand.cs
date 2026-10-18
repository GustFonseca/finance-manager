using FinanceManager.Aplication.Mediator.Messaging;

namespace FinanceManager.Aplication.UseCases.Savings.Commands.SetCategoryBudget;

public record SetCategoryBudgetCommand(Guid UserId, Guid CategoryId, long? LimitCents) : ICommand<bool>;
