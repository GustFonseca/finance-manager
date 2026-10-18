using FinanceManager.Aplication.Analysis;
using FinanceManager.Aplication.Classification;
using FinanceManager.Aplication.DTOs;
using FinanceManager.Aplication.Mediator.Messaging;
using FinanceManager.Domain.Interfaces.Repositories;

namespace FinanceManager.Aplication.UseCases.Summary.Queries.GetCashFlowForecast;

public class GetCashFlowForecastHandler : IRequestHandler<GetCashFlowForecastQuery, CashFlowForecastDto>
{
    private readonly ITransactionRepository _transactionRepository;
    private readonly IClassificationRulesProvider _rulesProvider;

    public GetCashFlowForecastHandler(ITransactionRepository transactionRepository, IClassificationRulesProvider rulesProvider)
    {
        _transactionRepository = transactionRepository;
        _rulesProvider = rulesProvider;
    }

    public async Task<CashFlowForecastDto> Handle(GetCashFlowForecastQuery request, CancellationToken cancellationToken = default)
    {
        var since = request.MonthStart.AddMonths(-Math.Max(CashFlowForecaster.HistoryMonths, RecurringExpenseDetector.LookbackMonths));
        var transactions = await _transactionRepository.GetByUserIdAsync(request.UserId, since, request.Now, request.AccountId);
        var rules = await _rulesProvider.GetAsync(cancellationToken);
        return CashFlowForecaster.Forecast(transactions, request.MonthStart, request.Now, rules);
    }
}
