using FinanceManager.Aplication.Analysis;
using FinanceManager.Aplication.Classification;
using FinanceManager.Aplication.DTOs;
using FinanceManager.Aplication.Mediator.Messaging;
using FinanceManager.Domain.Interfaces.Repositories;

namespace FinanceManager.Aplication.UseCases.Savings.Queries.GetSavingsPlan;

public class GetSavingsPlanHandler : IRequestHandler<GetSavingsPlanQuery, SavingsPlanDto>
{
    private readonly IClassificationRulesProvider _rulesProvider;
    private readonly ITransactionRepository _transactionRepository;
    private readonly ICategoryRepository _categoryRepository;
    private readonly ICategoryBudgetRepository _budgetRepository;
    private readonly ISavingsPlanRepository _planRepository;

    public GetSavingsPlanHandler(
        ITransactionRepository transactionRepository,
        ICategoryRepository categoryRepository,
        ICategoryBudgetRepository budgetRepository,
        ISavingsPlanRepository planRepository,
        IClassificationRulesProvider rulesProvider)
    {
        _rulesProvider = rulesProvider;
        _transactionRepository = transactionRepository;
        _categoryRepository = categoryRepository;
        _budgetRepository = budgetRepository;
        _planRepository = planRepository;
    }

    public async Task<SavingsPlanDto> Handle(GetSavingsPlanQuery request, CancellationToken cancellationToken = default)
    {
        var rules = await _rulesProvider.GetAsync(cancellationToken);
        var input = await SavingsAnalysisLoader.LoadAsync(
            request.UserId, request.MonthStart, request.Now,
            _transactionRepository, _categoryRepository, _budgetRepository, _planRepository, rules);
        var result = SavingsAnalyzer.Analyze(input);
        var plan = await _planRepository.GetByUserIdAsync(request.UserId);
        result.WorkHoursPerMonth = WorkValue.Hours(plan);
        result.HourValueCents = WorkValue.HourCents(input.Transactions, request.MonthStart, result.WorkHoursPerMonth, rules);
        return result;
    }
}
