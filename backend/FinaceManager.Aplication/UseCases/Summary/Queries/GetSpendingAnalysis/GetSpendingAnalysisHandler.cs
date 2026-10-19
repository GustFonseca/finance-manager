using FinanceManager.Aplication.Analysis;
using FinanceManager.Aplication.Classification;
using FinanceManager.Aplication.DTOs;
using FinanceManager.Aplication.Mediator.Messaging;
using FinanceManager.Domain.Interfaces.Repositories;

namespace FinanceManager.Aplication.UseCases.Summary.Queries.GetSpendingAnalysis;

public class GetSpendingAnalysisHandler : IRequestHandler<GetSpendingAnalysisQuery, SpendingAnalysisDto>
{
    private readonly IClassificationRulesProvider _rulesProvider;
    private readonly ITransactionRepository _transactionRepository;

    public GetSpendingAnalysisHandler(ITransactionRepository transactionRepository, IClassificationRulesProvider rulesProvider)
    {
        _rulesProvider = rulesProvider;
        _transactionRepository = transactionRepository;
    }

    public async Task<SpendingAnalysisDto> Handle(GetSpendingAnalysisQuery request, CancellationToken cancellationToken = default)
    {
        var since = request.MonthStart.AddMonths(-Math.Max(SpendingAnalyzer.TrendMonths - 1, AvoidableSpendingAnalyzer.LookbackMonths));
        var transactions = await _transactionRepository.GetByUserIdAsync(request.UserId, since, request.Now, request.AccountId);
        var rules = await _rulesProvider.GetAsync(cancellationToken);
        return SpendingAnalyzer.Analyze(transactions, request.MonthStart, request.Now, rules);
    }
}
