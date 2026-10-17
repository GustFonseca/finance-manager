using FinanceManager.Aplication.Mediator.Messaging;

namespace FinanceManager.Aplication.UseCases.Savings.Commands.SetCategoryBudget;

/// <summary>Sets the monthly limit of an expense category; null or zero removes it. False when the category isn't the user's.</summary>
public record SetCategoryBudgetCommand(Guid UserId, Guid CategoryId, long? LimitCents) : ICommand<bool>;
