using FinanceManager.Aplication.DTOs;
using FinanceManager.Aplication.Mediator.Messaging;
using FinanceManager.Domain.Enuns;
using FinanceManager.Domain.Interfaces.Repositories;

namespace FinanceManager.Aplication.UseCases.Summary.Queries.GetFinancialSummary;

public class GetFinancialSummaryHandler : IRequestHandler<GetFinancialSummaryQuery, FinancialSummaryDto>
{
    private readonly ITransactionRepository _transactionRepository;

    public GetFinancialSummaryHandler(ITransactionRepository transactionRepository)
    {
        _transactionRepository = transactionRepository;
    }

    public async Task<FinancialSummaryDto> Handle(GetFinancialSummaryQuery request, CancellationToken cancellationToken = default)
    {
        var transactions = await _transactionRepository.GetByUserIdAsync(request.UserId, request.Start, request.End);

        var totalIncome = transactions.Where(t => t.Type == TransactionType.INCOME).Sum(t => t.AmountCents);
        var totalExpense = transactions.Where(t => t.Type == TransactionType.EXPENSE).Sum(t => t.AmountCents);

        var byCategory = transactions
            .GroupBy(t => new { t.CategoryId, t.Category.Name, t.Category.Color })
            .Select(g => new CategorySummaryDto
            {
                CategoryId = g.Key.CategoryId,
                CategoryName = g.Key.Name,
                Color = g.Key.Color,
                TotalCents = g.Sum(t => t.AmountCents)
            })
            .OrderByDescending(c => c.TotalCents)
            .ToList();

        return new FinancialSummaryDto
        {
            TotalIncomeCents = totalIncome,
            TotalExpenseCents = totalExpense,
            BalanceCents = totalIncome - totalExpense,
            ByCategory = byCategory
        };
    }
}
