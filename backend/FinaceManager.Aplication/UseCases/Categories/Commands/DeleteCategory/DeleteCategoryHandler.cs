using FinanceManager.Aplication.Exceptions;
using FinanceManager.Aplication.Mediator.Messaging;
using FinanceManager.Domain.Interfaces.Repositories;

namespace FinanceManager.Aplication.UseCases.Categories.Commands.DeleteCategory;

public class DeleteCategoryHandler : IRequestHandler<DeleteCategoryCommand, bool>
{
    private readonly ICategoryRepository _categoryRepository;
    private readonly ITransactionRepository _transactionRepository;

    public DeleteCategoryHandler(ICategoryRepository categoryRepository, ITransactionRepository transactionRepository)
    {
        _categoryRepository = categoryRepository;
        _transactionRepository = transactionRepository;
    }

    public async Task<bool> Handle(DeleteCategoryCommand request, CancellationToken cancellationToken = default)
    {
        var category = await _categoryRepository.GetByIdAsync(request.CategoryId);
        if (category == null || category.UserId != request.UserId) return false;

        if (await _transactionRepository.ExistsForCategoryAsync(request.CategoryId))
            throw new BusinessRuleException("Não é possível excluir uma categoria que tem transações. Mude a categoria delas antes (em Estabelecimentos).");

        await _categoryRepository.DeleteAsync(category);
        return true;
    }
}
