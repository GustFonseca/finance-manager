using FinanceManager.Aplication.DTOs;
using FinanceManager.Aplication.Mediator.Messaging;

namespace FinanceManager.Aplication.UseCases.Summary.Queries.GetRecurringExpenses;

public record GetRecurringExpensesQuery(Guid UserId, DateTime Now, Guid? AccountId) : IQuery<List<RecurringExpenseDto>>;
