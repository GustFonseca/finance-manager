using FinanceManager.Aplication.Analysis;
using FinanceManager.Aplication.Classification;
using FinanceManager.Aplication.DTOs;
using FinanceManager.Aplication.Mediator.Messaging;
using FinanceManager.Aplication.Rates;
using FinanceManager.Domain.Interfaces.Repositories;

namespace FinanceManager.Aplication.UseCases.Summary.Queries.GetAvoidableSpending;

public class GetAvoidableSpendingHandler : IRequestHandler<GetAvoidableSpendingQuery, AvoidableSpendingDto>
{
    private readonly ITransactionRepository _transactionRepository;
    private readonly IClassificationRulesProvider _rulesProvider;
    private readonly IInterestRateProvider _rateProvider;

    public GetAvoidableSpendingHandler(
        ITransactionRepository transactionRepository,
        IClassificationRulesProvider rulesProvider,
        IInterestRateProvider rateProvider)
    {
        _transactionRepository = transactionRepository;
        _rulesProvider = rulesProvider;
        _rateProvider = rateProvider;
    }

    public async Task<AvoidableSpendingDto> Handle(GetAvoidableSpendingQuery request, CancellationToken cancellationToken = default)
    {
        var since = request.MonthStart.AddMonths(-AvoidableSpendingAnalyzer.LookbackMonths);
        var transactions = await _transactionRepository.GetByUserIdAsync(request.UserId, since, request.Now, request.AccountId);
        var rules = await _rulesProvider.GetAsync(cancellationToken);
        var cdi = await _rateProvider.GetCdiAnnualPercentAsync(cancellationToken);
        return AvoidableSpendingAnalyzer.Analyze(transactions, request.MonthStart, request.Now, rules, cdi);
    }
}
