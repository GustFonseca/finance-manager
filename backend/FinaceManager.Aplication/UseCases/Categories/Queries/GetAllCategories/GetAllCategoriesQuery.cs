using FinanceManager.Aplication.DTOs;
using FinanceManager.Aplication.Mediator.Messaging;
using FinanceManager.Domain.Enuns;

namespace FinanceManager.Aplication.UseCases.Categories.Queries.GetAllCategories;

public record GetAllCategoriesQuery(Guid UserId, CategoryType? Type) : IQuery<List<CategoryDto>>;
