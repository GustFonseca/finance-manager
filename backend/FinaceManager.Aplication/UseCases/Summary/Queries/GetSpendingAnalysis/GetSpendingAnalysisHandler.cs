using FinanceManager.Aplication.Analysis;
using FinanceManager.Aplication.DTOs;
using FinanceManager.Aplication.Mediator.Messaging;
using FinanceManager.Domain.Interfaces.Repositories;

namespace FinanceManager.Aplication.UseCases.Summary.Queries.GetSpendingAnalysis;

public class GetSpendingAnalysisHandler : IRequestHandler<GetSpendingAnalysisQuery, SpendingAnalysisDto>
{
    private readonly ITransactionRepository _transactionRepository;

    public GetSpendingAnalysisHandler(ITransactionRepository transactionRepository)
    {
        _transactionRepository = transactionRepository;
    }

    public async Task<SpendingAnalysisDto> Handle(GetSpendingAnalysisQuery request, CancellationToken cancellationToken = default)
    {
        var since = request.MonthStart.AddMonths(-(SpendingAnalyzer.TrendMonths - 1));
        var transactions = await _transactionRepository.GetByUserIdAsync(request.UserId, since, request.Now, request.AccountId);
        return SpendingAnalyzer.Analyze(transactions, request.MonthStart, request.Now);
    }
}
