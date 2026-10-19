using FinanceManager.Aplication.Validation;
using AutoMapper;
using FinanceManager.Aplication.DTOs;
using FinanceManager.Aplication.Mediator.Messaging;
using FinanceManager.Domain.Interfaces.Repositories;

namespace FinanceManager.Aplication.UseCases.Categories.Commands.UpdateCategory;

public class UpdateCategoryHandler : IRequestHandler<UpdateCategoryCommand, CategoryDto?>
{
    private readonly ICategoryRepository _categoryRepository;
    private readonly IMapper _mapper;

    public UpdateCategoryHandler(ICategoryRepository categoryRepository, IMapper mapper)
    {
        _categoryRepository = categoryRepository;
        _mapper = mapper;
    }

    public async Task<CategoryDto?> Handle(UpdateCategoryCommand request, CancellationToken cancellationToken = default)
    {
        var category = await _categoryRepository.GetByIdAsync(request.CategoryId);
        if (category == null || category.UserId != request.UserId) return null;

        Input.Defined(request.Type, "Tipo de categoria inválido.");
        category.Name = Input.Name(request.Name);
        category.Type = request.Type;
        category.Color = Input.Color(request.Color);
        await _categoryRepository.UpdateAsync(category);

        return _mapper.Map<CategoryDto>(category);
    }
}
