using FinanceManager.Aplication.Analysis;
using FinanceManager.Aplication.DTOs;
using FinanceManager.Aplication.Mediator.Messaging;
using FinanceManager.Domain.Interfaces.Repositories;

namespace FinanceManager.Aplication.UseCases.Summary.Queries.GetRecurringExpenses;

public class GetRecurringExpensesHandler : IRequestHandler<GetRecurringExpensesQuery, List<RecurringExpenseDto>>
{
    private readonly ITransactionRepository _transactionRepository;

    public GetRecurringExpensesHandler(ITransactionRepository transactionRepository)
    {
        _transactionRepository = transactionRepository;
    }

    public async Task<List<RecurringExpenseDto>> Handle(GetRecurringExpensesQuery request, CancellationToken cancellationToken = default)
    {
        var since = request.Now.AddMonths(-RecurringExpenseDetector.LookbackMonths);
        var transactions = await _transactionRepository.GetByUserIdAsync(request.UserId, since, request.Now, request.AccountId);
        return RecurringExpenseDetector.Detect(transactions, request.Now);
    }
}
