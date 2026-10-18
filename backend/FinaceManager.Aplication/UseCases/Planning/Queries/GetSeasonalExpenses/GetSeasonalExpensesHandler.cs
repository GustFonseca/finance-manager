using FinanceManager.Aplication.Analysis;
using FinanceManager.Aplication.Classification;
using FinanceManager.Aplication.DTOs;
using FinanceManager.Aplication.Mediator.Messaging;
using FinanceManager.Domain.Interfaces.Repositories;

namespace FinanceManager.Aplication.UseCases.Planning.Queries.GetSeasonalExpenses;

public class GetSeasonalExpensesHandler : IRequestHandler<GetSeasonalExpensesQuery, SeasonalExpensesDto>
{
    private readonly ITransactionRepository _transactionRepository;
    private readonly IClassificationRulesProvider _rulesProvider;

    public GetSeasonalExpensesHandler(ITransactionRepository transactionRepository, IClassificationRulesProvider rulesProvider)
    {
        _transactionRepository = transactionRepository;
        _rulesProvider = rulesProvider;
    }

    public async Task<SeasonalExpensesDto> Handle(GetSeasonalExpensesQuery request, CancellationToken cancellationToken = default)
    {
        var transactions = await _transactionRepository.GetByUserIdAsync(
            request.UserId, request.MonthStart.AddMonths(-PlanningAnalyzer.SeasonalLookbackMonths), request.Now);
        return PlanningAnalyzer.Seasonal(transactions, request.MonthStart, request.Now, await _rulesProvider.GetAsync(cancellationToken));
    }
}
