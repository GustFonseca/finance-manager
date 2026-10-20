using FinanceManager.Aplication.Mappings;
using FinanceManager.Aplication.DTOs;
using FinanceManager.Aplication.Mediator.Messaging;
using FinanceManager.Domain.Interfaces.Repositories;

namespace FinanceManager.Aplication.UseCases.Categories.Queries.GetAllCategories;

public class GetAllCategoriesHandler : IRequestHandler<GetAllCategoriesQuery, List<CategoryDto>>
{
    private readonly ICategoryRepository _categoryRepository;

    public GetAllCategoriesHandler(ICategoryRepository categoryRepository)
    {
        _categoryRepository = categoryRepository;
    }

    public async Task<List<CategoryDto>> Handle(GetAllCategoriesQuery request, CancellationToken cancellationToken = default)
    {
        var categories = request.Type.HasValue
            ? await _categoryRepository.GetByUserIdAndTypeAsync(request.UserId, request.Type.Value)
            : await _categoryRepository.GetByUserIdAsync(request.UserId);

        return categories.Select(x => x.ToDto()).ToList();
    }
}
