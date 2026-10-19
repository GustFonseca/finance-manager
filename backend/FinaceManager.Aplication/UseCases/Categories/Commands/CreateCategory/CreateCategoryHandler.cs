using FinanceManager.Aplication.Validation;
using AutoMapper;
using FinanceManager.Aplication.DTOs;
using FinanceManager.Aplication.Mediator.Messaging;
using FinanceManager.Domain.Entities;
using FinanceManager.Domain.Interfaces.Repositories;

namespace FinanceManager.Aplication.UseCases.Categories.Commands.CreateCategory;

public class CreateCategoryHandler : IRequestHandler<CreateCategoryCommand, CategoryDto>
{
    private readonly ICategoryRepository _categoryRepository;
    private readonly IMapper _mapper;

    public CreateCategoryHandler(ICategoryRepository categoryRepository, IMapper mapper)
    {
        _categoryRepository = categoryRepository;
        _mapper = mapper;
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
        return _mapper.Map<CategoryDto>(category);
    }
}
