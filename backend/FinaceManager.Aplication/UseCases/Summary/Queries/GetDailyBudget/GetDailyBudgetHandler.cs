using FinanceManager.Aplication.Analysis;
using FinanceManager.Aplication.Classification;
using FinanceManager.Aplication.DTOs;
using FinanceManager.Aplication.Mediator.Messaging;
using FinanceManager.Domain.Enuns;
using FinanceManager.Domain.Interfaces.Repositories;

namespace FinanceManager.Aplication.UseCases.Summary.Queries.GetDailyBudget;

public class GetDailyBudgetHandler : IRequestHandler<GetDailyBudgetQuery, DailyBudgetDto>
{
    private readonly ITransactionRepository _transactionRepository;
    private readonly ICategoryRepository _categoryRepository;
    private readonly ICategoryBudgetRepository _budgetRepository;
    private readonly ISavingsPlanRepository _planRepository;
    private readonly IClassificationRulesProvider _rulesProvider;

    public GetDailyBudgetHandler(
        ITransactionRepository transactionRepository,
        ICategoryRepository categoryRepository,
        ICategoryBudgetRepository budgetRepository,
        ISavingsPlanRepository planRepository,
        IClassificationRulesProvider rulesProvider)
    {
        _transactionRepository = transactionRepository;
        _categoryRepository = categoryRepository;
        _budgetRepository = budgetRepository;
        _planRepository = planRepository;
        _rulesProvider = rulesProvider;
    }

    public async Task<DailyBudgetDto> Handle(GetDailyBudgetQuery request, CancellationToken cancellationToken = default)
    {
        var history = Math.Max(CashFlowForecaster.HistoryMonths, RecurringExpenseDetector.LookbackMonths);
        var transactions = await _transactionRepository.GetByUserIdAsync(request.UserId, request.MonthStart.AddMonths(-history), request.Now);
        var categories = await _categoryRepository.GetByUserIdAndTypeAsync(request.UserId, CategoryType.EXPENSE);
        var budgets = await _budgetRepository.GetByUserIdAsync(request.UserId);
        var plan = await _planRepository.GetByUserIdAsync(request.UserId);
        var rules = await _rulesProvider.GetAsync(cancellationToken);

        return DailyBudgetAnalyzer.Analyze(new DailyBudgetInput(
            transactions,
            categories,
            budgets.ToDictionary(b => b.CategoryId, b => b.LimitCents),
            plan?.MonthlyGoalCents ?? 0,
            WorkValue.Hours(plan),
            request.MonthStart,
            request.Now,
            request.DayStart,
            rules));
    }
}
