using FinanceManager.Aplication.DTOs;
using FinanceManager.Aplication.Mediator.Messaging;

namespace FinanceManager.Aplication.UseCases.Summary.Queries.GetRecurringExpenses;

/// <summary>Fixed costs and subscriptions up to <paramref name="Now"/>, optionally of one account.</summary>
public record GetRecurringExpensesQuery(Guid UserId, DateTime Now, Guid? AccountId) : IQuery<List<RecurringExpenseDto>>;
