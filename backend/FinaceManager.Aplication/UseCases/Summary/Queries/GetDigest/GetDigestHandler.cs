using FinanceManager.Aplication.Analysis;
using FinanceManager.Aplication.Classification;
using FinanceManager.Aplication.DTOs;
using FinanceManager.Aplication.Mediator.Messaging;
using FinanceManager.Domain.Interfaces.Repositories;

namespace FinanceManager.Aplication.UseCases.Summary.Queries.GetDigest;

public class GetDigestHandler : IRequestHandler<GetDigestQuery, DigestDto>
{
    private readonly ITransactionRepository _transactionRepository;
    private readonly IGoalRepository _goalRepository;
    private readonly IClassificationRulesProvider _rulesProvider;

    public GetDigestHandler(ITransactionRepository transactionRepository, IGoalRepository goalRepository, IClassificationRulesProvider rulesProvider)
    {
        _transactionRepository = transactionRepository;
        _goalRepository = goalRepository;
        _rulesProvider = rulesProvider;
    }

    public async Task<DigestDto> Handle(GetDigestQuery request, CancellationToken cancellationToken = default)
    {
        var weekBack = request.DayStart.AddDays(1 - 2 * DigestAnalyzer.WeekDays);
        var monthBack = request.MonthStart.AddMonths(-1);
        var since = weekBack < monthBack ? weekBack : monthBack;
        var transactions = await _transactionRepository.GetByUserIdAsync(request.UserId, since, request.Now);
        var goals = await _goalRepository.GetByUserIdAsync(request.UserId);
        var rules = await _rulesProvider.GetAsync(cancellationToken);
        return DigestAnalyzer.Build(transactions, goals, request.MonthStart, request.Now, request.DayStart, rules);
    }
}
