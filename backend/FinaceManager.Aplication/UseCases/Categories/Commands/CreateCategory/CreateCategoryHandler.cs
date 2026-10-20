using FinanceManager.Aplication.Mappings;
using FinanceManager.Aplication.Validation;
using FinanceManager.Aplication.DTOs;
using FinanceManager.Aplication.Mediator.Messaging;
using FinanceManager.Domain.Entities;
using FinanceManager.Domain.Interfaces.Repositories;

namespace FinanceManager.Aplication.UseCases.Categories.Commands.CreateCategory;

public class CreateCategoryHandler : IRequestHandler<CreateCategoryCommand, CategoryDto>
{
    private readonly ICategoryRepository _categoryRepository;

    public CreateCategoryHandler(ICategoryRepository categoryRepository)
    {
        _categoryRepository = categoryRepository;
    }

    public async Task<CategoryDto> Handle(CreateCategoryCommand request, CancellationToken cancellationToken = default)
    {
        Input.Defined(request.Type, "Tipo de categoria inválido.");
        var category = new Category
        {
            UserId = request.UserId,
            Name = Input.Name(request.Name),
            Type = request.Type,
            Color = Input.Color(request.Color)
        };

        await _categoryRepository.CreateAsync(category);
        return category.ToDto();
    }
}
