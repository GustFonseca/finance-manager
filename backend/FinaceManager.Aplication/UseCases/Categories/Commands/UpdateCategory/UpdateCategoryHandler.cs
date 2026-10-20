using FinanceManager.Aplication.Mappings;
using FinanceManager.Aplication.Ownership;
using FinanceManager.Aplication.Validation;
using FinanceManager.Aplication.DTOs;
using FinanceManager.Aplication.Mediator.Messaging;
using FinanceManager.Domain.Interfaces.Repositories;

namespace FinanceManager.Aplication.UseCases.Categories.Commands.UpdateCategory;

public class UpdateCategoryHandler : IRequestHandler<UpdateCategoryCommand, CategoryDto>
{
    private readonly ICategoryRepository _categoryRepository;

    public UpdateCategoryHandler(ICategoryRepository categoryRepository)
    {
        _categoryRepository = categoryRepository;
    }

    public async Task<CategoryDto> Handle(UpdateCategoryCommand request, CancellationToken cancellationToken = default)
    {
        var category = await _categoryRepository.GetOwnedAsync(request.CategoryId, request.UserId);

        Input.Defined(request.Type, "Tipo de categoria inválido.");
        category.Name = Input.Name(request.Name);
        category.Type = request.Type;
        category.Color = Input.Color(request.Color);
        await _categoryRepository.UpdateAsync(category);

        return category.ToDto();
    }
}
