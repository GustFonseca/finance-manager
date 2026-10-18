using FinanceManager.Aplication.Analysis;
using FinanceManager.Aplication.Classification;
using FinanceManager.Aplication.DTOs;
using FinanceManager.Aplication.Mediator.Messaging;
using FinanceManager.Domain.Interfaces.Repositories;

namespace FinanceManager.Aplication.UseCases.Summary.Queries.GetCalendar;

public class GetCalendarHandler : IRequestHandler<GetCalendarQuery, CalendarDto>
{
    private readonly ITransactionRepository _transactionRepository;
    private readonly IClassificationRulesProvider _rulesProvider;

    public GetCalendarHandler(ITransactionRepository transactionRepository, IClassificationRulesProvider rulesProvider)
    {
        _transactionRepository = transactionRepository;
        _rulesProvider = rulesProvider;
    }

    public async Task<CalendarDto> Handle(GetCalendarQuery request, CancellationToken cancellationToken = default)
    {
        var since = request.MonthStart.AddMonths(-PlanningAnalyzer.SeasonalLookbackMonths);
        var transactions = await _transactionRepository.GetByUserIdAsync(request.UserId, since, request.Now);
        var offset = new DateTime(request.MonthStart.Year, request.MonthStart.Month, request.MonthStart.Day, 0, 0, 0, DateTimeKind.Utc) - request.MonthStart;
        return CalendarBuilder.Build(transactions, request.MonthStart, request.Now, offset, await _rulesProvider.GetAsync(cancellationToken));
    }
}
