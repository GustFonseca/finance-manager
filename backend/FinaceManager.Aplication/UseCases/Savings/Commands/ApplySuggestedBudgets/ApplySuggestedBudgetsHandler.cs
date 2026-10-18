using FinanceManager.Aplication.Analysis;
using FinanceManager.Aplication.Classification;
using FinanceManager.Aplication.Mediator.Messaging;
using FinanceManager.Domain.Entities;
using FinanceManager.Domain.Interfaces.Repositories;

namespace FinanceManager.Aplication.UseCases.Savings.Commands.ApplySuggestedBudgets;

public class ApplySuggestedBudgetsHandler : IRequestHandler<ApplySuggestedBudgetsCommand, int>
{
    private readonly IClassificationRulesProvider _rulesProvider;
    private readonly ITransactionRepository _transactionRepository;
    private readonly ICategoryRepository _categoryRepository;
    private readonly ICategoryBudgetRepository _budgetRepository;
    private readonly ISavingsPlanRepository _planRepository;

    public ApplySuggestedBudgetsHandler(
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

    public async Task<int> Handle(ApplySuggestedBudgetsCommand request, CancellationToken cancellationToken = default)
    {
        var input = await SavingsAnalysisLoader.LoadAsync(
            request.UserId, request.MonthStart, request.Now,
            _transactionRepository, _categoryRepository, _budgetRepository, _planRepository,
            await _rulesProvider.GetAsync(cancellationToken));
        var plan = SavingsAnalyzer.Analyze(input);
        var existing = (await _budgetRepository.GetByUserIdAsync(request.UserId)).ToDictionary(b => b.CategoryId);

        var applied = 0;
        foreach (var suggestion in plan.Budgets.Where(b => b.SuggestedLimitCents > 0))
        {
            if (existing.TryGetValue(suggestion.CategoryId, out var budget))
            {
                if (budget.LimitCents == suggestion.SuggestedLimitCents) continue;
                budget.LimitCents = suggestion.SuggestedLimitCents;
                budget.UpdatedAt = DateTime.UtcNow;
                await _budgetRepository.UpdateAsync(budget);
            }
            else
            {
                await _budgetRepository.CreateAsync(new CategoryBudget
                {
                    UserId = request.UserId,
                    CategoryId = suggestion.CategoryId,
                    LimitCents = suggestion.SuggestedLimitCents
                });
            }
            applied++;
        }
        return applied;
    }
}
