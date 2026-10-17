using FinanceManager.Aplication.Analysis;
using FinanceManager.Domain.Enuns;
using FinanceManager.Domain.Interfaces.Repositories;

namespace FinanceManager.Aplication.UseCases.Savings;

/// <summary>Gathers everything the savings analysis needs; shared by the plan query and "apply suggestions".</summary>
public static class SavingsAnalysisLoader
{
    public static async Task<SavingsAnalysisInput> LoadAsync(
        Guid userId,
        DateTime monthStart,
        DateTime now,
        ITransactionRepository transactionRepository,
        ICategoryRepository categoryRepository,
        ICategoryBudgetRepository budgetRepository,
        ISavingsPlanRepository planRepository)
    {
        // Enough history for both the averages and the recurring-charge detection.
        var historyMonths = Math.Max(SavingsAnalyzer.HistoryMonths, RecurringExpenseDetector.LookbackMonths);
        var transactions = await transactionRepository.GetByUserIdAsync(userId, monthStart.AddMonths(-historyMonths), now);
        var categories = await categoryRepository.GetByUserIdAndTypeAsync(userId, CategoryType.EXPENSE);
        var budgets = await budgetRepository.GetByUserIdAsync(userId);
        var plan = await planRepository.GetByUserIdAsync(userId);

        return new SavingsAnalysisInput(
            transactions,
            categories,
            budgets.ToDictionary(b => b.CategoryId, b => b.LimitCents),
            plan?.MonthlyGoalCents ?? 0,
            monthStart,
            now,
            RecurringExpenseDetector.Detect(transactions, now));
    }
}
