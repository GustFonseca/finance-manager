using FinanceManager.Aplication.Analysis;
using FinanceManager.Aplication.Classification;
using FinanceManager.Aplication.DTOs;
using FinanceManager.Aplication.Mediator.Messaging;
using FinanceManager.Aplication.UseCases.Savings;
using FinanceManager.Domain.Interfaces.Repositories;

namespace FinanceManager.Aplication.UseCases.Planning.Queries.GetEmergencyFund;

public class GetEmergencyFundHandler : IRequestHandler<GetEmergencyFundQuery, EmergencyFundDto>
{
    private readonly ITransactionRepository _transactionRepository;
    private readonly ICategoryRepository _categoryRepository;
    private readonly ICategoryBudgetRepository _budgetRepository;
    private readonly ISavingsPlanRepository _planRepository;
    private readonly IGoalRepository _goalRepository;
    private readonly IClassificationRulesProvider _rulesProvider;

    public GetEmergencyFundHandler(
        ITransactionRepository transactionRepository, ICategoryRepository categoryRepository, ICategoryBudgetRepository budgetRepository,
        ISavingsPlanRepository planRepository, IGoalRepository goalRepository, IClassificationRulesProvider rulesProvider)
    {
        _transactionRepository = transactionRepository;
        _categoryRepository = categoryRepository;
        _budgetRepository = budgetRepository;
        _planRepository = planRepository;
        _goalRepository = goalRepository;
        _rulesProvider = rulesProvider;
    }

    public async Task<EmergencyFundDto> Handle(GetEmergencyFundQuery request, CancellationToken cancellationToken = default)
    {
        var rules = await _rulesProvider.GetAsync(cancellationToken);
        var input = await SavingsAnalysisLoader.LoadAsync(
            request.UserId, request.MonthStart, request.Now, _transactionRepository, _categoryRepository, _budgetRepository, _planRepository, rules);
        var savings = SavingsAnalyzer.Analyze(input);
        var plan = await _planRepository.GetByUserIdAsync(request.UserId);
        var goal = plan?.EmergencyGoalId is { } goalId ? (await _goalRepository.GetByUserIdAsync(request.UserId)).FirstOrDefault(g => g.Id == goalId) : null;
        return PlanningAnalyzer.EmergencyFund(
            input.Transactions, request.MonthStart, rules, plan?.EmergencyMonths ?? PlanningAnalyzer.DefaultEmergencyMonths, goal, savings.AverageSavedCents);
    }
}
