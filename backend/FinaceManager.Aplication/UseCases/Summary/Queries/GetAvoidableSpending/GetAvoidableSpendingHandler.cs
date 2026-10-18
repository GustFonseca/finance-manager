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
    private readonly ISavingsPlanRepository _planRepository;
    private readonly IInsightDismissalRepository _dismissalRepository;
    private readonly ISubscriptionDecisionRepository _decisionRepository;

    public GetAvoidableSpendingHandler(
        ITransactionRepository transactionRepository,
        IClassificationRulesProvider rulesProvider,
        IInterestRateProvider rateProvider,
        ISavingsPlanRepository planRepository,
        IInsightDismissalRepository dismissalRepository,
        ISubscriptionDecisionRepository decisionRepository)
    {
        _transactionRepository = transactionRepository;
        _rulesProvider = rulesProvider;
        _rateProvider = rateProvider;
        _planRepository = planRepository;
        _dismissalRepository = dismissalRepository;
        _decisionRepository = decisionRepository;
    }

    public async Task<AvoidableSpendingDto> Handle(GetAvoidableSpendingQuery request, CancellationToken cancellationToken = default)
    {
        var since = request.MonthStart.AddMonths(-AvoidableSpendingAnalyzer.LookbackMonths);
        var transactions = await _transactionRepository.GetByUserIdAsync(request.UserId, since, request.Now, request.AccountId);
        var rules = await _rulesProvider.GetAsync(cancellationToken);
        var cdi = await _rateProvider.GetCdiAnnualPercentAsync(cancellationToken);
        var context = new AvoidableContext(
            await _dismissalRepository.GetKeysAsync(request.UserId),
            (await _decisionRepository.GetByUserIdAsync(request.UserId)).ToDictionary(d => d.MerchantKey),
            await _rateProvider.GetInflation12MonthsPercentAsync(cancellationToken));
        var result = AvoidableSpendingAnalyzer.Analyze(transactions, request.MonthStart, request.Now, rules, cdi, context);
        var plan = await _planRepository.GetByUserIdAsync(request.UserId);
        result.HourValueCents = WorkValue.HourCents(transactions, request.MonthStart, WorkValue.Hours(plan), rules);
        return result;
    }
}
