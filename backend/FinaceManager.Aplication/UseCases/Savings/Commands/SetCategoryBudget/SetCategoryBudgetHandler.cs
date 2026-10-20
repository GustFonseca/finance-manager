using FinanceManager.Aplication.Ownership;
using FinanceManager.Aplication.Exceptions;
using FinanceManager.Aplication.Mediator.Messaging;
using FinanceManager.Domain.Entities;
using FinanceManager.Domain.Enuns;
using FinanceManager.Domain.Interfaces.Repositories;

namespace FinanceManager.Aplication.UseCases.Savings.Commands.SetCategoryBudget;

public class SetCategoryBudgetHandler : IRequestHandler<SetCategoryBudgetCommand>
{
    private readonly ICategoryRepository _categoryRepository;
    private readonly ICategoryBudgetRepository _budgetRepository;

    public SetCategoryBudgetHandler(ICategoryRepository categoryRepository, ICategoryBudgetRepository budgetRepository)
    {
        _categoryRepository = categoryRepository;
        _budgetRepository = budgetRepository;
    }

    public async Task Handle(SetCategoryBudgetCommand request, CancellationToken cancellationToken = default)
    {
        var category = await _categoryRepository.GetOwnedAsync(request.CategoryId, request.UserId);
        if (category.Type != CategoryType.EXPENSE)
            throw new BusinessRuleException("Só categorias de despesa têm orçamento.");
        if (request.LimitCents < 0)
            throw new BusinessRuleException("O limite não pode ser negativo.");

        var budget = await _budgetRepository.GetByCategoryIdAsync(request.UserId, request.CategoryId);
        if (request.LimitCents is null or 0)
        {
            if (budget != null) await _budgetRepository.DeleteAsync(budget);
            return;
        }

        if (budget == null)
        {
            await _budgetRepository.CreateAsync(new CategoryBudget
            {
                UserId = request.UserId,
                CategoryId = category.Id,
                LimitCents = request.LimitCents.Value
            });
        }
        else
        {
            budget.LimitCents = request.LimitCents.Value;
            budget.UpdatedAt = DateTime.UtcNow;
            await _budgetRepository.UpdateAsync(budget);
        }
    }
}
