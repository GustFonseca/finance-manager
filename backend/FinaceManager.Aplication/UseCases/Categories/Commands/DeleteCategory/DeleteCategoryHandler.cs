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

        // Check for existing transactions
        var transactions = await _transactionRepository.GetByUserIdAsync(request.UserId, null, null);
        if (transactions.Any(t => t.CategoryId == request.CategoryId))
            throw new InvalidOperationException("Cannot delete category with existing transactions");

        await _categoryRepository.DeleteAsync(category);
        return true;
    }
}
