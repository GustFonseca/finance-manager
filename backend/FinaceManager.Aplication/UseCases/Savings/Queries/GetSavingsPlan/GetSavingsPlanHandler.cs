using FinanceManager.Aplication.Analysis;
using FinanceManager.Aplication.DTOs;
using FinanceManager.Aplication.Mediator.Messaging;
using FinanceManager.Domain.Interfaces.Repositories;

namespace FinanceManager.Aplication.UseCases.Savings.Queries.GetSavingsPlan;

public class GetSavingsPlanHandler : IRequestHandler<GetSavingsPlanQuery, SavingsPlanDto>
{
    private readonly ITransactionRepository _transactionRepository;
    private readonly ICategoryRepository _categoryRepository;
    private readonly ICategoryBudgetRepository _budgetRepository;
    private readonly ISavingsPlanRepository _planRepository;

    public GetSavingsPlanHandler(
        ITransactionRepository transactionRepository,
        ICategoryRepository categoryRepository,
        ICategoryBudgetRepository budgetRepository,
        ISavingsPlanRepository planRepository)
    {
        _transactionRepository = transactionRepository;
        _categoryRepository = categoryRepository;
        _budgetRepository = budgetRepository;
        _planRepository = planRepository;
    }

    public async Task<SavingsPlanDto> Handle(GetSavingsPlanQuery request, CancellationToken cancellationToken = default)
    {
        var input = await SavingsAnalysisLoader.LoadAsync(
            request.UserId, request.MonthStart, request.Now,
            _transactionRepository, _categoryRepository, _budgetRepository, _planRepository);
        return SavingsAnalyzer.Analyze(input);
    }
}
